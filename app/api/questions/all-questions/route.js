// app/api/questions/all-questions/route.js

import Question from "@/lib/models/questionModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs"; // Adjust if using a different auth provider
import { NextResponse } from "next/server";

// app/api/questions/all-questions/route.js

export async function GET() {
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch questions authored by the user
    const ownedQuestions = await Question.find({ author: userId }).lean();

    // Fetch questions not authored by the user
    const otherQuestions = await Question.find({
      author: { $ne: userId },
    }).lean();

    // No need to exclude any fields; ensure voters is included

    const questions = {
      owned: ownedQuestions,
      others: otherQuestions,
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
