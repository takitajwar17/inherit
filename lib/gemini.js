// Gemini Client Configuration

/**
 * Gemini Client Configuration
 *
 * LangChain integration with Google Gemini for multi-agent system.
 * Uses GOOGLE_API_KEY environment variable.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Model configurations for different purposes
const ModelConfig = {
  // Fast model for routing and simple tasks
  fast: {
    modelName: "gemini-2.0-flash",
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
  // Main model for complex reasoning
  main: {
    modelName: "gemini-2.0-flash",
    temperature: 0.7,
    maxOutputTokens: 4096,
  },
  // Creative model for explanations and learning
  creative: {
    modelName: "gemini-2.0-flash",
    temperature: 0.9,
    maxOutputTokens: 4096,
  },
};

/**
 * Create a Gemini model instance
 * @param {string} type - Model type: 'fast', 'main', or 'creative'
 * @returns {ChatGoogleGenerativeAI} LangChain Gemini model
 */
export function createGeminiModel(type = "main") {
  const config = ModelConfig[type] || ModelConfig.main;

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    ...config,
  });
}

/**
 * Get model for router agent (fast, deterministic)
 */
export function getRouterModel() {
  return createGeminiModel("fast");
}

/**
 * Get model for learning companion (creative, explanatory)
 */
export function getLearningModel() {
  return createGeminiModel("creative");
}

/**
 * Get model for task manager (balanced)
 */
export function getTaskModel() {
  return createGeminiModel("main");
}

/**
 * Get model for code assistance (precise)
 */
export function getCodeModel() {
  return createGeminiModel("main");
}

export default createGeminiModel;
