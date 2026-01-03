"use server";

/**
 * Question Server Actions
 * 
 * Server-side actions for the Dev Discuss Q&A feature.
 */

import Question from "../models/questionModel";
import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";
import logger, { logDatabase, logExternalApi, events } from "../logger";
import { validateOrThrow, createQuestionSchema } from "../validation";
const Groq = require("groq-sdk");

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates an AI answer for a question with retries
 * @param {string} title - Question title
 * @param {string} description - Question description
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<string>} The AI-generated answer
 */
const generateAIAnswer = async (
  title,
  description,
  retries = 3,
  delay = 2000
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug("Generating AI answer", { attempt, title: title.substring(0, 50) });
      logExternalApi("groq", "generate_answer", { attempt });
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Provide an in-depth solution as if you have 15 years of experience in computer science and IT. Kindly refuse to asnwer questions unrelated to the domain(this is a MUST). For related questions, Offer explanations, code examples, and best practices similar to a StackOverflow response.",
          },
          {
            role: "user",
            content: `${title}\n\n${description}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 800,
        top_p: 0.65,
        stream: false,
        stop: null,
      });

      const aiResponse = chatCompletion.choices[0].message.content || "";
      logger.info("AI answer generated successfully", { 
        title: title.substring(0, 50),
        responseLength: aiResponse.length 
      });
      return aiResponse;
    } catch (error) {
      logger.error("Error generating AI answer", {
        attempt,
        title: title.substring(0, 50),
        error: error.message
      });
      
      if (attempt === retries) {
        logger.error("Max retries reached for AI answer generation");
        return "An error occurred while generating the AI response after multiple attempts.";
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Creates a new question with optional AI answer
 * @param {string} title - Question title
 * @param {string} description - Question description
 * @param {Array} tags - Question tags
 * @param {string} author - Clerk user ID
 * @param {boolean} aiAnswerRequested - Whether to generate AI answer
 * @returns {Promise<Object>} The created question
 */
export const createQuestion = async (
  title,
  description,
  tags,
  author,
  aiAnswerRequested
) => {
  try {
    // Validate input with Zod schema (throws on validation failure)
    const validatedData = validateOrThrow(createQuestionSchema, {
      title,
      description,
      tags,
      aiAnswerRequested: aiAnswerRequested || false,
    });

    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) throw new Error("User not found");

    logDatabase("create", "Question", { title: validatedData.title.substring(0, 50), author: user.userName });
    
    // Create the question in the database with validated & sanitized data
    const question = await Question.create({
      title: validatedData.title,
      description: validatedData.description,
      tags: validatedData.tags,
      author: user.userName,
      aiAnswerRequested: validatedData.aiAnswerRequested,
    });

    logger.info("Question created", { 
      questionId: question._id, 
      author: user.userName,
      aiAnswerRequested 
    });
    events.questionAsked(author, question._id);

    // Respond to the frontend immediately with success
    // Generate AI answer asynchronously
    setTimeout(async () => {
      if (aiAnswerRequested) {
        logger.debug("Starting async AI answer generation", { questionId: question._id });
        const aiAnswerContent = await generateAIAnswer(title, description);
        question.aiAnswer.content = aiAnswerContent;
        question.aiAnswer.time = new Date();
        await question.save();
        logger.info("AI answer saved to question", { questionId: question._id });
      }
    }, 0);

    // Return response to frontend immediately
    return question.toObject();
  } catch (error) {
    logger.error("Error creating question", { 
      title: title.substring(0, 50), 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Gets a question by ID with formatted data
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} The question with formatted data
 */
export const getQuestionById = async (questionId) => {
  try {
    await connect();
    logDatabase("findById", "Question", { questionId });

    const question = await Question.findById(questionId).lean();

    if (!question) {
      logger.warn("Question not found", { questionId });
      throw new Error("Question not found");
    }

    // Set defaults for aiAnswerRequested and aiAnswer
    question.aiAnswerRequested = question.aiAnswerRequested || false;
    question.aiAnswer = question.aiAnswer || { content: null };

    // Initialize `replies` as an empty array if it is undefined
    question.replies = question.replies || [];

    // Format dates and IDs for client-friendly response
    question._id = question._id.toString();
    question.replies = question.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    }));

    logger.debug("Question retrieved", { 
      questionId, 
      hasAiAnswer: !!question.aiAnswer?.content,
      replyCount: question.replies.length 
    });

    return question;
  } catch (error) {
    logger.error("Error fetching question by ID", { questionId, error: error.message });
    throw error;
  }
};
