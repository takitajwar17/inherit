import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import Attempt from "@/lib/models/attemptModel";
import logger, { logDatabase } from "@/lib/logger";

/**
 * User Quests API
 * 
 * GET /api/quests/user
 * 
 * Retrieves quest data categorized by status for the authenticated user.
 */
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      completedCount: completed.length 
    });

    return NextResponse.json({
      active,
      completed,
      recent: recent.slice(0, 5),
      history,
    });
  } catch (error) {
    logger.error("Error in GET /api/quests/user", { error: error.message });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
