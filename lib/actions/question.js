// lib/actions/question.js

"use server";

import Question from "../models/questionModel";
import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";

export const createQuestion = async (title, description, tags, author) => {
  try {
    await connect();

    // Find the user by clerkId to get the userName
    const user = await User.findOne({ clerkId: author });
    if (!user) {
      throw new Error("User not found");
    }

    const question = await Question.create({
      title,
      description,
      tags,
      author: user.userName,
    });

    console.log("Question created:", question);
    return question.toObject();
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

export const getQuestionById = async (questionId) => {
  try {
    await connect();
    const question = await Question.findById(questionId).lean();
    if (!question) {
      throw new Error("Question not found");
    }

    // Initialize `replies` as an empty array if it is undefined
    question.replies = question.replies || [];

    // Format dates and IDs for client-friendly response
    question._id = question._id.toString();
    question.replies = question.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    }));

    return question;
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    throw error;
  }
};
