/**
 * Attempt Details API
 * 
 * GET /api/attempts/[attemptId]
 * 
 * Retrieves details for a specific attempt.
 */

import { connect } from '@/lib/mongodb/mongoose';
import Attempt from '@/lib/models/attemptModel';
import logger, { logDatabase } from '@/lib/logger';
import { isValidMongoId } from '@/lib/validation';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from '@/lib/errors/apiResponse';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * GET /api/attempts/[attemptId] - Get attempt details
 */
export async function GET(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.attemptId)) {
      throw new ValidationError("Invalid attempt ID format");
    }

    await connect();
    
    logDatabase("findById", "Attempt", { attemptId: params.attemptId });
    const attempt = await Attempt.findById(params.attemptId)
      .populate('questId', 'name level timeLimit');

    if (!attempt) {
      throw new NotFoundError("Attempt", params.attemptId);
    }

    logger.debug("Attempt details retrieved", { 
      attemptId: params.attemptId, 
      status: attempt.status,
      requestId
    });

    return successResponse(attempt.toObject());
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
