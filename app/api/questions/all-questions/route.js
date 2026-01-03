/**
 * Questions API
 * 
 * GET /api/questions/all-questions
 * 
 * Retrieves all questions, categorized by ownership.
 */

import Question from "@/lib/models/questionModel";
import User from "@/lib/models/userModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import logger, { logDatabase } from "@/lib/logger";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/errors/apiResponse";
import { 
  AuthenticationError, 
  NotFoundError 
} from "@/lib/errors";

/**
 * GET /api/questions/all-questions - Get all questions categorized
 */
export async function GET() {
  const requestId = generateRequestId();
  
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      throw new AuthenticationError("Authentication required");
    }

    // Fetch the user to get the userName
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new NotFoundError("User");
    }

    const userName = user.userName;
    logDatabase("find", "Question", { userName });

    // Fetch questions authored by the user
    const ownedQuestions = await Question.find({ author: userName })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch questions not authored by the user
    const otherQuestions = await Question.find({ author: { $ne: userName } })
      .lean()
      .sort({ createdAt: -1 });

    // Remove popularNow from backend response
    const questions = {
      owned: ownedQuestions,
      others: otherQuestions,
    };

    logger.debug("Questions fetched", { 
      userId, 
      ownedCount: ownedQuestions.length, 
      othersCount: otherQuestions.length,
      requestId
    });

    return successResponse(questions);
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
