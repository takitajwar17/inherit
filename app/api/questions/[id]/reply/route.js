/**
 * Question Reply API
 * 
 * POST /api/questions/[id]/reply
 * 
 * Adds a reply to a question.
 */

import Question from "@/lib/models/questionModel";
import User from "@/lib/models/userModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import logger, { logDatabase, events } from "@/lib/logger";

export async function POST(request, { params }) {
  try {
    await connect();

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questionId = params.id;
    const { content } = await request.json();

    logDatabase("findById", "Question", { questionId, action: "reply" });
    const question = await Question.findById(questionId);
    if (!question) {
      logger.warn("Question not found for reply", { questionId });
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      logger.warn("User not found for reply", { clerkId: userId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reply = {
      author: user.userName,
      content,
      createdAt: new Date(),
    };

    question.replies = question.replies || [];
    question.replies.push(reply);

    // Increment answers count
    question.answers = question.replies.length;

    await question.save();
    
    logger.info("Reply added to question", { 
      questionId, 
      replyAuthor: user.userName, 
      totalReplies: question.answers 
    });
    events.questionAnswered(questionId, reply._id);

    return NextResponse.json({
      success: true,
      reply,
      answers: question.answers,
    });
  } catch (error) {
    logger.error("Error adding reply", { 
      questionId: params.id, 
      error: error.message 
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
