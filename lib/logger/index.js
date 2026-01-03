/**
 * Winston Logger Configuration
 * 
 * Provides structured logging throughout the application with different
 * log levels and formats for development and production environments.
 * 
 * Log Levels:
 * - error (0): System errors, crashes, critical failures
 * - warn (1): Recoverable issues, deprecations, unusual behavior
 * - info (2): Important business events, successful operations
 * - http (3): HTTP request/response logging
 * - debug (4): Detailed debugging information
 * 
 * @module lib/logger
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom log levels with associated colors
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

/**
 * Determines the log level based on environment
 * @returns {string} The log level to use
 */
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL;
  
  if (configuredLevel) {
    return configuredLevel;
  }
  
  return env === 'development' ? 'debug' : 'info';
};

/**
 * Custom format for development - human readable with colors
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      const metaStr = JSON.stringify(meta, null, 2);
      log += `\n${metaStr}`;
    }
    
    return log;
  })
);

/**
 * Custom format for production - JSON structured logging
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  json()
);

/**
 * Create the main logger instance
 */
const logger = winston.createLogger({
  levels,
  level: getLogLevel(),
  defaultMeta: { 
    service: 'inherit-app',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport - always active
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// ============================================
// Convenience Methods for Common Logging Patterns
// ============================================

/**
 * Logs an API request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} [meta] - Additional metadata
 */
export const logRequest = (method, path, meta = {}) => {
  logger.http(`${method} ${path}`, {
    type: 'request',
    method,
    path,
    ...meta,
  });
};

/**
 * Logs an API response
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 * @param {Object} [meta] - Additional metadata
 */
export const logResponse = (method, path, statusCode, duration, meta = {}) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  
  logger[level](`${method} ${path} ${statusCode} ${duration}ms`, {
    type: 'response',
    method,
    path,
    statusCode,
    duration,
    ...meta,
  });
};

/**
 * Logs a database operation
 * @param {string} operation - Operation type (e.g., 'find', 'create', 'update')
 * @param {string} model - Model name
 * @param {Object} [meta] - Additional metadata
 */
export const logDatabase = (operation, model, meta = {}) => {
  logger.debug(`DB ${operation} on ${model}`, {
    type: 'database',
    operation,
    model,
    ...meta,
  });
};

/**
 * Logs an authentication event
 * @param {string} event - Event type (e.g., 'login', 'logout', 'token_refresh')
 * @param {boolean} success - Whether the event was successful
 * @param {Object} [meta] - Additional metadata
 */
export const logAuth = (event, success, meta = {}) => {
  const level = success ? 'info' : 'warn';
  
  logger[level](`Auth ${event}: ${success ? 'success' : 'failed'}`, {
    type: 'auth',
    event,
    success,
    ...meta,
  });
};

/**
 * Logs an external API call
 * @param {string} service - External service name (e.g., 'groq', 'youtube', 'pusher')
 * @param {string} operation - Operation performed
 * @param {Object} [meta] - Additional metadata
 */
export const logExternalApi = (service, operation, meta = {}) => {
  logger.debug(`External API: ${service} - ${operation}`, {
    type: 'external_api',
    service,
    operation,
    ...meta,
  });
};

/**
 * Logs a business event
 * @param {string} event - Event name
 * @param {Object} [meta] - Additional metadata
 */
export const logEvent = (event, meta = {}) => {
  logger.info(`Event: ${event}`, {
    type: 'business_event',
    event,
    ...meta,
  });
};

/**
 * Logs an error with full context
 * @param {string} message - Error message
 * @param {Error} [error] - Error object
 * @param {Object} [meta] - Additional metadata
 */
export const logError = (message, error = null, meta = {}) => {
  logger.error(message, {
    type: 'error',
    errorMessage: error?.message,
    errorName: error?.name,
    stack: error?.stack,
    ...meta,
  });
};

/**
 * Creates a child logger with additional default metadata
 * Useful for request-scoped logging
 * @param {Object} meta - Metadata to include in all logs from this logger
 * @returns {winston.Logger} Child logger instance
 */
export const createChildLogger = (meta) => {
  return logger.child(meta);
};

// ============================================
// Predefined Event Loggers
// ============================================

export const events = {
  // User events
  userCreated: (userId, clerkId) => 
    logEvent('USER_CREATED', { userId, clerkId }),
  userUpdated: (userId) => 
    logEvent('USER_UPDATED', { userId }),
  userDeleted: (userId) => 
    logEvent('USER_DELETED', { userId }),
  
  // Quest events
  questCreated: (questId, name) => 
    logEvent('QUEST_CREATED', { questId, name }),
  questUpdated: (questId) => 
    logEvent('QUEST_UPDATED', { questId }),
  questDeleted: (questId) => 
    logEvent('QUEST_DELETED', { questId }),
  questAttempted: (userId, questId) => 
    logEvent('QUEST_ATTEMPTED', { userId, questId }),
  questCompleted: (userId, questId, score) => 
    logEvent('QUEST_COMPLETED', { userId, questId, score }),
  
  // Roadmap events
  roadmapCreated: (userId, roadmapId, title) => 
    logEvent('ROADMAP_CREATED', { userId, roadmapId, title }),
  roadmapDeleted: (roadmapId) => 
    logEvent('ROADMAP_DELETED', { roadmapId }),
  
  // AI events
  aiEvaluationStarted: (attemptId) => 
    logEvent('AI_EVALUATION_STARTED', { attemptId }),
  aiEvaluationCompleted: (attemptId, duration) => 
    logEvent('AI_EVALUATION_COMPLETED', { attemptId, duration }),
  aiCodeReviewCompleted: (duration) => 
    logEvent('AI_CODE_REVIEW_COMPLETED', { duration }),
  
  // Question events
  questionAsked: (userId, questionId) => 
    logEvent('QUESTION_ASKED', { userId, questionId }),
  questionAnswered: (questionId, replyId) => 
    logEvent('QUESTION_ANSWERED', { questionId, replyId }),
  
  // Admin events
  adminLogin: (username, success) => 
    logAuth('admin_login', success, { username }),
  adminAction: (action, details) => 
    logEvent('ADMIN_ACTION', { action, ...details }),
};

// Export default logger for direct use
export default logger;

