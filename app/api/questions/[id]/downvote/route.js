/**
 * Question Downvote API
 * 
 * POST /api/questions/[id]/downvote
 * 
 * Handles downvoting a question.
 */

import Question from "@/lib/models/questionModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import logger, { logDatabase } from "@/lib/logger";
import { isValidMongoId } from "@/lib/validation";

export async function POST(request, { params }) {
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questionId = params.id;

    // Validate question ID parameter
    if (!isValidMongoId(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID format" },
        { status: 400 }
      );
    }

    logDatabase("findById", "Question", { questionId, action: "downvote" });
    const question = await Question.findById(questionId);

    if (!question) {
      logger.warn("Question not found for downvote", { questionId });
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (!question.voters) {
      question.voters = [];
    }

    const existingVote = question.voters.find(
      (voter) => voter.userId === userId
    );

    if (existingVote) {
      if (existingVote.vote === -1) {
        return NextResponse.json(
          { error: "You have already downvoted this question" },
          { status: 400 }
        );
      } else {
        question.votes -= 2;
        existingVote.vote = -1;
        question.markModified("voters"); // Ensure MongoDB registers the change
      }
    } else {
      question.votes -= 1;
      question.voters.push({ userId, vote: -1 });
    }

    await question.save();
    
    logger.debug("Question downvoted", { 
      questionId, 
      userId, 
      newVoteCount: question.votes 
    });

    return NextResponse.json({ success: true, votes: question.votes });
  } catch (error) {
    logger.error("Error downvoting question", { 
      questionId: params.id, 
      error: error.message 
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
