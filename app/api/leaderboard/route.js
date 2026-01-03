/**
 * Leaderboard API
 * 
 * GET /api/leaderboard
 * 
 * Retrieves the top 10 users based on quest scores.
 */

import { connect } from "@/lib/mongodb/mongoose";
import Attempt from "@/lib/models/attemptModel";
import User from "@/lib/models/userModel";
import { currentUser } from "@clerk/nextjs";
import logger, { logDatabase } from "@/lib/logger";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";

/**
 * GET /api/leaderboard - Get top 10 users by quest scores
 */
export async function GET() {
  const requestId = generateRequestId();
  
  try {
    await connect();
    logDatabase("aggregate", "Attempt", { operation: "leaderboard" });

    // Get leaderboard data
    const leaderboardData = await Attempt.aggregate([
      {
        $match: {
          status: "completed"
        }
      },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$totalPoints" },
          questsCompleted: { $sum: 1 },
          averageScore: { $avg: { $divide: ["$totalPoints", "$maxPoints"] } }
        }
      },
      {
        $sort: { totalScore: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get current user for their IDs
    const user = await currentUser();
    
    // Get all unique user IDs from leaderboard
    const userIds = leaderboardData.map(entry => entry._id);
    
    // Fetch users from the database
    const users = await User.find({ clerkId: { $in: userIds } }, { clerkId: 1, userName: 1 });
    
    // Create a map of clerkId to username for quick lookup
    const userMap = new Map(users.map(u => [u.clerkId, u.userName]));

    // Combine leaderboard data with usernames
    const leaderboard = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: user?.id === entry._id,
      username: userMap.get(entry._id) || entry._id.slice(0, 8) + "..."
    }));

    logger.debug("Leaderboard fetched", { entries: leaderboard.length, requestId });
    
    return successResponse(leaderboard);
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
