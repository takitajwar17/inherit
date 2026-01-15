/**
 * AI Companion API
 *
 * POST /api/companion
 *
 * Unified endpoint for the multi-agent AI companion system.
 * Routes messages through the agent orchestrator.
 * Supports both standard and streaming (SSE) responses.
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
 * Create an SSE encoder for streaming responses
 */
function createSSEEncoder() {
  const encoder = new TextEncoder();
  return {
    encode: (event, data) => {
      const eventStr = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      return encoder.encode(eventStr);
    },
  };
}

/**
 * Parse tool results for actions (navigate, render_roadmap)
 */
function parseToolResultsForActions(response) {
  const actions = [];
  
  if (!response?.content) return actions;
  
  try {
    // Check if content contains JSON with action field
    const content = typeof response.content === 'string' ? response.content : '';
    
    // Look for JSON objects in the content
    const jsonMatches = content.match(/\{[^{}]*"action"[^{}]*\}/g);
    
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.action) {
            actions.push(parsed);
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }
    
    // Also check if response has tool results metadata
    if (response.toolResults) {
      for (const result of response.toolResults) {
        try {
          const parsed = typeof result.result === 'string' 
            ? JSON.parse(result.result) 
            : result.result;
          if (parsed?.action) {
            actions.push(parsed);
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }
  } catch (error) {
    logger.debug("Error parsing tool results for actions", { error: error.message });
  }
  
  return actions;
}

/**
 * POST /api/companion - Send message to AI companion (streaming)
 */
async function handleStreamingPost(request, userId, requestId) {
  const body = await parseJsonBody(request);
  const { message, conversationId, language = "en", context = {} } = body;

  if (!message || typeof message !== "string") {
    throw new ValidationError("Message is required");
  }

  const encoder = createSSEEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await connect();

        // Send initial event
        controller.enqueue(encoder.encode("status", { 
          type: "processing",
          message: "Processing your request...",
        }));

        // Build user context
        const userContext = await buildUserContext(userId);
        
        // Send context loaded event
        controller.enqueue(encoder.encode("status", { 
          type: "context_loaded",
          userName: userContext.user.name,
        }));

        // Get or create conversation
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findOne({
            _id: conversationId,
            clerkId: userId,
          });
        }

        if (!conversation) {
          conversation = new Conversation({
            clerkId: userId,
            language,
            messages: [],
          });
        }

        const history = conversation?.getRecentMessages(10) || [];

        // Build agent context
        const agentContext = {
          history,
          language,
          clerkId: userId,
          userName: userContext.user.name,
          userFirstName: userContext.user.firstName,
          userLastName: userContext.user.lastName,
          userEmail: userContext.user.email,
          userUsername: userContext.user.username,
          userContext: userContext,
          contextSummary: formatContextForAgent(userContext),
          currentRoadmap: userContext.roadmaps.currentRoadmap,
          currentQuest: userContext.quests.currentQuest,
          ...context,
        };

        // Send routing event
        controller.enqueue(encoder.encode("status", { 
          type: "routing",
          message: "Determining best agent...",
        }));

        // Process through orchestrator
        const orchestrator = getInitializedOrchestrator();
        const result = await orchestrator.processMessage(message, agentContext);

        // Send agent_start event
        controller.enqueue(encoder.encode("agent_start", { 
          agent: result.routedTo,
          confidence: result.routing?.confidence,
          reasoning: result.routing?.reasoning,
        }));

        // Parse any actions from tool results
        const actions = parseToolResultsForActions(result.response);
        
        // Send tool_call events for any actions
        for (const action of actions) {
          controller.enqueue(encoder.encode("tool_call", action));
        }

        // Get response content
        let responseContent = "";
        if (result?.response?.content) {
          responseContent = result.response.content.trim();
        }
        
        if (!responseContent) {
          responseContent = language === "bn"
            ? "আপনার অনুরোধ প্রক্রিয়া করা হয়েছে।"
            : "Your request has been processed.";
        }

        // Stream content in chunks for better UX
        const chunkSize = 100;
        for (let i = 0; i < responseContent.length; i += chunkSize) {
          const chunk = responseContent.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode("content_delta", { 
            content: chunk,
            index: i,
          }));
          // Small delay for smooth streaming
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Save conversation
        if (conversation) {
          conversation.messages.push({
            role: "user",
            content: message,
            language,
            timestamp: new Date(),
          });

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

        // Send done event
        controller.enqueue(encoder.encode("done", { 
          agent: result.routedTo,
          conversationId: conversation?._id?.toString(),
          actions: actions.length > 0 ? actions : undefined,
          totalLength: responseContent.length,
        }));

        controller.close();
      } catch (error) {
        logger.error("Streaming error", { error: error.message, requestId });
        controller.enqueue(encoder.encode("error", { 
          message: error.message,
          code: error.code || "UNKNOWN_ERROR",
        }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/**
 * POST /api/companion - Send message to AI companion (standard)
 */
async function handleStandardPost(request, userId, requestId) {
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
  const userContext = await buildUserContext(userId);
  
  logger.info("User context built", {
    userId,
    userName: userContext.user.name,
    tasksTotal: userContext.tasks.total,
    roadmapsTotal: userContext.roadmaps.total,
  });

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({
      _id: conversationId,
      clerkId: userId,
    });
  }

  if (!conversation && userId) {
    conversation = new Conversation({
      clerkId: userId,
      language,
      messages: [],
    });
  }

  const history = conversation?.getRecentMessages(10) || [];

  // Build agent context
  const agentContext = {
    history,
    language,
    clerkId: userId,
    userName: userContext.user.name,
    userFirstName: userContext.user.firstName,
    userLastName: userContext.user.lastName,
    userEmail: userContext.user.email,
    userUsername: userContext.user.username,
    userContext: userContext,
    contextSummary: formatContextForAgent(userContext),
    currentRoadmap: userContext.roadmaps.currentRoadmap,
    currentQuest: userContext.quests.currentQuest,
    ...context,
  };

  const orchestrator = getInitializedOrchestrator();
  const result = await orchestrator.processMessage(message, agentContext);

  // Parse actions from tool results
  const actions = parseToolResultsForActions(result.response);

  // Save conversation
  if (conversation) {
    conversation.messages.push({
      role: "user",
      content: message,
      language,
      timestamp: new Date(),
    });

    let responseContent = "";
    if (result?.response?.content) {
      responseContent = result.response.content.trim();
    }
    
    if (!responseContent) {
      responseContent = language === "bn"
        ? "আপনার অনুরোধ প্রক্রিয়া করা হয়েছে।"
        : "Your request has been processed.";
    }

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
    hasActions: actions.length > 0,
    requestId,
  });

  return successResponse({
    response: result.response?.content || "",
    agent: result.routedTo,
    routing: result.routing,
    conversationId: conversation?._id,
    actions: actions.length > 0 ? actions : undefined,
  });
}

/**
 * POST /api/companion - Main handler
 */
async function handlePost(request) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    logger.info("Companion API - Auth check", {
      requestId,
      hasUserId: !!userId,
    });

    if (!userId) {
      return errorResponse(
        { message: "Authentication required. Please log in to use the AI companion." },
        requestId,
        401
      );
    }

    // Check if streaming is requested via header or query param
    const url = new URL(request.url);
    const streamRequested = 
      request.headers.get("Accept") === "text/event-stream" ||
      url.searchParams.get("stream") === "true";

    if (streamRequested) {
      return handleStreamingPost(request.clone(), userId, requestId);
    } else {
      return handleStandardPost(request, userId, requestId);
    }
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
        lastMessage: c.messages[c.messages.length - 1]?.content?.substring(0, 100),
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
