/**
 * Quest Validation Schemas
 * 
 * Schemas for quest management and attempt endpoints.
 */

import { z } from 'zod';
import { mongoIdSchema, sanitizedString, safeContent, positiveInt, nonNegativeInt } from './common.js';

/**
 * Test case schema for coding questions
 */
const testCaseSchema = z.object({
  input: z.string()
    .max(5000, 'Test case input must be at most 5000 characters'),
  expectedOutput: z.string()
    .max(5000, 'Expected output must be at most 5000 characters'),
});

/**
 * Multiple choice option schema
 */
const optionSchema = z.string()
  .min(1, 'Option cannot be empty')
  .max(500, 'Option must be at most 500 characters');

/**
 * Question schema for quest creation (base without refinements)
 */
const questionBaseSchema = z.object({
  title: sanitizedString(1, 200),
  description: safeContent(10000),
  type: z.enum(['coding', 'short-answer', 'multiple-choice'], {
    errorMap: () => ({ message: 'Type must be coding, short-answer, or multiple-choice' })
  }),
  points: positiveInt.max(100, 'Points must be at most 100'),
  // Conditional fields based on type
  testCases: z.array(testCaseSchema)
    .max(20, 'Maximum 20 test cases allowed')
    .optional(),
  options: z.array(optionSchema)
    .max(10, 'Maximum 10 options allowed')
    .optional(),
  correctAnswer: z.string()
    .max(5000, 'Correct answer must be at most 5000 characters')
    .optional(),
});

/**
 * Question schema with refinements for creation
 */
const questionSchema = questionBaseSchema.refine(
  (data) => {
    // Coding questions should have test cases
    if (data.type === 'coding') {
      return data.testCases && data.testCases.length > 0;
    }
    return true;
  },
  { message: 'Coding questions must have at least one test case', path: ['testCases'] }
).refine(
  (data) => {
    // Multiple choice questions should have options
    if (data.type === 'multiple-choice') {
      return data.options && data.options.length >= 2;
    }
    return true;
  },
  { message: 'Multiple choice questions must have at least 2 options', path: ['options'] }
);

/**
 * Base quest schema without cross-field refinements
 * Used for partial() in update schema
 */
const questBaseSchema = z.object({
  name: sanitizedString(1, 100),
  description: safeContent(5000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Level must be beginner, intermediate, or advanced' })
  }),
  timeLimit: positiveInt
    .max(480, 'Time limit cannot exceed 480 minutes (8 hours)'),
  startTime: z.string()
    .datetime({ message: 'Invalid start time format' }),
  endTime: z.string()
    .datetime({ message: 'Invalid end time format' }),
  isActive: z.boolean().optional().default(true),
  questions: z.array(questionBaseSchema)
    .min(1, 'Quest must have at least one question')
    .max(50, 'Quest cannot have more than 50 questions'),
});

/**
 * Create quest validation with cross-field refinements
 * POST /api/admin/quests
 */
export const createQuestSchema = questBaseSchema.refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Update quest validation (all fields optional)
 * Uses base schema without refinements to allow .partial()
 * PUT /api/admin/quests/[id]
 */
export const updateQuestSchema = questBaseSchema.partial();

/**
 * Create attempt validation
 * POST /api/attempts
 */
export const createAttemptSchema = z.object({
  questId: mongoIdSchema,
});

/**
 * Single answer schema for submission
 */
const answerSchema = z.object({
  questionId: mongoIdSchema,
  answer: z.string()
    .max(50000, 'Answer must be at most 50000 characters'), // Allow large code answers
});

/**
 * Submit attempt validation
 * POST /api/attempts/[attemptId]/submit
 */
export const submitAttemptSchema = z.object({
  answers: z.array(answerSchema)
    .min(1, 'At least one answer is required')
    .max(50, 'Cannot submit more than 50 answers'),
});
