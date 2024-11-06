// app/api/questions/all-questions/route.js

import Question from "@/lib/models/questionModel";
import User from "@/lib/models/userModel"; // Import User model
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs"; // Adjust if using a different auth provider
import { NextResponse } from "next/server";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userName = user.userName; // Get the userName

    // Fetch questions authored by the user using userName
    const ownedQuestions = await Question.find({ author: userName })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch questions not authored by the user
    const otherQuestions = await Question.find({
      author: { $ne: userName },
    })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch all questions
    const allQuestions = await Question.find({}).lean();

    // Calculate weighted score and sort questions
    const popularNow = allQuestions
      .map((question) => ({
        ...question,
        score: question.votes + question.answers * 2, // Calculate weighted score
      }))
      .sort((a, b) => b.score - a.score); // Sort by score in descending order

    const questions = {
      owned: ownedQuestions,
      others: otherQuestions,
      popularNow, // Update popularNow with the new array
    };

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}