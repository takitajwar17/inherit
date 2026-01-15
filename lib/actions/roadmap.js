"use server";

/**
 * Roadmap Server Actions
 * 
 * Server-side actions for AI-generated learning roadmaps.
 */

import Roadmap from "../models/roadmapModel";
import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";
import logger, { logDatabase, logExternalApi, events } from "../logger";
import { validateOrThrow, createRoadmapSchema } from "../validation";
const Groq = require("groq-sdk");
const axios = require('axios');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Gets a random YouTube API key from the comma-separated list
 * @returns {string} A random API key
 */
const getRandomApiKey = () => {
  const apiKeys = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.split(',');
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

/**
 * Tries an API request with multiple keys until success or all keys exhausted
 * @param {Function} apiCall - Function that makes the API call with a key
 * @returns {Promise<Object|null>} The API response or null
 */
const tryWithMultipleKeys = async (apiCall) => {
  const apiKeys = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.split(',');
  const errors = [];

  // Try each API key
  for (const key of apiKeys) {
    try {
      const result = await apiCall(key);
      return result; // Return on first success
    } catch (error) {
      errors.push(`Key ${key.slice(0, 8)}...: ${error.message}`);
      continue; // Try next key if available
    }
  }
  
  // If we get here, all keys failed
  logger.error("All YouTube API keys failed", { errors });
  return null;
};

/**
 * Searches YouTube for a video on the given topic
 * @param {string} topic - The search topic
 * @returns {Promise<Object|null>} Video info or null
 */
const searchYouTubeVideo = async (topic) => {
  try {
    logExternalApi("youtube", "search_video", { topic });
    
    // First, search for videos with retry logic
    const searchResponse = await tryWithMultipleKeys(async (key) => {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: "id",
          maxResults: 2, // Reduced to 2: one primary option and one backup
          order: "relevance",
          q: topic,
          type: "video",
          videoDuration: "long",
          key: key,
        },
      });
      return response;
    });

    if (!searchResponse?.data?.items?.length) return null;

    // Get all video IDs
    const videoIds = searchResponse.data.items.map(item => item.id.videoId);

    // Get details for all videos with retry logic
    const detailsResponse = await tryWithMultipleKeys(async (key) => {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: "contentDetails,snippet",
          id: videoIds.join(','),
          key: key,
        },
      });
      return response;
    });

    if (!detailsResponse?.data?.items?.length) return null;

    // Find the first video that meets our duration criteria
    for (const video of detailsResponse.data.items) {
      const duration = video.contentDetails.duration;
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = (match[1] ? parseInt(match[1]) : 0);
      const minutes = (match[2] ? parseInt(match[2]) : 0);
      const seconds = (match[3] ? parseInt(match[3]) : 0);
      
      const totalMinutes = hours * 60 + minutes + seconds / 60;

      if (totalMinutes >= 10) {
        logger.debug("Found suitable video", { topic, videoId: video.id, duration });
        return {
          videoId: video.id,
          duration: duration,
          title: video.snippet.title,
          description: video.snippet.description
        };
      }
    }
    
    return null;
  } catch (error) {
    logger.error("Error searching YouTube video", { topic, error: error.message });
    return null;
  }
};

/**
 * Generates an AI learning roadmap for a given topic
 * @param {string} prompt - The learning topic/prompt
 * @returns {Promise<Object>} The generated roadmap
 * @throws {Error} If topic is invalid or generation fails
 */
const generateRoadmap = async (prompt) => {
  try {
    logExternalApi("groq", "validate_topic", { prompt });
    
    // Check if the prompt is related to CS/IT
    const validationResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a validator that checks if a query is related to computer science, programming, or IT. Respond with only 'true' if it is related, or 'false' if it's not. Be strict in validation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 10,
    });

    const isValidTopic = validationResponse.choices[0].message.content.toLowerCase().includes('true');
    
    if (!isValidTopic) {
      logger.warn("Invalid roadmap topic rejected", { prompt });
      throw new Error("INVALID_TOPIC");
    }

    logger.info("Generating roadmap", { prompt });
    logExternalApi("groq", "generate_roadmap");
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Create a detailed computer science/IT learning roadmap in JSON format. Break down the learning path into steps, where each step represents a topic to master. Include a description of what to learn in each step (atleast 5 steps) and relevant documentation links. The format should be: { 'steps': [{ 'step': 1, 'topic': 'string', 'description': 'string', 'documentation': 'string' }] }"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    let roadmapContent = chatCompletion.choices[0].message.content;
    logger.debug("Raw roadmap response received", { responseLength: roadmapContent.length });
    
    // Clean up the response
    roadmapContent = roadmapContent
        // Remove markdown code blocks
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        // Extract JSON content
        .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1')
        // Replace single quotes with double quotes
        .replace(/'/g, '"')
        // Remove any trailing commas before closing brackets
        .replace(/,(\s*[}\]])/g, '$1')
        // Trim whitespace
        .trim();
    
    // Parse the content
    let parsedContent;
    try {
        parsedContent = JSON.parse(roadmapContent);
    } catch (error) {
        logger.error("JSON parsing error in roadmap generation", { 
          error: error.message,
          cleanedContent: roadmapContent.substring(0, 500)
        });
        throw new Error("Failed to parse roadmap content");
    }
    
    // Add video IDs and durations for each step
    for (const step of parsedContent.steps) {
      const searchQuery = `${step.topic} programming tutorial`;
      const videoInfo = await searchYouTubeVideo(searchQuery);
      if (videoInfo) {
        step.videoId = videoInfo.videoId;
        step.videoDuration = videoInfo.duration;
        step.videoTitle = videoInfo.title;
        step.videoDescription = videoInfo.description;
      }
    }
    
    logger.info("Roadmap generated successfully", { 
      stepCount: parsedContent.steps.length,
      hasVideos: parsedContent.steps.some(s => s.videoId)
    });
    
    return parsedContent;
  } catch (error) {
    logger.error("Error generating roadmap", { prompt, error: error.message });
    throw error;
  }
};

