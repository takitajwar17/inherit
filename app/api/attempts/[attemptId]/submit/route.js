/**
 * Submit Quest Attempt API
 * 
 * POST /api/attempts/[attemptId]/submit
 * 
 * Submits answers for a quest attempt and triggers AI evaluation.
 */

import { connect } from "@/lib/mongodb/mongoose";
import Attempt from "@/lib/models/attemptModel";
import { submitQuestAttempt } from "@/lib/actions/quest";
import { auth } from "@clerk/nextjs";
import logger, { logDatabase, events } from "@/lib/logger";
import { validateRequest, submitAttemptSchema, isValidMongoId } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { submitLimiter } from "@/lib/ratelimit/limiters";
import { getUserIdentifier } from "@/lib/ratelimit";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError 
} from "@/lib/errors";

/**
 * POST /api/attempts/[attemptId]/submit - Submit quest answers
 * Rate limited: 5 submissions per minute per user
 */
async function handlePost(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    const { userId } = auth();
    if (!userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Validate attemptId parameter
    if (!isValidMongoId(params.attemptId)) {
      throw new ValidationError("Invalid attempt ID format");
    }

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(submitAttemptSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { answers } = validation.data;
    await connect();

    logDatabase("findById", "Attempt", { attemptId: params.attemptId, operation: "submit" });
    const attempt = await Attempt.findById(params.attemptId);
    if (!attempt) {
      throw new NotFoundError("Attempt", params.attemptId);
    }

    logger.info("Quest submission started", { 
      attemptId: params.attemptId, 
      answerCount: answers.length,
      requestId
    });
    events.aiEvaluationStarted(params.attemptId);

    const startTime = Date.now();
    
    // Get AI evaluation for each answer
    const result = await submitQuestAttempt(params.attemptId, answers);

    const duration = Date.now() - startTime;
    events.aiEvaluationCompleted(params.attemptId, duration);

    // Update attempt with answers and their individual AI evaluations
    attempt.answers = answers.map(answer => {
      const evaluation = result.evaluations.find(e => e.questionId === answer.questionId);
      return {
        questionId: answer.questionId,
        answer: answer.answer,
        submittedAt: new Date(),
        aiEvaluation: evaluation.evaluation
      };
    });

    // Update total points based on sum of all evaluations
    attempt.totalPoints = result.totalScore;
    attempt.status = "completed";
    attempt.endTime = new Date();
    
    await attempt.save();
    
    logger.info("Quest submission completed", { 
      attemptId: params.attemptId, 
      totalScore: result.totalScore,
      maxPoints: attempt.maxPoints,
      evaluationDuration: duration,
      requestId
    });
    events.questCompleted(userId, attempt.questId, result.totalScore);

    return successResponse({ attempt });

  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (5 submissions per minute, user-based)
export const POST = withRateLimit(submitLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});
