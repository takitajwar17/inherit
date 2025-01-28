"use server";

import Roadmap from "../models/roadmapModel";
import User from "../models/userModel";
import { connect } from "../mongodb/mongoose";
const Groq = require("groq-sdk");
const axios = require('axios');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Function to get a random API key
const getRandomApiKey = () => {
  const apiKeys = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.split(',');
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};

// Try an API request with multiple keys until success or all keys exhausted
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
  console.error('All API keys failed:', errors);
  return null;
};

const searchYouTubeVideo = async (topic) => {
  try {
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
    console.error("Error searching YouTube video:", error);
    return null;
  }
};

const generateRoadmap = async (prompt) => {
  try {
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
      throw new Error("INVALID_TOPIC");
    }

    console.log("Generating roadmap...");
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
    console.log("Raw response:", roadmapContent);
    
    // Function to validate roadmap structure
    const isValidRoadmap = (obj) => {
      return obj && 
             Array.isArray(obj.steps) && 
             obj.steps.length > 0 &&
             obj.steps.every(step => 
               typeof step.step === 'number' &&
               typeof step.topic === 'string' &&
               typeof step.description === 'string' &&
               typeof step.documentation === 'string'
             );
    };

    // Extract and clean JSON content
    try {
      // Remove markdown code block syntax
      roadmapContent = roadmapContent.replace(/```json\s*|\s*```/g, '');
      
      // Find the JSON object
      const jsonMatch = roadmapContent.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('No valid JSON object found in the response');
      }
      
      roadmapContent = jsonMatch[1]
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Parse the content
      const parsedContent = JSON.parse(roadmapContent);

      // Validate the roadmap structure
      if (!isValidRoadmap(parsedContent)) {
        throw new Error('Invalid roadmap structure');
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

      console.log("Roadmap Generated Successfully with videos");
      return parsedContent;
    } catch (error) {
      console.error("Error processing roadmap content:", error);
      
      // If there's an error, try to generate a simpler roadmap
      const retryCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Create a simple learning roadmap in JSON format with exactly 5 steps. Use this exact format, no extra text: {\"steps\":[{\"step\":1,\"topic\":\"string\",\"description\":\"string\",\"documentation\":\"string\"}]}"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024
      });

      const retryContent = retryCompletion.choices[0].message.content;
      const parsedRetry = JSON.parse(retryContent);
      
      if (!isValidRoadmap(parsedRetry)) {
        throw new Error('Failed to generate valid roadmap structure');
      }

      console.log("Generated simplified roadmap as fallback");
      return parsedRetry;
    }
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw error;
  }
};

export const createRoadmap = async (title, prompt, author) => {
  try {
    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) throw new Error("User not found");

    const content = await generateRoadmap(prompt);
    
    const roadmap = await Roadmap.create({
      title,
      prompt,
      content,
      author: user.userName,
    });

    return roadmap.toObject();
  } catch (error) {
    console.error("Error creating roadmap:", error);
    // Preserve the original error message
    if (error.message === "INVALID_TOPIC") {
      throw new Error("INVALID_TOPIC");
    }
    throw error;
  }
};

export const getUserRoadmaps = async (author) => {
  try {
    await connect();
    const user = await User.findOne({ clerkId: author });
    if (!user) throw new Error("User not found");

    const roadmaps = await Roadmap.find({ author: user.userName }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(roadmaps)); // Convert to plain object
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    throw error;
  }
};

export const getRoadmapById = async (id) => {
  try {
    await connect();
    const roadmap = await Roadmap.findById(id);
    if (!roadmap) return null;
    return JSON.parse(JSON.stringify(roadmap)); // Convert to plain object
  } catch (error) {
    console.error("Error getting roadmap:", error);
    throw error;
  }
};
