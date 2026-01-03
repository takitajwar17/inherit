/**
 * User Quests API
 * 
 * GET /api/quests/user
 * 
 * Retrieves quest data categorized by status for the authenticated user.
 */

import { auth } from "@clerk/nextjs";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import Attempt from "@/lib/models/attemptModel";
import logger, { logDatabase } from "@/lib/logger";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { AuthenticationError } from "@/lib/errors";

/**
 * GET /api/quests/user - Get user's quest data (categorized)
 */
export async function GET() {
  const requestId = generateRequestId();
  
  try {
    const { userId } = auth();
    if (!userId) {
      throw new AuthenticationError("Authentication required");
    }

    await connect();
    logDatabase("find", "Quest", { operation: "user_quests", userId });

    // Get all quests and attempts for the user
    const quests = await Quest.find({});
    const attempts = await Attempt.find({ userId });

    // Get current date for comparing with startDate and endDate
    const now = new Date();

    // Categorize quests
    const active = [];
    const completed = [];
    const recent = [];

    quests.forEach((quest) => {
      const questAttempts = attempts.filter(
        (a) => a.questId.toString() === quest._id.toString()
      );
      const isCompleted = questAttempts.some((a) => a.status === "completed");
      const startTime = new Date(quest.startTime);
      const endTime = new Date(quest.endTime);

      if (isCompleted) {
        completed.push({
          ...quest.toObject(),
          attempts: questAttempts,
        });
        // Add to recent if completed in last 7 days
        const lastAttempt = questAttempts[questAttempts.length - 1];
        if (
          lastAttempt &&
          now - new Date(lastAttempt.updatedAt) <= 7 * 24 * 60 * 60 * 1000
        ) {
          recent.push({
            name: quest.name,
            type: "Quest Completed",
            date: lastAttempt.updatedAt,
          });
        }
      } else if (startTime <= now && endTime >= now) {
        active.push({
          ...quest.toObject(),
          attempts: questAttempts,
        });
      }
    });

    // Calculate learning streak (basic implementation)
    const history = attempts
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((attempt) => ({
        date: new Date(attempt.updatedAt).toISOString().split("T")[0],
        status: attempt.status,
      }));

    recent.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    logger.debug("User quests retrieved", { 
      userId, 
      activeCount: active.length, 
      completedCount: completed.length,
      requestId
    });

    return successResponse({
      active,
      completed,
      recent: recent.slice(0, 5),
      history,
    });
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
