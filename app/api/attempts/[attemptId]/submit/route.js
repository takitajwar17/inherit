import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Attempt from "@/lib/models/attemptModel";
import { submitQuestAttempt } from "@/lib/actions/quest";
import { auth } from "@clerk/nextjs";

export async function POST(request, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { answers } = await request.json();
    await connect();

    const attempt = await Attempt.findById(params.attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Get AI evaluation
    const evaluation = await submitQuestAttempt(params.attemptId, answers);

    // Update attempt with answers and AI evaluation
    attempt.answers = answers.map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer,
      submittedAt: new Date(),
      aiEvaluation: {
        score: evaluation.evaluation.score,
        feedback: evaluation.evaluation.feedback,
        evaluatedAt: evaluation.evaluation.evaluatedAt
      }
    }));

    // Calculate total points based on AI evaluation
    attempt.totalPoints = evaluation.evaluation.score;
    attempt.status = "completed";
    attempt.endTime = new Date();
    
    await attempt.save();
    return NextResponse.json({ success: true, attempt });

  } catch (error) {
    console.error("Error in submit route:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
