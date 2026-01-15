// Gemini Client Configuration

/**
 * Gemini Client Configuration
 *
 * LangChain integration with Google Gemini for multi-agent system.
 * Includes API key rotation for efficient usage.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import logger from "@/lib/logger";

// Model configurations for different purposes
const ModelConfig = {
  // Fast model for routing and simple tasks
  fast: {
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxOutputTokens: 512,
  },
  // Main model for complex reasoning
  main: {
    model: "gemini-2.5-flash",
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
  // Creative model for explanations and learning
  creative: {
    model: "gemini-2.5-flash",
    temperature: 0.9,
    maxOutputTokens: 2048,
  },
};

// ============================================
// API KEY ROTATION SYSTEM
// ============================================

/**
 * Load all available API keys from environment
 */
function loadApiKeys() {
  const keys = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_1,
    process.env.GOOGLE_API_KEY_2,
    process.env.GOOGLE_API_KEY_3,
    process.env.GOOGLE_API_KEY_4,
  ].filter((key) => key && typeof key === "string" && key.trim().length > 0);

  return keys.map((k) => k.trim());
}

// Track key usage and rate limits
const keyStatus = [];
let currentKeyIndex = 0;
let keysInitialized = false;

/**
 * Initialize key status tracking
 */
function initializeKeyStatus() {
  if (keysInitialized) return;

  const keys = loadApiKeys();

  if (keys.length === 0) {
    logger.error("No Google API keys configured", {
      hint: "Please add GOOGLE_API_KEY to your .env.local file",
      getKeyFrom: "https://aistudio.google.com/app/apikey",
    });
    return;
  }

  keys.forEach((key, index) => {
    keyStatus.push({
      index,
      key,
      requestCount: 0,
      errorCount: 0,
      lastError: null,
      lastUsed: null,
      isRateLimited: false,
      rateLimitResetTime: null,
    });
  });

  keysInitialized = true;
  logger.info(`API key rotation initialized with ${keys.length} key(s)`);
}

/**
 * Get the next available API key (round-robin with rate limit awareness)
 */
function getNextApiKey() {
  initializeKeyStatus();

  if (keyStatus.length === 0) {
    throw new Error(
      "No Google API keys configured. Please add GOOGLE_API_KEY to your .env.local file. Get one from: https://aistudio.google.com/app/apikey"
    );
  }

  const now = Date.now();

  // Try to find a non-rate-limited key
  for (let i = 0; i < keyStatus.length; i++) {
    const index = (currentKeyIndex + i) % keyStatus.length;
    const status = keyStatus[index];

    // Check if rate limit has expired (reset after 60 seconds)
    if (
      status.isRateLimited &&
      status.rateLimitResetTime &&
      now > status.rateLimitResetTime
    ) {
      status.isRateLimited = false;
      status.rateLimitResetTime = null;
      logger.info(`API key ${index + 1} rate limit reset`);
    }

    if (!status.isRateLimited) {
      currentKeyIndex = (index + 1) % keyStatus.length; // Move to next for round-robin
      status.requestCount++;
      status.lastUsed = now;

      logger.debug(`Using API key ${index + 1}/${keyStatus.length}`, {
        requestCount: status.requestCount,
        errorCount: status.errorCount,
      });

      return { key: status.key, index };
    }
  }

  // All keys rate limited - find the one with earliest reset time
  const earliestReset = keyStatus.reduce(
    (min, status) =>
      !min ||
      (status.rateLimitResetTime &&
        status.rateLimitResetTime < min.rateLimitResetTime)
        ? status
        : min,
    null
  );

  if (earliestReset) {
    const waitTime = Math.max(0, earliestReset.rateLimitResetTime - now);
    logger.warn(
      `All API keys rate limited. Using key ${
        earliestReset.index + 1
      }, wait time: ${Math.round(waitTime / 1000)}s`
    );
    earliestReset.requestCount++;
    return { key: earliestReset.key, index: earliestReset.index };
  }

  // Fallback to first key
  keyStatus[0].requestCount++;
  return { key: keyStatus[0].key, index: 0 };
}

