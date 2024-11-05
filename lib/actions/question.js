// lib/actions/question.js

"use server";

import Question from "../models/questionModel";
import { connect } from "../mongodb/mongoose";

export const createQuestion = async (title, description, tags, author) => {
  try {
    await connect();

    // Since tags is already an array, we can use it directly
    const question = await Question.create({
      title,
      description,
      tags, // Use the tags array directly
      author,
    });

    console.log("Question created:", question);
    return question.toObject();
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};
