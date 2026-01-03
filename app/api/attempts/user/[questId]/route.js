/**
 * User Quest Attempt API
 * 
 * GET /api/attempts/user/[questId]
 * 
 * Retrieves the most recent attempt for a user on a specific quest.
 */

import { connect } from '@/lib/mongodb/mongoose';
import Attempt from '@/lib/models/attemptModel';
import { auth } from '@clerk/nextjs';
import logger, { logDatabase } from '@/lib/logger';
import { isValidMongoId } from '@/lib/validation';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from '@/lib/errors/apiResponse';
import { 
  ValidationError, 
  AuthenticationError 
} from '@/lib/errors';

/**
 * GET /api/attempts/user/[questId] - Get user's attempt for a quest
 */
export async function GET(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    await connect();
    
    const { userId } = auth();
    if (!userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Validate quest ID parameter
    if (!isValidMongoId(params.questId)) {
      throw new ValidationError("Invalid quest ID format");
    }

    logDatabase("findOne", "Attempt", { userId, questId: params.questId });

    // Find the most recent attempt for this user and quest
    const attempt = await Attempt.findOne({
      userId,
      questId: params.questId,
      status: { $in: ['in-progress', 'completed'] }
    }).sort({ createdAt: -1 });

    if (!attempt) {
      logger.debug("No attempt found for user quest", { 
        userId, 
        questId: params.questId,
        requestId 
      });
      // Return null instead of error for "no attempt found" case
      return successResponse(null);
    }

    logger.debug("User attempt retrieved", { 
      userId, 
      questId: params.questId, 
      attemptStatus: attempt.status,
      requestId
    });

    return successResponse(attempt.toObject());
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