/**
 * Mark a key as rate limited
 */
function markKeyRateLimited(index) {
  if (keyStatus[index]) {
    keyStatus[index].isRateLimited = true;
    keyStatus[index].rateLimitResetTime = Date.now() + 60000; // Reset after 60 seconds
    keyStatus[index].errorCount++;
    keyStatus[index].lastError = new Date().toISOString();

    logger.warn(`API key ${index + 1} marked as rate limited`, {
      errorCount: keyStatus[index].errorCount,
      resetIn: "60s",
      totalKeys: keyStatus.length,
    });
  }
}

/**
 * Get API key usage statistics
 */
export function getApiKeyStats() {
  initializeKeyStatus();

  return {
    totalKeys: keyStatus.length,
    currentKeyIndex,
    keys: keyStatus.map((status, i) => ({
      key: i + 1,
      requests: status.requestCount,
      errors: status.errorCount,
      isRateLimited: status.isRateLimited,
      lastUsed: status.lastUsed
        ? new Date(status.lastUsed).toISOString()
        : null,
      lastError: status.lastError,
    })),
  };
}

// ============================================
// MODEL POOL WITH KEY ROTATION
// ============================================

// Model instance pool - keyed by type AND api key index
const modelPool = new Map();

/**
 * Clear model pool (useful for testing or reinitialization)
 */
export function clearModelPool() {
  modelPool.clear();
  logger.info("Model pool cleared");
}

/**
 * Create a Gemini model instance with automatic key rotation
 * @param {string} type - Model type: 'fast', 'main', or 'creative'
 * @returns {ChatGoogleGenerativeAI} LangChain Gemini model
 */
export function createGeminiModel(type = "main") {
  const config = ModelConfig[type] || ModelConfig.main;
  const { key, index } = getNextApiKey();

  // Create pool key
  const poolKey = `${type}_${index}`;

  // Return cached model if exists for this key
  if (modelPool.has(poolKey)) {
    logger.debug("Using pooled Gemini model", { type, keyIndex: index + 1 });
    return modelPool.get(poolKey);
  }

  logger.debug("Creating Gemini model", {
    type,
    model: config.model,
    temperature: config.temperature,
    keyIndex: index + 1,
  });

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: key,
      ...config,
    });

    // Wrap invoke to handle rate limits automatically
    const originalInvoke = model.invoke.bind(model);
    model.invoke = async (...args) => {
      try {
        return await originalInvoke(...args);
      } catch (error) {
        const errorMsg = error.message?.toLowerCase() || "";

        // Check if it's a rate limit error
        if (
          errorMsg.includes("429") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("rate") ||
          errorMsg.includes("resource exhausted")
        ) {
          markKeyRateLimited(index);

          // Try with a different key if available
          if (keyStatus.length > 1) {
            logger.info("Retrying with different API key due to rate limit");
            clearModelPool(); // Clear pool to force new key selection
            const newModel = createGeminiModel(type);
            return await newModel.invoke(...args);
          }
        }
        throw error;
      }
    };

    logger.debug("Gemini model created successfully", {
      type,
      keyIndex: index + 1,
    });

    // Store in pool for reuse
    modelPool.set(poolKey, model);

    return model;
  } catch (err) {
    logger.error("Failed to create Gemini model", {
      error: err.message,
      errorName: err.name,
      type,
      keyIndex: index + 1,
      hint: "Please verify your GOOGLE_API_KEY is valid",
    });
    throw new Error(
      `Failed to initialize Gemini model (${type}): ${err.message}. Please verify your GOOGLE_API_KEY is valid.`
    );
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

/**
 * Get model for roadmap navigation
 */
export function getRoadmapModel() {
  return createGeminiModel("main");
}

/**
 * Get model for general conversation
 */
export function getGeneralModel() {
  return createGeminiModel("creative");
}

export default createGeminiModel;
