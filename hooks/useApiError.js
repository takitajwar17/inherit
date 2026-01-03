'use client';

/**
 * API Error Handling Hook
 * 
 * Provides consistent error handling for API calls in React components.
 * Supports toast notifications, error state management, and retry logic.
 * 
 * @module hooks/useApiError
 * 
 * @example
 * // Basic usage
 * const { error, handleError, clearError } = useApiError();
 * 
 * // With wrapper function
 * const { withErrorHandling } = useApiError({ showToast: true });
 * const fetchData = withErrorHandling(async () => {
 *   const res = await fetch('/api/data');
 *   if (!res.ok) throw await parseApiError(res);
 *   return res.json();
 * });
 */

import { useState, useCallback } from 'react';

// ============================================
// User-Friendly Error Messages
// ============================================

/**
 * Maps error codes to user-friendly messages
 */
export const ERROR_MESSAGES = {
  // Validation (400)
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_JSON: 'Invalid data format. Please try again.',
  
  // Authentication (401)
  AUTHENTICATION_REQUIRED: 'Please sign in to continue.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_TOKEN: 'Invalid authentication. Please sign in again.',
  
  // Authorization (403)
  FORBIDDEN: "You don't have permission to perform this action.",
  
  // Not Found (404)
  NOT_FOUND: 'The requested item was not found.',
  
  // Conflict (409)
  ALREADY_EXISTS: 'This item already exists.',
  
  // Rate Limit (429)
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  
  // External Service (502)
  EXTERNAL_SERVICE_ERROR: 'A service is temporarily unavailable. Please try again later.',
  
  // Internal (500)
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  
  // Client-side errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PARSE_ERROR: 'Failed to process response. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

/**
 * Gets a user-friendly message for an error code
 * @param {string} code - Error code
 * @returns {string} User-friendly message
 */
export function getErrorMessage(code) {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

// ============================================
// Error Parsing
// ============================================

/**
 * Parses various error formats into a consistent structure
 * 
 * @param {any} error - Error in any format
 * @returns {Object} Standardized error object
 */
export function parseError(error) {
  // API error response format: { success: false, error: { code, message, ... } }
  if (error?.error?.code) {
    return {
      code: error.error.code,
      message: error.error.message || getErrorMessage(error.error.code),
      details: error.error.details || null,
      requestId: error.error.requestId || null,
    };
  }
  
  // Legacy API format: { error: 'message' }
  if (error?.error && typeof error.error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.error,
      details: null,
      requestId: null,
    };
  }
  
  // Standard Error object
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: getErrorMessage('NETWORK_ERROR'),
        details: null,
        requestId: null,
      };
    }
    
    return {
      code: 'CLIENT_ERROR',
      message: error.message,
      details: null,
      requestId: null,
    };
  }
  
  // String error
  if (typeof error === 'string') {
    return {
      code: 'CLIENT_ERROR',
      message: error,
      details: null,
      requestId: null,
    };
  }
  
  // Unknown format
  return {
    code: 'UNKNOWN_ERROR',
    message: getErrorMessage('UNKNOWN_ERROR'),
    details: null,
    requestId: null,
  };
}

/**
 * Parses an API response into an error object
 * Use after checking !response.ok
 * 
 * @param {Response} response - Fetch Response object
 * @returns {Promise<Object>} Parsed error object
 * 
 * @example
 * const res = await fetch('/api/data');
 * if (!res.ok) {
 *   throw await parseApiError(res);
 * }
 */
export async function parseApiError(response) {
  try {
    const data = await response.json();
    return data;
  } catch {
    return {
      error: {
        code: 'PARSE_ERROR',
        message: `Request failed with status ${response.status}`,
      }
    };
  }
}

// ============================================
// useApiError Hook
// ============================================

/**
 * Hook for handling API errors consistently
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.showToast - Whether to show toast notifications (default: false)
 * @param {Function} options.onError - Custom error handler callback
 * @param {Function} options.toastFn - Custom toast function (default: console.error)
 * @returns {Object} Error handling utilities
 * 
 * @example
 * const { error, isError, handleError, clearError, withErrorHandling } = useApiError();
 * 
 * // Manual error handling
 * try {
 *   await someApiCall();
 * } catch (err) {
 *   handleError(err);
 * }
 * 
 * // Automatic error handling with wrapper
 * const safeFetch = withErrorHandling(async () => {
 *   const res = await fetch('/api/data');
 *   if (!res.ok) throw await parseApiError(res);
 *   return res.json();
 * });
 * 
 * const data = await safeFetch(); // Returns null on error
 */
export function useApiError(options = {}) {
  const { 
    showToast = false, 
    onError = null,
    toastFn = null,
  } = options;
  
  const [error, setError] = useState(null);

  /**
   * Handles an error by parsing it and updating state
   */
  const handleError = useCallback((err) => {
    const errorInfo = parseError(err);
    setError(errorInfo);
    
    // Show toast notification if enabled
    if (showToast && toastFn) {
      toastFn(errorInfo.message);
    } else if (showToast) {
      // Fallback to console if no toast function provided
      console.error(`Error: ${errorInfo.message}`);
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(errorInfo);
    }
    
    return errorInfo;
  }, [showToast, onError, toastFn]);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wraps an async function with error handling
   * Returns null on error instead of throwing
   */
  const withErrorHandling = useCallback((asyncFn) => {
    return async (...args) => {
      clearError();
      try {
        return await asyncFn(...args);
      } catch (err) {
        handleError(err);
        return null;
      }
    };
  }, [clearError, handleError]);

  return { 
    error, 
    isError: error !== null,
    handleError, 
    clearError, 
    withErrorHandling,
  };
}

// ============================================
// Fetch Helpers
// ============================================

/**
 * Enhanced fetch that throws on non-2xx responses
 * 
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Object} Parsed API error
 * 
 * @example
 * const response = await safeFetch('/api/quests');
 * const data = await response.json();
 */
export async function safeFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw await parseApiError(response);
  }
  
  return response;
}

/**
 * Fetch wrapper that returns JSON data directly
 * 
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Object} Parsed API error
 * 
 * @example
 * const quests = await fetchJson('/api/quests');
 */
export async function fetchJson(url, options = {}) {
  const response = await safeFetch(url, options);
  return response.json();
}

export default useApiError;

