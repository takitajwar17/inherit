/**
 * Admin Quests Management API
 * 
 * GET /api/admin/quests - List all quests
 * POST /api/admin/quests - Create a new quest
 * 
 * Protected by admin authentication.
 */

import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import { adminAuth } from "@/lib/middleware/adminAuth";
import logger, { logDatabase, events } from "@/lib/logger";
import { validateRequest, createQuestSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { adminQuestLimiter } from "@/lib/ratelimit/limiters";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { ValidationError } from "@/lib/errors";

/**
 * GET /api/admin/quests - List all quests
 */
export const GET = adminAuth(async () => {
  const requestId = generateRequestId();
  
  try {
    await connect();
    logDatabase("find", "Quest", { operation: "admin_list_all" });
    
    const quests = await Quest.find({}).sort({ createdAt: -1 });
    
    logger.debug("Admin fetched all quests", { count: quests.length, requestId });
    return successResponse(quests.map((quest) => quest.toObject()));
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
});

/**
 * POST /api/admin/quests - Create a new quest
 * Rate limited: 20 operations per minute
 */
const handlePost = adminAuth(async (req) => {
  const requestId = generateRequestId();
  
  try {
    await connect();
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = validateRequest(createQuestSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const questData = validation.data;

    // Log the incoming data
    logger.info("Creating new quest", { 
      questName: questData.name, 
      questionCount: questData.questions.length,
      requestId
    });
    logger.debug("Quest data received", { questData });

    const quest = await Quest.create({
      ...questData,
      createdBy: "admin",
    });

    // Log the created quest
    logger.info("Quest created successfully", { 
      questId: quest._id, 
      questName: quest.name,
      requestId
    });
    events.questCreated(quest._id, quest.name);

    return successResponse(quest.toObject(), 201);
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
});

export const POST = withRateLimit(adminQuestLimiter, handlePost);
