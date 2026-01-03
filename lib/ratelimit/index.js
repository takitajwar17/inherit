/**
 * Rate Limiter Module
 * 
 * Provides configurable rate limiting for API endpoints.
 * Uses in-memory store for development, with optional Upstash Redis support for production.
 * 
 * @module lib/ratelimit
 */

import { createMemoryLimiter } from './memory-store.js';

/**
 * Check if Upstash Redis is configured
 * When both URL and token are present, use Upstash for distributed rate limiting
 */
const USE_UPSTASH = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Cache for Upstash limiters (lazy loaded)
const upstashLimiters = new Map();

/**
 * Creates a rate limiter with the specified configuration
 * 
 * Automatically uses:
 * - Upstash Redis if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set
 * - In-memory store otherwise (suitable for development)
 * 
 * @param {Object} config - Rate limiter configuration
 * @param {number} config.requests - Number of requests allowed in the window
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {string} config.name - Unique name for this limiter (used as key prefix)
 * @returns {Object} Rate limiter instance with check() method
 * 
 * @example
 * const limiter = createRateLimiter({
 *   name: 'admin-auth',
 *   requests: 5,
 *   windowMs: 15 * 60 * 1000 // 15 minutes
 * });
 */
export function createRateLimiter({ requests, windowMs, name }) {
  // Always use in-memory limiter for now
  // Upstash support can be enabled by installing @upstash/ratelimit and @upstash/redis
  // and uncommenting the code below
  
  // For production Upstash support, uncomment this block:
  // if (USE_UPSTASH) {
  //   return createUpstashLimiter({ requests, windowMs, name });
  // }
  
  // Use in-memory limiter
  return createMemoryLimiter({ requests, windowMs, name });
}

/**
 * Extracts a unique identifier from the request for rate limiting
 * 
 * Priority order:
 * 1. x-forwarded-for header (for proxied requests)
 * 2. x-real-ip header (Nginx)
 * 3. cf-connecting-ip header (Cloudflare)
 * 4. 'anonymous' fallback
 * 
 * @param {Request} request - The incoming request object
 * @returns {string} Unique identifier for rate limiting
 */
export function getIdentifier(request) {
  // Try various headers for the real IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  // x-forwarded-for may contain multiple IPs, take the first one
  const ip = forwarded?.split(',')[0]?.trim() 
    || realIp 
    || cfIp 
    || 'anonymous';
  
  return ip;
}

/**
 * Gets user ID from Clerk auth for user-specific rate limiting
 * Falls back to IP if no user is authenticated
 * 
 * @param {Request} request - The incoming request object
 * @param {string|null} userId - Clerk user ID if authenticated
 * @returns {string} Identifier for rate limiting
 */
export function getUserIdentifier(request, userId) {
  if (userId) {
    return `user:${userId}`;
  }
  return getIdentifier(request);
}

// Re-export memory store utilities for testing
export { clearAllLimits, getStoreSize } from './memory-store.js';

