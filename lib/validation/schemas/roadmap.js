/**
 * Roadmap Validation Schemas
 * 
 * Schemas for AI-generated learning roadmaps.
 */

import { z } from 'zod';
import { sanitizedString } from './common.js';

/**
 * Create roadmap validation
 * Used in lib/actions/roadmap.js - createRoadmap()
 */
export const createRoadmapSchema = z.object({
  title: sanitizedString(3, 100),
  prompt: sanitizedString(10, 500),
});

/**
 * Roadmap search/filter validation
 */
export const roadmapFilterSchema = z.object({
  search: z.string().max(200).optional(),
  author: z.string().max(100).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(20).optional().default(10),
});

