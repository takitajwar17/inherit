/**
 * API Response Helpers
 * 
 * Utilities for creating standardized API responses.
 * Provides consistent success and error response formats.
 * 
 * @module lib/errors/apiResponse
 */

import { NextResponse } from 'next/server';
import { AppError, isOperationalError, wrapError } from './index';
import logger from '@/lib/logger';

// ============================================
// Response Creators
// ============================================

/**
 * Creates a standardized success response
 * 
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {NextResponse} JSON response
 * 
 * @example
 * return successResponse({ quest: questData });
 * return successResponse({ id: newQuest._id }, 201);
 */
export function successResponse(data, statusCode = 200) {
  return NextResponse.json(
    { success: true, data },
    { status: statusCode }
  );
}

/**
 * Creates a standardized error response
 * Handles both operational and programming errors
 * 
 * @param {Error|AppError} error - Error to respond with
 * @param {string|null} requestId - Optional request ID for tracking
 * @returns {NextResponse} JSON error response
 * 
 * @example
 * return errorResponse(new NotFoundError('Quest', questId), requestId);
 */
export function errorResponse(error, requestId = null) {
  const id = requestId || generateRequestId();
  const timestamp = new Date().toISOString();
  
  // Wrap error if needed
  const appError = wrapError(error);
  
  // Build response object
  const response = {
    success: false,
    error: {
      code: appError.code,
      message: isOperationalError(appError) 
        ? appError.message 
        : 'An unexpected error occurred. Please try again later.',
      requestId: id,
      timestamp,
    },
  };
  
  // Add details for validation errors
  if (appError.details) {
    response.error.details = appError.details;
  }
  
  // Log the error
  if (isOperationalError(appError)) {
    logger.warn(`API Error: ${appError.code}`, {
      requestId: id,
      statusCode: appError.statusCode,
      message: appError.message,
      details: appError.details,
    });
  } else {
    // Log full details for unexpected errors
    logger.error('Unhandled API Error', {
      requestId: id,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    });
  }
  
  // Build headers
  const headers = {};
  
  // Add Retry-After header for rate limits
  if (appError.code === 'RATE_LIMIT_EXCEEDED' && appError.retryAfter) {
    headers['Retry-After'] = String(appError.retryAfter);
  }
  
  // Add WWW-Authenticate for auth errors
  if (appError.statusCode === 401) {
    headers['WWW-Authenticate'] = 'Bearer realm="API Access"';
  }
  
  return NextResponse.json(response, { 
    status: appError.statusCode,
    headers,
  });
}

// ============================================
// Request ID Generation
// ============================================

/**
 * Generates a unique request ID for error tracking
 * Format: req_<timestamp_base36>_<random>
 * 
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `req_${timestamp}_${random}`;
}

// ============================================
// Higher-Order Functions
// ============================================

/**
 * Wraps an API handler with automatic error handling
 * Catches all errors and returns standardized error responses
 * 
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 * 
 * @example
 * export const POST = withErrorHandling(async (request, context, requestId) => {
 *   const body = await request.json();
 *   // ... your logic
 *   return successResponse(result);
 * });
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    const requestId = generateRequestId();
    
    try {
      // Call the handler with requestId for logging
      return await handler(request, context, requestId);
    } catch (error) {
      return errorResponse(error, requestId);
    }
  };
}

/**
 * Combines rate limiting with error handling
 * Use when you need both rate limiting and error handling
 * 
 * @param {Function} rateLimitWrapper - Rate limit middleware
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 * 
 * @example
 * export const POST = withRateLimitAndErrorHandling(
 *   adminAuthLimiter,
 *   async (request, context, requestId) => {
 *     // ... your logic
 *   }
 * );
 */
export function withRateLimitAndErrorHandling(rateLimitWrapper, handler) {
  // The rate limiter already wraps the handler
  // We wrap that with error handling
  return withErrorHandling(async (request, context, requestId) => {
    // Create a modified handler that passes requestId
    const handlerWithRequestId = async (req, ctx) => {
      return handler(req, ctx, requestId);
    };
    
    // Apply rate limiting
    const rateLimitedHandler = rateLimitWrapper(handlerWithRequestId);
    return rateLimitedHandler(request, context);
  });
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Parses JSON body with error handling
 * Throws ValidationError for invalid JSON
 * 
 * @param {Request} request - Incoming request
 * @returns {Promise<Object>} Parsed JSON body
 * @throws {ValidationError} If JSON is invalid
 * 
 * @example
 * const body = await parseJsonBody(request);
 */
export async function parseJsonBody(request) {
  const { ValidationError } = await import('./index');
  
  try {
    return await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON body');
  }
}

/**
 * Validates request body against a Zod schema
 * Throws ValidationError if validation fails
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 * 
 * @example
 * const validatedBody = validateBody(createQuestSchema, body);
 */
export function validateBody(schema, data) {
  const { ValidationError } = require('./index');
  const { z } = require('zod');
  
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = (error.issues || error.errors || []).map(e => ({
        field: e.path?.join('.') || '',
        message: e.message || 'Validation error',
      }));
      
      const message = details.length > 0
        ? details.map(e => e.field ? `${e.field}: ${e.message}` : e.message).join(', ')
        : 'Validation failed';
      
      throw new ValidationError(message, details);
    }
    throw error;
  }
}

// ============================================
// Common Response Patterns
// ============================================

/**
 * Creates a 201 Created response
 * @param {any} data - Created resource data
 */
export function createdResponse(data) {
  return successResponse(data, 201);
}

/**
 * Creates a 204 No Content response
 */
export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Creates a redirect response
 * @param {string} url - URL to redirect to
 * @param {number} status - Redirect status (default: 302)
 */
export function redirectResponse(url, status = 302) {
  return NextResponse.redirect(url, status);
}

