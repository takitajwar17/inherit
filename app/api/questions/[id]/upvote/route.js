/**
 * Question Upvote API
 * 
 * POST /api/questions/[id]/upvote
 * 
 * Handles upvoting a question.
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

    logDatabase("findById", "Question", { questionId, action: "upvote" });
    const question = await Question.findById(questionId);

    if (!question) {
      logger.warn("Question not found for upvote", { questionId });
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Initialize voters if undefined
    if (!question.voters) {
      question.voters = [];
    }

    // Check if the user has already voted
    const existingVote = question.voters.find(
      (voter) => voter.userId === userId
    );

    if (existingVote) {
      if (existingVote.vote === 1) {
        // User has already upvoted
        return NextResponse.json(
          { error: "You have already upvoted this question" },
          { status: 400 }
        );
      } else {
        // User had downvoted before, change to upvote
        question.votes += 2; // Remove downvote (-1) and add upvote (+1)
        existingVote.vote = 1; // Change the vote to upvote
      }
    } else {
      // User has not voted before
      question.votes += 1;
      question.voters.push({ userId, vote: 1 });
    }

    await question.save();
    
    logger.debug("Question upvoted", { 
      questionId, 
      userId, 
      newVoteCount: question.votes 
    });

    return NextResponse.json({ success: true, votes: question.votes });
  } catch (error) {
    logger.error("Error upvoting question", { 
      questionId: params.id, 
      error: error.message 
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
