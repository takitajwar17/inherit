/**
 * Admin Quest Management API (Single Quest)
 * 
 * GET /api/admin/quests/[id] - Get a specific quest
 * PUT /api/admin/quests/[id] - Update a quest
 * DELETE /api/admin/quests/[id] - Delete a quest
 * 
 * Protected by admin authentication.
 */

import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import { adminAuth } from "@/lib/middleware/adminAuth";
import logger, { logDatabase, events } from "@/lib/logger";
import { validateRequest, updateQuestSchema, isValidMongoId } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { adminQuestLimiter } from "@/lib/ratelimit/limiters";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId,
  noContentResponse 
} from "@/lib/errors/apiResponse";
import { ValidationError, NotFoundError } from "@/lib/errors";

/**
 * GET /api/admin/quests/[id] - Get a specific quest
 */
export const GET = adminAuth(async (req, { params }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      throw new ValidationError("Invalid quest ID format");
    }

    await connect();
    logDatabase("findById", "Quest", { questId: params.id });
    
    const quest = await Quest.findById(params.id);
    
    if (!quest) {
      throw new NotFoundError("Quest", params.id);
    }

    return successResponse(quest.toObject());
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
});

/**
 * PUT /api/admin/quests/[id] - Update a quest
 * Rate limited: 20 operations per minute
 */
const handlePut = adminAuth(async (req, { params }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      throw new ValidationError("Invalid quest ID format");
    }

    const body = await req.json();

    // Validate request body with Zod schema (partial for updates)
    const validation = validateRequest(updateQuestSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    await connect();
    logDatabase("findByIdAndUpdate", "Quest", { questId: params.id });
    
    const quest = await Quest.findByIdAndUpdate(
      params.id,
      { ...validation.data },
      { new: true, runValidators: true }
    );

    if (!quest) {
      throw new NotFoundError("Quest", params.id);
    }

    logger.info("Quest updated", { 
      questId: params.id, 
      questName: quest.name,
      requestId 
    });
    events.questUpdated(quest._id);

    return successResponse(quest.toObject());
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
});

/**
 * DELETE /api/admin/quests/[id] - Delete a quest
 * Rate limited: 20 operations per minute
 */
const handleDelete = adminAuth(async (req, { params }) => {
  const requestId = generateRequestId();
  
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      throw new ValidationError("Invalid quest ID format");
    }

    await connect();
    logDatabase("findByIdAndDelete", "Quest", { questId: params.id });
    
    const quest = await Quest.findByIdAndDelete(params.id);
    
    if (!quest) {
      throw new NotFoundError("Quest", params.id);
    }

    logger.info("Quest deleted", { 
      questId: params.id, 
      questName: quest.name,
      requestId 
    });
    events.questDeleted(params.id);

    return successResponse({ message: "Quest deleted successfully" });
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
});

// Export with rate limiting (20 operations per minute)
export const PUT = withRateLimit(adminQuestLimiter, handlePut);
export const DELETE = withRateLimit(adminQuestLimiter, handleDelete);
