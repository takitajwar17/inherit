"use server";

import Question from "../models/questionModel";
import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";
const Groq = require("groq-sdk");

// Initialize the Groq client
const groq = new Groq({
  apiKey: "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", // Replace with your actual API key
});

// Function to generate an AI answer with retries
const generateAIAnswer = async (
  title,
  description,
  retries = 3,
  delay = 2000
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Generating AI answer...`);
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Provide an in-depth solution as if you have 15 years of experience. Offer explanations, code examples, and best practices similar to a StackOverflow response.",
          },
          {
            role: "user",
            content: `${title}\n\n${description}`,
          },
        ],
        model: "llama3-groq-70b-8192-tool-use-preview",
        temperature: 0.5,
        max_tokens: 800,
        top_p: 0.65,
        stream: false,
        stop: null,
      });

      // Directly assign response without using for-await
      const aiResponse = chatCompletion.choices[0].message.content || "";
      console.log("AI Answer Generated Successfully:");
      return aiResponse;
    } catch (error) {
      console.error(
        `Attempt ${attempt} - Error generating AI answer:`,
        error.message
      );
      if (attempt === retries) {
        console.error("Max retries reached. Failed to generate AI answer.");
        return "An error occurred while generating the AI response after multiple attempts.";
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Create a question and generate AI answer if requested
export const createQuestion = async (
  title,
  description,
  tags,
  author,
  aiAnswerRequested
) => {
  try {
    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) {
      throw new Error("User not found");
    }

    // Create the question in the database
    const question = await Question.create({
      title,
      description,
      tags,
      author: user.userName,
      aiAnswerRequested,
    });

    console.log("Question created:", question);

    // Check if AI answer is requested
    if (aiAnswerRequested) {
      const aiAnswerContent = await generateAIAnswer(title, description);

      // Update question with AI answer in the database
      question.aiAnswer.content = aiAnswerContent;
      question.aiAnswer.time = new Date();
      await question.save();
    }

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
