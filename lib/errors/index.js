/**
 * Application Error Classes
 * 
 * Standardized error types for consistent error handling throughout the application.
 * Each error class maps to a specific HTTP status code and error code.
 * 
 * Error Hierarchy:
 * - AppError (base class)
 *   ├── ValidationError (400)
 *   ├── AuthenticationError (401)
 *   ├── AuthorizationError (403)
 *   ├── NotFoundError (404)
 *   ├── ConflictError (409)
 *   ├── RateLimitError (429)
 *   ├── ExternalServiceError (502)
 *   └── InternalServerError (500)
 * 
 * @module lib/errors
 */

/**
 * Base application error class
 * All custom errors should extend this class
 * 
 * @extends Error
 */
export class AppError extends Error {
  /**
   * Creates an AppError instance
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code
   * @param {Array|Object|null} details - Additional error details (e.g., validation errors)
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes from programming errors
    
    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes error for JSON response
   * @returns {Object} JSON-safe error representation
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Validation Error (400 Bad Request)
 * Use when request data fails validation
 * 
 * @example
 * throw new ValidationError('Invalid email format', [
 *   { field: 'email', message: 'Must be a valid email address' }
 * ]);
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Array} details - Array of field-level validation errors
   */
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Use when user identity cannot be verified
 * 
 * @example
 * throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIALS');
 */
export class AuthenticationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} code - Specific auth error code
   */
  constructor(message = 'Authentication required', code = 'AUTHENTICATION_REQUIRED') {
    super(message, 401, code);
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Use when user is authenticated but lacks permission
 * 
 * @example
 * throw new AuthorizationError('Admin access required');
 */
export class AuthorizationError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Not Found Error (404 Not Found)
 * Use when a requested resource doesn't exist
 * 
 * @example
 * throw new NotFoundError('Quest', questId);
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} resource - Name of the resource type
   * @param {string|null} id - Optional resource identifier
   */
  constructor(resource = 'Resource', id = null) {
    const message = id 
      ? `${resource} with ID '${id}' not found` 
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * Conflict Error (409 Conflict)
 * Use when request conflicts with current state (e.g., duplicate)
 * 
 * @example
 * throw new ConflictError('You have already attempted this quest');
 */
export class ConflictError extends AppError {
  /**
   * @param {string} message - Error message describing the conflict
   */
  constructor(message = 'Resource already exists') {
    super(message, 409, 'ALREADY_EXISTS');
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 * Use when user has exceeded rate limits
 * 
 * @example
 * throw new RateLimitError(60); // Retry after 60 seconds
 */
export class RateLimitError extends AppError {
  /**
   * @param {number} retryAfter - Seconds until rate limit resets
   */
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * External Service Error (502 Bad Gateway)
 * Use when a third-party service fails
 * 
 * @example
 * throw new ExternalServiceError('Groq AI', 'Rate limit exceeded');
 */
export class ExternalServiceError extends AppError {
  /**
   * @param {string} service - Name of the external service
   * @param {string} message - Specific error message
   */
  constructor(service, message = 'External service unavailable') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Internal Server Error (500 Internal Server Error)
 * Use for unexpected server-side errors
 * Generally, you should let unknown errors bubble up instead of using this directly
 * 
 * @example
 * throw new InternalServerError('Database connection failed');
 */
export class InternalServerError extends AppError {
  /**
   * @param {string} message - Error message (will be masked in production)
   */
  constructor(message = 'An unexpected error occurred') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Checks if an error is an operational error (safe to show to users)
 * Operational errors are expected errors that we can handle gracefully
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if operational (safe to expose)
 */
export function isOperationalError(error) {
  return error instanceof AppError && error.isOperational;
}

/**
 * Checks if an error is a specific type
 * 
 * @param {Error} error - Error to check
 * @param {string} code - Error code to match
 * @returns {boolean} True if error matches the code
 */
export function isErrorCode(error, code) {
  return error instanceof AppError && error.code === code;
}

/**
 * Wraps an unknown error into an AppError
 * Preserves AppErrors, wraps others in InternalServerError
 * 
 * @param {Error} error - Error to wrap
 * @returns {AppError} Wrapped error
 */
export function wrapError(error) {
  if (error instanceof AppError) {
    return error;
  }
  
  // Create internal error but preserve original for logging
  const wrapped = new InternalServerError(error.message);
  wrapped.originalError = error;
  wrapped.stack = error.stack;
  return wrapped;
}

/**
 * Error codes enum for type-safe error checking
 */
export const ErrorCodes = {
  // Validation (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  
  // Authentication (401)
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Authorization (403)
  FORBIDDEN: 'FORBIDDEN',
  
  // Not Found (404)
  NOT_FOUND: 'NOT_FOUND',
  
  // Conflict (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Rate Limit (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External Service (502)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Internal (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

