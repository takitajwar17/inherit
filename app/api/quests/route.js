/**
 * Public Quests API
 * 
 * GET /api/quests
 * 
 * Retrieves all active quests for public access.
 */

import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import logger, { logDatabase } from '@/lib/logger';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from '@/lib/errors/apiResponse';

/**
 * GET /api/quests - Get all active quests (public)
 */
export async function GET() {
  const requestId = generateRequestId();
  
  try {
    await connect();
    logDatabase("find", "Quest", { filter: "isActive" });

    // Only fetch active quests for public access
    const quests = await Quest.find({ isActive: true })
      .select('name level timeLimit questions startTime endTime')
      .sort({ startTime: 1 });

    logger.debug("Public quests fetched", { count: quests.length, requestId });
    
    return successResponse(quests.map(q => q.toObject()));
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
