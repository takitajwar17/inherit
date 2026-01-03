/**
 * Voice Routing API
 * 
 * POST /api/voice-routing
 * 
 * Processes voice commands and routes to appropriate pages or actions.
 * Uses Groq AI to interpret the voice transcript.
 */

import { auth } from '@clerk/nextjs';
import logger, { logExternalApi } from '@/lib/logger';
import { validateRequest, voiceCommandSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/ratelimit/middleware';
import { aiLimiter } from '@/lib/ratelimit/limiters';
import { getUserIdentifier } from '@/lib/ratelimit';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId,
  parseJsonBody
} from '@/lib/errors/apiResponse';
import { ValidationError, ExternalServiceError } from '@/lib/errors';

const Groq = require('groq-sdk');

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * POST /api/voice-routing - Process voice command
 * Rate limited: 20 requests per minute per user (if authenticated) or per IP (if anonymous)
 */
async function handlePost(request) {
  const requestId = generateRequestId();
  
  try {
    // Parse JSON body with error handling
    const body = await parseJsonBody(request);

    // Validate request body with Zod schema
    const validation = validateRequest(voiceCommandSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { transcript } = validation.data;
    logger.debug("Processing voice command", { transcript, requestId });

    // Define the system prompt for Groq
    const systemPrompt = `You are a voice command routing assistant. 
    Based on the user's voice command, determine the most appropriate route to navigate to or action to take.
    
    Return ONLY a JSON object with one of these structures:
    1. For navigation: { "route": "string", "action": null }
    2. For learning about a topic: { "route": null, "action": "learn", "topic": "string" }
    
    Available routes:
    - "/" for home
    - "/dashboard" for dashboard
    - "/learn" for learning resources
    - "/roadmaps" for roadmaps
    - "/dev-discuss" for discussions
    - "/quests" for quests
    - "/playground" for playground
    - "/faq" for help
    - "/dev-discuss/ask-question" for asking questions
    - "/faq/contact" for contacting support
    
    For learning commands (e.g., "teach me about React", "show tutorial on JavaScript", "I want to learn Python"):
    - Set action to "learn"
    - Extract the topic from the command
    
    If the command doesn't match any route or action, return { "route": null, "action": null }.
    `;

    // Call Groq API
    logExternalApi("groq", "voice_routing");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 100,
      response_format: {
        type: "json_object"
      },
      stream: false,
      stop: null,
    });

    const responseContent = chatCompletion.choices[0].message.content;
    let routeData;
    
    try {
      routeData = JSON.parse(responseContent);
    } catch (parseError) {
      logger.error("Error parsing Groq voice routing response", { 
        error: parseError.message, 
        responseContent,
        requestId
      });
      throw new ExternalServiceError("Groq AI", "Failed to parse response");
    }

    // Handle learning action by searching for a video on the topic
    if (routeData.action === 'learn' && routeData.topic) {
      try {
        logger.info("Voice command triggered learn action", { topic: routeData.topic, requestId });
        
        // Call the video-search API
        const videoSearchResponse = await fetch(new URL('/api/video-search', request.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: routeData.topic }),
        });

        if (!videoSearchResponse.ok) {
          throw new Error(`Video search failed with status: ${videoSearchResponse.status}`);
        }

        const videoData = await videoSearchResponse.json();
        
        // Return route to the video page with the video ID
        return successResponse({
          route: `/learn/${videoData.data?.videoId || videoData.videoId}`,
          videoData: videoData.data || videoData
        });
      } catch (videoError) {
        logger.error("Error searching for video from voice command", { 
          topic: routeData.topic, 
          error: videoError.message,
          requestId
        });
        throw new ExternalServiceError("Video Search", "Failed to find a video for this topic");
      }
    }

    logger.debug("Voice routing result", { routeData, requestId });
    return successResponse(routeData);
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (20 requests per minute per user/IP)
// Uses user ID if authenticated, falls back to IP for anonymous users
export const POST = withRateLimit(aiLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});
