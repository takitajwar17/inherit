/**
 * Response Cache for AI Agents
 * 
 * Simple in-memory cache for common agent responses.
 * Reduces API calls for frequently asked questions.
 * 
 * @module lib/cache/responseCache
 */

import crypto from 'crypto';
import logger from '@/lib/logger';

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 100,           // Maximum number of cached responses
  ttl: 3600000,          // Time to live: 1 hour in milliseconds
  enabledAgents: ['general', 'learning'], // Only cache for these agents
};

// In-memory cache store
const cache = new Map();

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  size: 0,
};

/**
 * Generate cache key from message and context
 * @param {string} message - User message
 * @param {string} agentType - Agent type
 * @param {string} language - Language code
 * @returns {string} Cache key hash
 */
function generateCacheKey(message, agentType, language = 'en') {
  const normalized = message.toLowerCase().trim();
  const keyString = `${agentType}:${language}:${normalized}`;
  return crypto.createHash('md5').update(keyString).digest('hex');
}

/**
 * Check if cache entry is expired
 * @param {Object} entry - Cache entry
 * @returns {boolean} True if expired
 */
function isExpired(entry) {
  return Date.now() - entry.timestamp > CACHE_CONFIG.ttl;
}

/**
 * Evict oldest entries if cache is full
 */
function evictOldest() {
  if (cache.size < CACHE_CONFIG.maxSize) return;

  // Find oldest entry
  let oldestKey = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache.entries()) {
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey);
    stats.evictions++;
    stats.size = cache.size;
  }
}

/**
 * Get cached response
 * @param {string} message - User message
 * @param {string} agentType - Agent type
 * @param {string} language - Language code
 * @returns {Object|null} Cached response or null
 */
export function getCachedResponse(message, agentType, language = 'en') {
  // Only cache for enabled agents
  if (!CACHE_CONFIG.enabledAgents.includes(agentType)) {
    return null;
  }

  const key = generateCacheKey(message, agentType, language);
  const entry = cache.get(key);

  if (!entry) {
    stats.misses++;
    return null;
  }

  // Check if expired
  if (isExpired(entry)) {
    cache.delete(key);
    stats.size = cache.size;
    stats.misses++;
    return null;
  }

  stats.hits++;
  logger.debug('Cache hit', {
    agentType,
    language,
    messageLength: message.length,
    cacheAge: Date.now() - entry.timestamp,
  });

  return entry.response;
}

/**
 * Set cached response
 * @param {string} message - User message
 * @param {string} agentType - Agent type
 * @param {string} language - Language code
 * @param {Object} response - Response to cache
 */
export function setCachedResponse(message, agentType, language, response) {
  // Only cache for enabled agents
  if (!CACHE_CONFIG.enabledAgents.includes(agentType)) {
    return;
  }

  // Only cache successful responses
  if (response.error) {
    return;
  }

  evictOldest();

  const key = generateCacheKey(message, agentType, language);
  cache.set(key, {
    response,
    timestamp: Date.now(),
  });

  stats.size = cache.size;

  logger.debug('Response cached', {
    agentType,
    language,
    messageLength: message.length,
    cacheSize: cache.size,
  });
}

/**
 * Clear entire cache
 */
export function clearCache() {
  const oldSize = cache.size;
  cache.clear();
  stats.size = 0;
  logger.info('Cache cleared', { entriesRemoved: oldSize });
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const hitRate = stats.hits + stats.misses > 0
    ? (stats.hits / (stats.hits + stats.misses)) * 100
    : 0;

  return {
    ...stats,
    hitRate: hitRate.toFixed(2) + '%',
    maxSize: CACHE_CONFIG.maxSize,
    ttl: CACHE_CONFIG.ttl,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  stats.hits = 0;
  stats.misses = 0;
  stats.evictions = 0;
  logger.info('Cache statistics reset');
}

export default {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats,
  resetCacheStats,
};
