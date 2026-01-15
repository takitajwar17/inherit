// Gemini Client Configuration

/**
 * Gemini Client Configuration
 *
 * LangChain integration with Google Gemini for multi-agent system.
 * Uses GOOGLE_API_KEY environment variable.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import logger from "@/lib/logger";

// Model configurations for different purposes
const ModelConfig = {
  // Fast model for routing and simple tasks
  fast: {
    model: "models/gemini-2.5-flash",
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
  // Main model for complex reasoning
  main: {
    model: "models/gemini-2.5-flash",
    temperature: 0.7,
    maxOutputTokens: 4096,
  },
  // Creative model for explanations and learning
  creative: {
    model: "models/gemini-2.5-flash",
    temperature: 0.9,
    maxOutputTokens: 4096,
  },
};

// Model instance pool for reusing models across requests
const modelPool = {
  fast: null,
  main: null,
  creative: null,
};

/**
 * Clear model pool (useful for testing or reinitialization)
 */
export function clearModelPool() {
  modelPool.fast = null;
  modelPool.main = null;
  modelPool.creative = null;
  logger.info("Model pool cleared");
}

/**
 * Create a Gemini model instance
 * Uses model pooling to reuse instances across requests
 * @param {string} type - Model type: 'fast', 'main', or 'creative'
 * @returns {ChatGoogleGenerativeAI} LangChain Gemini model
 */
export function createGeminiModel(type = "main") {
  // Return pooled instance if available
  if (modelPool[type]) {
    logger.debug("Using pooled Gemini model", { type });
    return modelPool[type];
  }

  const config = ModelConfig[type] || ModelConfig.main;

  // Validate API key exists and is properly formatted
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    logger.error("GOOGLE_API_KEY environment variable is not set or invalid", {
      hint: "Please ensure GOOGLE_API_KEY is defined in your .env.local file",
      getKeyFrom: "https://aistudio.google.com/app/apikey",
      apiKeyDefined: !!apiKey,
      apiKeyType: typeof apiKey,
    });
    throw new Error(
      "GOOGLE_API_KEY environment variable is not configured or invalid. Please add a valid API key to your .env.local file. Get one from: https://aistudio.google.com/app/apikey"
    );
  }

  const trimmedKey = apiKey.trim();

  logger.debug("Creating Gemini model", {
    type,
    model: config.model,
    temperature: config.temperature,
    keyLength: trimmedKey.length,
  });

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: trimmedKey,
      ...config,
    });
    
    logger.debug("Gemini model created successfully", { type });
    
    // Store in pool for reuse
    modelPool[type] = model;
    
    return model;
  } catch (err) {
    logger.error("Failed to create Gemini model", {
      error: err.message,
      errorName: err.name,
      type,
      hint: "Please verify your GOOGLE_API_KEY is valid",
    });
    throw new Error(`Failed to initialize Gemini model (${type}): ${err.message}. Please verify your GOOGLE_API_KEY is valid.`);
  }
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
