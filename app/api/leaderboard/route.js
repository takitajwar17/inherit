import { connect } from "@/lib/mongodb/mongoose";
import Attempt from "@/lib/models/attemptModel";
import User from "@/lib/models/userModel";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";

export async function GET() {
  try {
    await connect();

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
    const userMap = new Map(users.map(user => [user.clerkId, user.userName]));

    // Combine leaderboard data with usernames
    const leaderboard = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: user?.id === entry._id,
      username: userMap.get(entry._id) || entry._id.slice(0, 8) + "..." // Fallback to truncated ID if username not found
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
