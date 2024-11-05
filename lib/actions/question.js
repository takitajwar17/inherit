// lib/actions/question.js

"use server";

import Question from "../models/questionModel";
import { connect } from "../mongodb/mongoose";

export const createQuestion = async (title, description, tags, author) => {
  try {
    await connect();

    // Convert tags from a comma-separated string to an array
    const tagArray = tags.split(",").map((tag) => tag.trim());

    const question = await Question.create({
      title,
      description,
      tags: tagArray,
      author,
    });

    console.log("Question created:", question);
    return question.toObject();
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};
