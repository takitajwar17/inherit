// pages/api/socket.js
import { pusher } from '../../lib/pusher';

// Store collaborators for each room
const roomCollaborators = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, userId, username, event, data } = req.body;

  if (!roomId || !userId || !event) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      required: { roomId, userId, event },
    });
  }

  try {
    // Handle collaborator joining/leaving
    if (event === 'join-room') {
      if (!roomCollaborators.has(roomId)) {
        roomCollaborators.set(roomId, new Map());
      }
      roomCollaborators.get(roomId).set(userId, {
        username: username || 'Anonymous',
        timestamp: Date.now()
      });
      
      const collaborators = Array.from(roomCollaborators.get(roomId).entries()).map(([id, data]) => ({ 
        userId: id,
        username: data.username,
        timestamp: data.timestamp
      }));
      
      console.log(`User ${username || userId} joined room ${roomId}. Current collaborators:`, collaborators);
      
      await pusher.trigger(
        `room-${roomId}`,
        'collaboratorsUpdate',
        collaborators
      );
    } 
    else if (event === 'leave-room') {
      if (roomCollaborators.has(roomId)) {
        roomCollaborators.get(roomId).delete(userId);
        
        const collaborators = Array.from(roomCollaborators.get(roomId).entries()).map(([id, data]) => ({ 
          userId: id,
          username: data.username,
          timestamp: data.timestamp
        }));
        
        console.log(`User ${username || userId} left room ${roomId}. Current collaborators:`, collaborators);
        
        if (roomCollaborators.get(roomId).size === 0) {
          roomCollaborators.delete(roomId);
        } else {
          await pusher.trigger(
            `room-${roomId}`,
            'collaboratorsUpdate',
            collaborators
          );
        }
      }
    }
    // Handle code updates
    else if (event === 'codeUpdate') {
      console.log('Triggering code update:', {
        channel: `room-${roomId}`,
        user: username || userId,
        contentLength: data?.length || 0
      });

      await pusher.trigger(
        `room-${roomId}`,
        event,
        { userId, username, data }
      );
    }

    res.status(200).json({ 
      message: 'Event sent',
      channel: `room-${roomId}`,
      event,
    });
  } catch (error) {
    console.error('Pusher error:', error);
    res.status(500).json({ 
      message: 'Error sending event',
      error: error.message,
    });
  }
}
