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
import logger, { logDatabase } from "@/lib/logger";
import { isValidMongoId } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { voteLimiter } from "@/lib/ratelimit/limiters";
import { getUserIdentifier } from "@/lib/ratelimit";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  ConflictError 
} from "@/lib/errors";

/**
 * POST /api/questions/[id]/upvote - Upvote a question
 * Rate limited: 30 votes per minute per user
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

    logDatabase("findById", "Question", { questionId, action: "upvote" });
    const question = await Question.findById(questionId);

    if (!question) {
      throw new NotFoundError("Question", questionId);
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
        throw new ConflictError("You have already upvoted this question");
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
      newVoteCount: question.votes,
      requestId
    });

    return successResponse({ votes: question.votes });
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (30 votes per minute, user-based)
export const POST = withRateLimit(voteLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});
