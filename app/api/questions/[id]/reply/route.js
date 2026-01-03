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
import logger, { logDatabase, events } from "@/lib/logger";
import { validateRequest, replySchema, isValidMongoId } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { replyLimiter } from "@/lib/ratelimit/limiters";
import { getUserIdentifier } from "@/lib/ratelimit";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError 
} from "@/lib/errors";

/**
 * POST /api/questions/[id]/reply - Add a reply to a question
 * Rate limited: 10 replies per minute per user
 */
async function handlePost(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    await connect();

    const { userId } = auth();
    if (!userId) {
      throw new AuthenticationError("Authentication required");
    }

    const questionId = params.id;

    // Validate question ID parameter
    if (!isValidMongoId(questionId)) {
      throw new ValidationError("Invalid question ID format");
    }

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(replySchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { content } = validation.data;

    logDatabase("findById", "Question", { questionId, action: "reply" });
    const question = await Question.findById(questionId);
    if (!question) {
      throw new NotFoundError("Question", questionId);
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new NotFoundError("User");
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
      totalReplies: question.answers,
      requestId
    });
    events.questionAnswered(questionId, reply._id);

    return successResponse({
      reply,
      answers: question.answers,
    });
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (10 replies per minute, user-based)
export const POST = withRateLimit(replyLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});
