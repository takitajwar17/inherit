/**
 * Submit Quest Attempt API
 * 
 * POST /api/attempts/[attemptId]/submit
 * 
 * Submits answers for a quest attempt and triggers AI evaluation.
 */

import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Attempt from "@/lib/models/attemptModel";
import { submitQuestAttempt } from "@/lib/actions/quest";
import { auth } from "@clerk/nextjs";
import logger, { logDatabase, events } from "@/lib/logger";

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

    logDatabase("findById", "Attempt", { attemptId: params.attemptId, operation: "submit" });
    const attempt = await Attempt.findById(params.attemptId);
    if (!attempt) {
      logger.warn("Attempt not found for submission", { attemptId: params.attemptId });
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    logger.info("Quest submission started", { 
      attemptId: params.attemptId, 
      answerCount: answers.length 
    });
    events.aiEvaluationStarted(params.attemptId);

    const startTime = Date.now();
    
    // Get AI evaluation for each answer
    const result = await submitQuestAttempt(params.attemptId, answers);

    const duration = Date.now() - startTime;
    events.aiEvaluationCompleted(params.attemptId, duration);

    // Update attempt with answers and their individual AI evaluations
    attempt.answers = answers.map(answer => {
      const evaluation = result.evaluations.find(e => e.questionId === answer.questionId);
      return {
        questionId: answer.questionId,
        answer: answer.answer,
        submittedAt: new Date(),
        aiEvaluation: evaluation.evaluation
      };
    });

    // Update total points based on sum of all evaluations
    attempt.totalPoints = result.totalScore;
    attempt.status = "completed";
    attempt.endTime = new Date();
    
    await attempt.save();
    
    logger.info("Quest submission completed", { 
      attemptId: params.attemptId, 
      totalScore: result.totalScore,
      maxPoints: attempt.maxPoints,
      evaluationDuration: duration
    });
    events.questCompleted(userId, attempt.questId, result.totalScore);

    return NextResponse.json({ success: true, attempt });

  } catch (error) {
    logger.error("Error in submit route", { 
      attemptId: params.attemptId, 
      error: error.message 
    });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
