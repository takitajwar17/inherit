/**
 * Video Search API
 * 
 * POST /api/video-search
 * 
 * Searches YouTube for educational videos on a given topic.
 */

import { auth } from '@clerk/nextjs';
import axios from 'axios';
import logger, { logExternalApi } from '@/lib/logger';
import { validateRequest, videoSearchSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/ratelimit/middleware';
import { youtubeLimiter } from '@/lib/ratelimit/limiters';
import { getUserIdentifier } from '@/lib/ratelimit';
import { 
  successResponse, 
  errorResponse, 
  generateRequestId,
  parseJsonBody
} from '@/lib/errors/apiResponse';
import { ValidationError, NotFoundError, ExternalServiceError } from '@/lib/errors';

// Function to get a random API key
const getRandomApiKey = () => {
  const apiKeys = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.split(",");
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

// Channel IDs for educational content
const CHANNEL_IDS = [
  "UC8butISFwT-Wl7EV0hUK0BQ", // freeCodeCamp
  "UC59K-uG2A5ogwIrHw4bmlEg", // Telusko
];

// Function to get video details (duration)
const getVideoDetails = async (videoId) => {
  try {
    logExternalApi("youtube", "get_video_details", { videoId });
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "contentDetails",
          id: videoId,
          key: getRandomApiKey(),
        },
      }
    );
    return response.data.items[0];
  } catch (error) {
    logger.error("Error fetching YouTube video details", { 
      videoId, 
      error: error.message 
    });
    return null;
  }
};

/**
 * POST /api/video-search - Search for educational videos
 * Rate limited: 30 requests per minute per user (if authenticated) or per IP (if anonymous)
 */
async function handlePost(request) {
  const requestId = generateRequestId();
  
  try {
    // Parse JSON body with error handling
    const body = await parseJsonBody(request);

    // Validate request body with Zod schema
    const validation = validateRequest(videoSearchSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { topic } = validation.data;
    logger.info("Searching for educational video", { topic, requestId });

    // Search for videos across specified channels
    const promises = CHANNEL_IDS.map((channelId) =>
      axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          channelId: channelId,
          maxResults: 3, // Get top 3 results per channel
          order: "relevance",
          q: topic,
          type: "video",
          key: getRandomApiKey(),
        },
      })
    );

    logExternalApi("youtube", "search_videos", { topic, channelCount: CHANNEL_IDS.length });
    
    let results;
    try {
      results = await Promise.all(promises);
    } catch (ytError) {
      logger.error("YouTube API error", { error: ytError.message, requestId });
      throw new ExternalServiceError("YouTube", "Failed to search videos");
    }
    
    const allVideos = results.flatMap((result) => result.data.items);

    // If no videos found
    if (allVideos.length === 0) {
      throw new NotFoundError("Videos for topic");
    }

    // Get the most relevant video (first one)
    const bestMatch = allVideos[0];
    const videoId = bestMatch.id.videoId;
    
    // Get video duration
    const videoDetails = await getVideoDetails(videoId);
    
    logger.info("Video search successful", { 
      topic, 
      videoId, 
      title: bestMatch.snippet.title,
      requestId
    });
    
    // Return the video information
    return successResponse({
      videoId,
      title: bestMatch.snippet.title,
      channelTitle: bestMatch.snippet.channelTitle,
      thumbnail: bestMatch.snippet.thumbnails.high.url,
      publishedAt: bestMatch.snippet.publishedAt,
      contentDetails: videoDetails?.contentDetails || null
    });
    
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting (30 requests per minute per user/IP)
// Uses user ID if authenticated, falls back to IP for anonymous users
export const POST = withRateLimit(youtubeLimiter, handlePost, {
  getIdentifier: (req) => {
    const { userId } = auth();
    return getUserIdentifier(req, userId);
  }
});
