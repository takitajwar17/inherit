// app/api/questions/all-questions/route.js

import Question from "@/lib/models/questionModel";
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

    // Fetch questions authored by the user
    const ownedQuestions = await Question.find({ author: userId });

    // Fetch questions not authored by the user
    const otherQuestions = await Question.find({ author: { $ne: userId } });

    // Combine both owned and other questions
    const questions = {
      owned: ownedQuestions,
      others: otherQuestions,
    };

    // If there are no questions at all, return a suitable message
    if (ownedQuestions.length === 0 && otherQuestions.length === 0) {
      return NextResponse.json({
        message: "No questions found.",
      });
    }

    // Return the combined question details
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
