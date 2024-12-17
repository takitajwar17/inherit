// pages/api/socket.js
import { pusher } from '../../lib/pusher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { roomId, userId, event, data } = req.body;

  if (!roomId || !userId || !event) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      required: { roomId, userId, event },
    });
  }

  try {
    console.log('Triggering Pusher event:', {
      channel: `room-${roomId}`,
      event,
      data: { userId, data },
    });

    await pusher.trigger(
      `room-${roomId}`,
      event,
      { userId, data },
      { 
        socket_id: req.body.socket_id 
      }
    );

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
