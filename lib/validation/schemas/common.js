/**
 * Common Validation Schemas
 * 
 * Shared schemas used across multiple validation modules.
 * Includes MongoDB ObjectId validation and sanitized string helpers.
 */

import { z } from 'zod';

/**
 * MongoDB ObjectId validation schema
 * Validates 24-character hexadecimal strings
 */
export const mongoIdSchema = z.string()
  .min(1, 'ID is required')
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format - must be a valid MongoDB ObjectId');

/**
 * Creates a sanitized string schema that:
 * - Trims whitespace
 * - Enforces min/max length
 * - Blocks potential XSS patterns
 * 
 * @param {number} min - Minimum length (default: 1)
 * @param {number} max - Maximum length (default: 1000)
 * @returns {z.ZodString} Zod string schema
 */
export const sanitizedString = (min = 1, max = 1000) => 
  z.string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .transform(str => str.trim())
    .refine(str => !/<script[\s\S]*?>[\s\S]*?<\/script>/i.test(str), {
      message: 'Script tags are not allowed'
    })
    .refine(str => !/javascript:/i.test(str), {
      message: 'JavaScript protocol is not allowed'
    })
    .refine(str => !/on\w+\s*=/i.test(str), {
      message: 'Event handlers are not allowed'
    });

/**
 * Creates a safe content schema for longer text that may contain formatting
 * Less restrictive than sanitizedString but still enforces size limits
 * 
 * @param {number} max - Maximum length (default: 10000)
 * @returns {z.ZodString} Zod string schema
 */
export const safeContent = (max = 10000) =>
  z.string()
    .max(max, `Content must be at most ${max} characters`)
    .transform(str => str.trim());

/**
 * Optional string that can be empty or undefined
 */
export const optionalString = z.string().optional();

/**
 * Positive integer validation
 */
export const positiveInt = z.number()
  .int('Must be a whole number')
  .positive('Must be a positive number');

/**
 * Non-negative integer validation (0 or greater)
 */
export const nonNegativeInt = z.number()
  .int('Must be a whole number')
  .min(0, 'Cannot be negative');

/**
 * Email validation schema
 */
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email too long');

/**
 * URL validation schema
 */
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2000, 'URL too long');

