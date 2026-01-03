/**
 * Validation Module
 * 
 * Central module for request validation using Zod schemas.
 * Provides helper functions and re-exports all schemas.
 */

import { z } from 'zod';
import logger from '@/lib/logger';

/**
 * Validates data against a Zod schema
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {{ success: boolean, data?: Object, error?: string, errors?: Array }}
 * 
 * @example
 * const result = validateRequest(adminLoginSchema, { username: 'admin', password: 'pass' });
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const { username, password } = result.data; // Sanitized & typed
 */
export function validateRequest(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v4 uses 'issues' instead of 'errors'
      const zodErrors = error.issues || error.errors || [];
      const errors = zodErrors.map(e => ({
        field: e.path?.join('.') || '',
        message: e.message || 'Validation error',
      }));
      const errorMessage = errors.length > 0
        ? errors.map(e => e.field ? `${e.field}: ${e.message}` : e.message).join(', ')
        : 'Validation failed';
      
      logger.warn('Request validation failed', { 
        errors,
        errorCount: errors.length 
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errors 
      };
    }
    // Re-throw non-Zod errors
    throw error;
  }
}

/**
 * Validates data and returns the validated data or throws
 * Use when you want exceptions to be handled by try/catch
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Object} Validated and transformed data
 * @throws {z.ZodError} If validation fails
 */
export function validateOrThrow(schema, data) {
  return schema.parse(data);
}

/**
 * Validates URL parameter as MongoDB ObjectId
 * 
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid MongoDB ObjectId format
 * 
 * @example
 * if (!isValidMongoId(params.id)) {
 *   return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
 * }
 */
export function isValidMongoId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Creates a validation error response
 * Helper for consistent error responses
 * 
 * @param {string} message - Error message
 * @param {Array} errors - Optional array of field errors
 * @returns {Object} Error response object
 */
export function validationErrorResponse(message, errors = null) {
  const response = { error: message };
  if (errors) {
    response.details = errors;
  }
  return response;
}

// ============================================
// Re-export all schemas for easy importing
// ============================================

// Common schemas
export { 
  mongoIdSchema, 
  sanitizedString, 
  safeContent,
  optionalString,
  positiveInt,
  nonNegativeInt,
  emailSchema,
  urlSchema,
} from './schemas/common.js';

// Auth schemas
export { adminLoginSchema } from './schemas/auth.js';

// Quest schemas
export { 
  createQuestSchema, 
  updateQuestSchema, 
  createAttemptSchema, 
  submitAttemptSchema 
} from './schemas/quest.js';

// Question schemas
export { 
  createQuestionSchema, 
  replySchema, 
  questionFilterSchema 
} from './schemas/question.js';

// Roadmap schemas
export { 
  createRoadmapSchema, 
  roadmapFilterSchema 
} from './schemas/roadmap.js';

// Socket schemas
export { 
  socketEventSchema, 
  roomIdSchema 
} from './schemas/socket.js';

// Media schemas
export { 
  voiceCommandSchema, 
  videoSearchSchema, 
  videoIdSchema 
} from './schemas/media.js';

