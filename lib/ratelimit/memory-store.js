/**
 * In-Memory Rate Limiter Store
 * 
 * Simple rate limiter for development and single-instance deployments.
 * Uses a Map to store request counts per identifier.
 * 
 * For production with multiple serverless instances, use Upstash Redis instead.
 */

/** @type {Map<string, { count: number, resetTime: number }>} */
const store = new Map();

/**
 * Clean up expired entries periodically
 * Runs every 60 seconds to prevent memory leaks
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetTime < now) {
        store.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Creates an in-memory rate limiter
 * 
 * @param {Object} config - Limiter configuration
 * @param {number} config.requests - Number of requests allowed in window
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {string} config.name - Limiter name for identification
 * @returns {Object} Rate limiter instance
 * 
 * @example
 * const limiter = createMemoryLimiter({
 *   name: 'admin-auth',
 *   requests: 5,
 *   windowMs: 15 * 60 * 1000 // 15 minutes
 * });
 * 
 * const result = await limiter.check('192.168.1.1');
 * if (!result.success) {
 *   // Rate limited!
 * }
 */
export function createMemoryLimiter({ requests, windowMs, name }) {
  return {
    name,
    requests,
    windowMs,
    
    /**
     * Check if a request should be allowed
     * 
     * @param {string} identifier - Unique identifier (IP, user ID, etc.)
     * @returns {Promise<{ success: boolean, remaining: number, reset: number, limit: number }>}
     */
    async check(identifier) {
      const key = `${name}:${identifier}`;
      const now = Date.now();
      
      let record = store.get(key);
      
      // Create new window if none exists or window expired
      if (!record || record.resetTime < now) {
        record = {
          count: 0,
          resetTime: now + windowMs,
        };
      }
      
      // Increment request count
      record.count++;
      store.set(key, record);
      
      // Calculate remaining requests and success status
      const remaining = Math.max(0, requests - record.count);
      const success = record.count <= requests;
      const reset = Math.ceil((record.resetTime - now) / 1000);
      
      return {
        success,
        remaining,
        reset,
        limit: requests,
      };
    },
    
    /**
     * Reset rate limit for an identifier
     * Useful for testing or admin overrides
     * 
     * @param {string} identifier - Unique identifier to reset
     */
    async reset(identifier) {
      const key = `${name}:${identifier}`;
      store.delete(key);
    },
    
    /**
     * Get current state for an identifier (for debugging)
     * 
     * @param {string} identifier - Unique identifier
     * @returns {{ count: number, resetTime: number } | null}
     */
    getState(identifier) {
      const key = `${name}:${identifier}`;
      return store.get(key) || null;
    },
  };
}

/**
 * Clear all rate limit records (for testing)
 */
export function clearAllLimits() {
  store.clear();
}

/**
 * Get store size (for monitoring)
 * @returns {number}
 */
export function getStoreSize() {
  return store.size;
}

