/**
 * Question Validation Schemas
 * 
 * Schemas for Dev Discuss Q&A feature.
 */

import { z } from 'zod';
import { sanitizedString, safeContent } from './common.js';

/**
 * Tag validation - lowercase alphanumeric with hyphens
 */
const tagSchema = z.string()
  .min(1, 'Tag cannot be empty')
  .max(30, 'Tag must be at most 30 characters')
  .trim()
  .toLowerCase()
  .refine(
    str => /^[a-z0-9-]+$/.test(str),
    { message: 'Tags can only contain lowercase letters, numbers, and hyphens' }
  );

/**
 * Create question validation
 * Used in lib/actions/question.js - createQuestion()
 */
export const createQuestionSchema = z.object({
  title: sanitizedString(10, 200),
  description: safeContent(10000)
    .refine(str => str.length >= 20, {
      message: 'Description must be at least 20 characters'
    }),
  tags: z.array(tagSchema)
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed'),
  aiAnswerRequested: z.boolean().optional().default(false),
});

/**
 * Reply to question validation
 * POST /api/questions/[id]/reply
 */
export const replySchema = z.object({
  content: safeContent(10000)
    .refine(str => str.length >= 10, {
      message: 'Reply must be at least 10 characters'
    }),
});

/**
 * Question search/filter validation
 */
export const questionFilterSchema = z.object({
  search: z.string().max(200).optional(),
  tags: z.array(tagSchema).max(10).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(10),
  sortBy: z.enum(['newest', 'oldest', 'votes']).optional().default('newest'),
});

