/**
 * Authentication Validation Schemas
 * 
 * Schemas for admin authentication endpoints.
 */

import { z } from 'zod';

/**
 * Admin login request validation
 * POST /api/admin/auth
 */
export const adminLoginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be at most 50 characters')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters'),
});

