/**
 * Socket/Pusher API Handler
 * 
 * Handles real-time collaboration events for the playground feature.
 */

import { pusher } from '../../lib/pusher';
import logger from '../../lib/logger';
import { validateRequest, socketEventSchema } from '../../lib/validation';

// Store collaborators for each room
const roomCollaborators = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Validate request body with Zod schema
  const validation = validateRequest(socketEventSchema, req.body);
  if (!validation.success) {
    logger.warn("Socket event validation failed", { error: validation.error });
    return res.status(400).json({ 
      message: 'Validation failed',
      error: validation.error,
    });
  }

  const { roomId, userId, username, event, data } = validation.data;

  try {
    // Handle code updates
    if (event === 'codeUpdate') {
      logger.debug("Code update triggered", {
        channel: `presence-room-${roomId}`,
        user: username || userId,
        contentLength: data?.length || 0
      });

      await pusher.trigger(
        `presence-room-${roomId}`,
        event,
        { userId, username, data }
      );
    }

    res.status(200).json({ 
      message: 'Event sent',
      channel: `presence-room-${roomId}`,
      event,
    });
  } catch (error) {
    logger.error("Pusher error", { error: error.message, roomId, event });
    res.status(500).json({ 
      message: 'Error sending event',
      error: error.message,
    });
  }
}
