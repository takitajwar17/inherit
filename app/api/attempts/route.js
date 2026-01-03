/**
 * Quest Attempts API
 * 
 * POST /api/attempts
 * 
 * Creates a new attempt for a quest.
 */

import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import Attempt from '@/lib/models/attemptModel';
import { auth } from '@clerk/nextjs';
import logger, { logDatabase, events } from '@/lib/logger';
import { validateRequest, createAttemptSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/ratelimit/middleware';
import { attemptLimiter } from '@/lib/ratelimit/limiters';
import { getUserIdentifier } from '@/lib/ratelimit';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from '@/lib/errors/apiResponse';
import { 
  ValidationError, 
  AuthenticationError,
  NotFoundError,
  ConflictError 
} from '@/lib/errors';

/**
 * Handles POST requests for creating quest attempts
 * @param {Request} request - The incoming request
 * @returns {NextResponse} JSON response with attempt data or error
 */
async function handlePost(request) {
  const requestId = generateRequestId();
  
  try {
    await connect();
    
    // Verify user authentication
    const { userId } = auth();
    if (!userId) {
      throw new AuthenticationError('Authentication required');
    }

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(createAttemptSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { questId } = validation.data;
    logDatabase("findById", "Quest", { questId, operation: "create_attempt" });

    // Check if quest exists
    const quest = await Quest.findById(questId);
    if (!quest) {
      throw new NotFoundError('Quest', questId);
    }

    // Check if quest is still active
    const now = new Date();
    const endTime = new Date(quest.endTime);
    if (now >= endTime) {
      logger.warn("Attempt on ended quest", { questId, endTime });
      throw new ValidationError('This quest has ended');
    }

    // Check for existing attempts
    const existingAttempt = await Attempt.findOne({
      userId,
      questId,
      status: { $in: ['in-progress', 'completed'] }
    });

    if (existingAttempt) {
      throw new ConflictError('You have already attempted this quest');
    }

    // Create new attempt
    const attempt = new Attempt({
      userId,
      questId,
      startTime: now,
      endTime: endTime,
      status: 'in-progress',
      totalPoints: 0,
      maxPoints: quest.questions.reduce((total, q) => total + q.points, 0),
      answers: []
    });

    await attempt.save();
    
    logger.info("Quest attempt created", { 
      userId, 
      questId, 
      attemptId: attempt._id,
      requestId 
    });
    events.questAttempted(userId, questId);

    return successResponse(attempt);
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (10 requests per minute, user-based)
export const POST = withRateLimit(attemptLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});

