/**
 * AI Companion API
 *
 * POST /api/companion
 *
 * Unified endpoint for the multi-agent AI companion system.
 * Routes messages through the agent orchestrator.
 */

import { auth } from "@clerk/nextjs";
import { connect } from "@/lib/mongodb/mongoose";
import Conversation from "@/lib/models/conversationModel";
import { getInitializedOrchestrator } from "@/lib/agents";
import { buildUserContext, formatContextForAgent } from "@/lib/context/userContext";
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
    // Get authenticated user - sync auth() from @clerk/nextjs
    const { userId } = auth();

    logger.info("Companion API - Auth check", {
      requestId,
      hasUserId: !!userId,
      userId: userId,
    });

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

    logger.debug("AI Companion request started", {
      userId,
      conversationId,
      language,
      messageLength: message.length,
      requestId,
    });

    await connect();

    // Build comprehensive user context
    logger.debug("Building user context", { userId });
    const userContext = await buildUserContext(userId);
    
    logger.info("User context built", {
      userId,
      userName: userContext.user.name,
      email: userContext.user.email,
      tasksTotal: userContext.tasks.total,
      tasksPending: userContext.tasks.pending,
      tasksOverdue: userContext.tasks.overdue,
      roadmapsTotal: userContext.roadmaps.total,
      roadmapsInProgress: userContext.roadmaps.inProgress,
      questsTotal: userContext.quests.total,
      currentRoadmap: userContext.roadmaps.current?.title || 'none',
      currentQuest: userContext.quests.current?.name || 'none',
    });

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

    // Process through orchestrator with comprehensive context
    const agentContext = {
      history,
      language,
      clerkId: userId,
      
      // User profile
      userName: userContext.user.name,
      userFirstName: userContext.user.firstName,
      userLastName: userContext.user.lastName,
      userEmail: userContext.user.email,
      userUsername: userContext.user.username,
      
      // Complete user context
      userContext: userContext,
      
      // Formatted context summary for agents
      contextSummary: formatContextForAgent(userContext),
      
      // Legacy context support (use correct property names)
      currentRoadmap: userContext.roadmaps.currentRoadmap,
      currentQuest: userContext.quests.currentQuest,
      
      ...context,
    };

    logger.debug("Starting orchestrator processing", { 
      userId, 
      userName: userContext.user.name,
      clerkId: userId,
      hasUserContext: !!agentContext.userContext,
      hasUserName: !!agentContext.userName,
      userNameValue: agentContext.userName,
      contextKeys: Object.keys(agentContext),
      requestId 
    });
    
    const orchestrator = getInitializedOrchestrator();
    const result = await orchestrator.processMessage(message, agentContext);

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

      // Ensure response content is NEVER empty/undefined (required by schema)
      let responseContent = "";
      if (result && result.response && typeof result.response.content === "string") {
        responseContent = result.response.content.trim();
      }
      
      // Fallback if still empty
      if (!responseContent) {
        responseContent = language === "bn"
          ? "আপনার অনুরোধ প্রক্রিয়া করা হয়েছে।"
          : "Your request has been processed.";
        logger.warn("Empty response content, using fallback", {
          hasResult: !!result,
          hasResponse: !!result?.response,
          contentType: typeof result?.response?.content,
          agent: result?.routedTo,
        });
      }

      // Add assistant response
      conversation.messages.push({
        role: "assistant",
        content: responseContent,
        agent: result.routedTo || "general",
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
    const authResult = await auth();
    const userId = authResult?.userId;

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
  getIdentifier: async (req) => {
    const authResult = await auth();
    return getUserIdentifier(req, authResult?.userId);
  },
});

export const GET = handleGet;
