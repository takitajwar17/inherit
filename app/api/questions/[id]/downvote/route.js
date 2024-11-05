// app/api/questions/[id]/downvote/route.js

import Question from "@/lib/models/questionModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs"; // Adjust based on your auth provider
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questionId = params.id;

    // Find the question by ID
    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // **Add this block to initialize voters if undefined**
    if (!question.voters) {
      question.voters = [];
    }

    // Check if the user has already voted
    const existingVote = question.voters.find(
      (voter) => voter.userId === userId
    );

    if (existingVote) {
      if (existingVote.vote === -1) {
        // User has already downvoted
        return NextResponse.json(
          { error: "You have already downvoted this question" },
          { status: 400 }
        );
      } else {
        // User had upvoted before, change to downvote
        question.votes -= 2; // Remove upvote (+1) and add downvote (-1)
        existingVote.vote = -1; // Change the vote to downvote
      }
    } else {
      // User has not voted before
      question.votes -= 1;
      question.voters.push({ userId, vote: -1 });
    }

    await question.save();

    return NextResponse.json({ success: true, votes: question.votes });
  } catch (error) {
    console.error("Error downvoting question:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
