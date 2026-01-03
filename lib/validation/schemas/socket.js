/**
 * Socket/Real-time Validation Schemas
 * 
 * Schemas for Pusher-based real-time collaboration events.
 */

import { z } from 'zod';

/**
 * Socket event types
 */
export const socketEventTypes = ['join-room', 'leave-room', 'codeUpdate'];

/**
 * Socket event validation
 * POST /pages/api/socket
 */
export const socketEventSchema = z.object({
  roomId: z.string()
    .min(1, 'Room ID is required')
    .max(50, 'Room ID must be at most 50 characters')
    .trim()
    .refine(
      str => /^[a-zA-Z0-9-_]+$/.test(str),
      { message: 'Room ID can only contain letters, numbers, hyphens, and underscores' }
    ),
  userId: z.string()
    .min(1, 'User ID is required')
    .max(100, 'User ID must be at most 100 characters'),
  username: z.string()
    .max(100, 'Username must be at most 100 characters')
    .optional(),
  event: z.enum(['join-room', 'leave-room', 'codeUpdate'], {
    errorMap: () => ({ message: 'Event must be join-room, leave-room, or codeUpdate' })
  }),
  data: z.string()
    .max(100000, 'Code data must be at most 100KB') // Max 100KB for code
    .optional(),
});

/**
 * Room ID parameter validation
 */
export const roomIdSchema = z.string()
  .min(1, 'Room ID is required')
  .max(50, 'Room ID must be at most 50 characters')
  .refine(
    str => /^[a-zA-Z0-9-_]+$/.test(str),
    { message: 'Invalid room ID format' }
  );

