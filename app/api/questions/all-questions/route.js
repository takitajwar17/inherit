/**
 * Questions API
 * 
 * GET /api/questions/all-questions
 * 
 * Retrieves all questions, categorized by ownership.
 */

import Question from "@/lib/models/questionModel";
import User from "@/lib/models/userModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import logger, { logDatabase } from "@/lib/logger";

export async function GET() {
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user to get the userName
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      logger.warn("User not found for questions request", { clerkId: userId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userName = user.userName;
    logDatabase("find", "Question", { userName });

    // Fetch questions authored by the user
    const ownedQuestions = await Question.find({ author: userName })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch questions not authored by the user
    const otherQuestions = await Question.find({ author: { $ne: userName } })
      .lean()
      .sort({ createdAt: -1 });

    // Remove popularNow from backend response
    const questions = {
      owned: ownedQuestions,
      others: otherQuestions,
    };

    logger.debug("Questions fetched", { 
      userId, 
      ownedCount: ownedQuestions.length, 
      othersCount: otherQuestions.length 
    });

    return NextResponse.json(questions);
  } catch (error) {
    logger.error("Error fetching questions", { error: error.message });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
