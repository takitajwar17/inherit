/**
 * Single Quest API
 * 
 * GET /api/quests/[questId]
 * 
 * Retrieves details for a specific quest.
 */

import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import logger, { logDatabase } from "@/lib/logger";
import { isValidMongoId } from "@/lib/validation";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { ValidationError, NotFoundError } from "@/lib/errors";

/**
 * GET /api/quests/[questId] - Get quest details
 */
export async function GET(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    // Validate quest ID parameter
    if (!isValidMongoId(params.questId)) {
      throw new ValidationError("Invalid quest ID format");
    }

    await connect();
    logDatabase("findById", "Quest", { questId: params.questId });
    
    const quest = await Quest.findById(params.questId).select(
      "name level timeLimit questions startTime endTime"
    );

    if (!quest) {
      throw new NotFoundError("Quest", params.questId);
    }

    // Log quest details for debugging
    logger.debug("Quest details retrieved", {
      questId: quest._id,
      startTime: quest.startTime,
      endTime: quest.endTime,
      timeLimit: quest.timeLimit,
      requestId
    });

    return successResponse(quest.toObject());
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
