// app/api/questions/[id]/reply/route.js

import Question from "@/lib/models/questionModel";
import User from "@/lib/models/userModel";
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
    const { content } = await request.json();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Retrieve user details
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare the reply object
    const reply = {
      author: user.userName,
      content,
      createdAt: new Date(),
    };

    // Ensure replies array is initialized if it does not exist
    question.replies = question.replies || [];
    question.replies.push(reply);

    await question.save();

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
