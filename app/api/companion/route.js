/**
 * AI Companion API
 *
 * POST /api/companion
 *
 * Unified endpoint for the multi-agent AI companion system.
 * Routes messages through the agent orchestrator.
 */

import { auth, clerkClient } from "@clerk/nextjs";
import { connect } from "@/lib/mongodb/mongoose";
import Conversation from "@/lib/models/conversationModel";
import { getInitializedOrchestrator } from "@/lib/agents";
import logger from "@/lib/logger";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { aiLimiter } from "@/lib/ratelimit/limiters";
import { getUserIdentifier } from "@/lib/ratelimit";
import {
  successResponse,
  errorResponse,
  generateRequestId,
  parseJsonBody,
} from "@/lib/errors/apiResponse";
import { ValidationError } from "@/lib/errors";

/**
 * POST /api/companion - Send message to AI companion
 */
async function handlePost(request) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    // Require authentication for companion
    if (!userId) {
      return errorResponse(
        { message: "Authentication required. Please log in to use the AI companion." },
        requestId,
        401
      );
    }

    // Parse request body
    const body = await parseJsonBody(request);
    const { message, conversationId, language = "en", context = {} } = body;

    if (!message || typeof message !== "string") {
      throw new ValidationError("Message is required");
    }

    // Get user details for personalized responses
    let userName = "there";
    try {
      const user = await clerkClient.users.getUser(userId);
      userName = user.firstName || user.username || "there";
    } catch (error) {
      logger.warn("Failed to fetch user details", { userId, error: error.message });
    }

    logger.debug("AI Companion request", {
      userId,
      userName,
      conversationId,
      language,
      messageLength: message.length,
      requestId,
    });

    await connect();

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        ...(userId && { clerkId: userId }),
      });
    }

    if (!conversation && userId) {
      // Create new conversation for authenticated users
      conversation = new Conversation({
        clerkId: userId,
        language,
        messages: [],
      });
    }

    // Get conversation history
    const history = conversation?.getRecentMessages(10) || [];

    // Process through orchestrator
    logger.debug("Starting orchestrator processing", { userId, userName, requestId });
    const orchestrator = getInitializedOrchestrator();
    
    const result = await orchestrator.processMessage(message, {
      history,
      language,
      clerkId: userId,
      userName,
      ...context,
    });

    logger.debug("Orchestrator completed", {
      agent: result.routedTo,
      confidence: result.routing?.confidence,
      requestId,
    });

    // Save conversation if authenticated
    if (conversation) {
      // Add user message
      conversation.messages.push({
        role: "user",
        content: message,
        language,
        timestamp: new Date(),
      });

      // Add assistant response
      conversation.messages.push({
        role: "assistant",
        content: result.response?.content || "",
        agent: result.routedTo,
        language,
        timestamp: new Date(),
      });

      conversation.activeAgent = result.routedTo;
      await conversation.save();
    }

    logger.info("AI Companion response generated", {
      userId,
      agent: result.routedTo,
      confidence: result.routing?.confidence,
      requestId,
    });

    return successResponse({
      response: result.response?.content || "",
      agent: result.routedTo,
      routing: result.routing,
      conversationId: conversation?._id,
    });
  } catch (error) {
    logger.error("AI Companion error", {
      error: error.message,
      stack: error.stack,
      requestId,
    });
    return errorResponse(error, requestId);
  }
}

/**
 * GET /api/companion - Get conversation history
 */
async function handleGet(request) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    await connect();

    if (conversationId) {
      // Get specific conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        clerkId: userId,
      });

      if (!conversation) {
        return errorResponse(
          { message: "Conversation not found" },
          requestId,
          404
        );
      }

      return successResponse({ conversation });
    }

    // Get recent conversations
    const conversations = await Conversation.find({ clerkId: userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("_id title activeAgent updatedAt messages");

    return successResponse({
      conversations: conversations.map((c) => ({
        id: c._id,
        title: c.title,
        activeAgent: c.activeAgent,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        lastMessage: c.messages[c.messages.length - 1]?.content?.substring(
          0,
          100
        ),
      })),
    });
  } catch (error) {
    logger.error("AI Companion GET error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting
export const POST = withRateLimit(aiLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  },
});

export const GET = handleGet;
