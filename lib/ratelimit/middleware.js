/**
 * Rate Limit Middleware
 * 
 * Provides a wrapper function to add rate limiting to API routes.
 * Handles rate limit checking, response headers, and 429 responses.
 */

import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getIdentifier } from './index.js';

/**
 * Wraps an API route handler with rate limiting
 * 
 * @param {Object} limiter - Rate limiter instance from createRateLimiter()
 * @param {Function} handler - The original route handler function
 * @param {Object} options - Additional options
 * @param {Function} [options.getIdentifier] - Custom identifier function
 * @returns {Function} Wrapped handler with rate limiting
 * 
 * @example
 * // In your route file:
 * import { withRateLimit } from '@/lib/ratelimit/middleware';
 * import { adminAuthLimiter } from '@/lib/ratelimit/limiters';
 * 
 * async function handlePost(req) {
 *   // Your handler logic
 * }
 * 
 * export const POST = withRateLimit(adminAuthLimiter, handlePost);
 */
export function withRateLimit(limiter, handler, options = {}) {
  const customGetIdentifier = options.getIdentifier || getIdentifier;
  
  return async (request, context) => {
    try {
      // Get identifier for rate limiting
      const identifier = customGetIdentifier(request);
      
      // Check rate limit
      const result = await limiter.check(identifier);
      
      // Prepare rate limit headers
      const rateLimitHeaders = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      };
      
      // If rate limited, return 429 response with standardized format
      if (!result.success) {
        const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
        
        logger.warn('Rate limit exceeded', {
          limiter: limiter.name,
          identifier: identifier.substring(0, 20), // Truncate for privacy
          path: request.nextUrl?.pathname || request.url,
          limit: result.limit,
          reset: result.reset,
          requestId,
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded. Please try again in ${result.reset} seconds.`,
              requestId,
              timestamp: new Date().toISOString(),
            }
          },
          { 
            status: 429,
            headers: {
              ...rateLimitHeaders,
              'Retry-After': result.reset.toString(),
            },
          }
        );
      }
      
      // Log rate limit status at debug level
      logger.debug('Rate limit check passed', {
        limiter: limiter.name,
        remaining: result.remaining,
        path: request.nextUrl?.pathname || request.url,
      });
      
      // Call the original handler
      const response = await handler(request, context);
      
      // Add rate limit headers to successful response
      // Clone response to add headers if it's a NextResponse
      if (response instanceof NextResponse) {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
      
      // If response is a plain Response, we need to clone and add headers
      if (response instanceof Response) {
        const newResponse = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        return newResponse;
      }
      
      return response;
      
    } catch (error) {
      // Log error but don't expose rate limiter internals
      logger.error('Rate limit middleware error', {
        limiter: limiter.name,
        error: error.message,
      });
      
      // On error, allow the request through (fail open)
      // This prevents rate limiter issues from blocking all traffic
      return handler(request, context);
    }
  };
}

/**
 * Creates rate limit headers object for manual use
 * 
 * @param {Object} result - Rate limit check result
 * @returns {Object} Headers object
 */
export function createRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Creates a 429 Too Many Requests response
 * 
 * @param {Object} result - Rate limit check result
 * @param {string} [message] - Custom error message
 * @returns {NextResponse} 429 response
 */
export function rateLimitResponse(result, message) {
  return NextResponse.json(
    { 
      error: 'Too many requests',
      message: message || `Rate limit exceeded. Please try again in ${result.reset} seconds.`,
      retryAfter: result.reset,
    },
    { 
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        'Retry-After': result.reset.toString(),
      },
    }
  );
}