/**
 * Creates and saves a new roadmap
 * @param {string} title - Roadmap title
 * @param {string} prompt - The learning topic prompt
 * @param {string} author - Clerk user ID of the author
 * @returns {Promise<Object>} The created roadmap
 */
export const createRoadmap = async (title, prompt, author) => {
  try {
    // Validate input with Zod schema (throws on validation failure)
    const validatedData = validateOrThrow(createRoadmapSchema, { title, prompt });

    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) throw new Error("User not found");

    const content = await generateRoadmap(validatedData.prompt);
    
    logDatabase("create", "Roadmap", { title: validatedData.title, author: user.userName });
    const roadmap = await Roadmap.create({
      title: validatedData.title,
      prompt: validatedData.prompt,
      content,
      author: user.userName,
    });

    logger.info("Roadmap created", { 
      roadmapId: roadmap._id, 
      title, 
      author: user.userName 
    });
    events.roadmapCreated(author, roadmap._id, title);

    return roadmap.toObject();
  } catch (error) {
    logger.error("Error creating roadmap", { title, author, error: error.message });
    // Preserve the original error message
    if (error.message === "INVALID_TOPIC") {
      throw new Error("INVALID_TOPIC");
    }
    throw error;
  }
};

/**
 * Gets all roadmaps for a user
 * @param {string} author - Clerk user ID
 * @returns {Promise<Array>} List of roadmaps
 */
export const getUserRoadmaps = async (author) => {
  try {
    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) throw new Error("User not found");

    logDatabase("find", "Roadmap", { author: user.userName });
    const roadmaps = await Roadmap.find({ author: user.userName }).sort({ createdAt: -1 });
    
    logger.debug("User roadmaps fetched", { 
      author: user.userName, 
      count: roadmaps.length 
    });
    
    return JSON.parse(JSON.stringify(roadmaps)); // Convert to plain object
  } catch (error) {
    logger.error("Error fetching roadmaps", { author, error: error.message });
    throw error;
  }
};

/**
 * Gets a roadmap by ID
 * @param {string} id - Roadmap ID
 * @returns {Promise<Object|null>} The roadmap or null
 */
export const getRoadmapById = async (id) => {
  try {
    await connect();
    logDatabase("findById", "Roadmap", { id });
    
    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      logger.debug("Roadmap not found", { id });
      return null;
    }
    
    return JSON.parse(JSON.stringify(roadmap)); // Convert to plain object
  } catch (error) {
    logger.error("Error getting roadmap", { id, error: error.message });
    throw error;
  }
};

/**
 * Deletes a roadmap by ID
 * @param {string} id - Roadmap ID
 * @param {string} userId - Clerk user ID (for authorization)
 * @returns {Promise<Object>} Success message
 * @throws {Error} If unauthorized or roadmap not found
 */
export const deleteRoadmap = async (id, userId) => {
  try {
    await connect();
    
    // Get user to verify ownership
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // Find roadmap
    logDatabase("findById", "Roadmap", { id });
    const roadmap = await Roadmap.findById(id);
    
    if (!roadmap) {
      logger.debug("Roadmap not found for deletion", { id });
      throw new Error("Roadmap not found");
    }

    // Verify ownership
    if (roadmap.author !== user.userName) {
      logger.warn("Unauthorized roadmap deletion attempt", { 
        id, 
        author: roadmap.author, 
        user: user.userName 
      });
      throw new Error("Unauthorized: You can only delete your own roadmaps");
    }

    // Delete the roadmap
    logDatabase("delete", "Roadmap", { id, author: user.userName });
    await Roadmap.findByIdAndDelete(id);
    
    logger.info("Roadmap deleted", { 
      roadmapId: id, 
      author: user.userName 
    });
    events.roadmapDeleted && events.roadmapDeleted(userId, id);

    return { success: true, message: "Roadmap deleted successfully" };
  } catch (error) {
    logger.error("Error deleting roadmap", { id, userId, error: error.message });
    throw error;
  }
};