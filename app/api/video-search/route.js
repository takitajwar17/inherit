import { NextResponse } from 'next/server';
import axios from 'axios';
import logger, { logExternalApi } from '@/lib/logger';

/**
 * Video Search API
 * 
 * POST /api/video-search
 * 
 * Searches YouTube for educational videos on a given topic.
 */

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

export async function POST(request) {
  try {
    const { topic } = await request.json();
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    logger.info("Searching for educational video", { topic });

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
    const results = await Promise.all(promises);
    const allVideos = results.flatMap((result) => result.data.items);

    // If no videos found
    if (allVideos.length === 0) {
      logger.warn("No videos found for topic", { topic });
      return NextResponse.json(
        { error: 'No videos found for this topic' },
        { status: 404 }
      );
    }

    // Get the most relevant video (first one)
    const bestMatch = allVideos[0];
    const videoId = bestMatch.id.videoId;
    
    // Get video duration
    const videoDetails = await getVideoDetails(videoId);
    
    logger.info("Video search successful", { 
      topic, 
      videoId, 
      title: bestMatch.snippet.title 
    });
    
    // Return the video information
    return NextResponse.json({
      videoId,
      title: bestMatch.snippet.title,
      channelTitle: bestMatch.snippet.channelTitle,
      thumbnail: bestMatch.snippet.thumbnails.high.url,
      publishedAt: bestMatch.snippet.publishedAt,
      contentDetails: videoDetails?.contentDetails || null
    });
  } catch (error) {
    logger.error("Error searching for video", { error: error.message });
    return NextResponse.json(
      { error: 'Failed to search for video' },
      { status: 500 }
    );
  }
}
