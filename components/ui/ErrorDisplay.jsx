'use client';

/**
 * Error Display Component
 * 
 * Reusable component for displaying errors in various formats.
 * Supports inline, banner, and fullscreen variants.
 * 
 * @module components/ui/ErrorDisplay
 */

import { AlertTriangle, RefreshCw, X, Home } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/hooks/useApiError';

/**
 * Error Display Component
 * 
 * @param {Object} props
 * @param {Object} props.error - Error object from useApiError
 * @param {string} props.error.code - Error code
 * @param {string} props.error.message - Error message
 * @param {string} props.error.requestId - Request ID for support
 * @param {Array} props.error.details - Validation error details
 * @param {Function} props.onRetry - Optional retry callback
 * @param {Function} props.onDismiss - Optional dismiss callback
 * @param {'inline'|'banner'|'card'|'fullscreen'} props.variant - Display variant
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * // Inline (default)
 * <ErrorDisplay error={error} onRetry={fetchData} />
 * 
 * // Banner style
 * <ErrorDisplay error={error} variant="banner" onDismiss={clearError} />
 * 
 * // Full screen
 * <ErrorDisplay error={error} variant="fullscreen" onRetry={fetchData} />
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'inline',
  className = '',
  title = 'Error',
}) {
  if (!error) return null;

  // Get user-friendly message
  const message = error.code 
    ? getErrorMessage(error.code) 
    : (error.message || 'An error occurred');

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 ${className}`}>
        <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>
          
          {/* Validation error details */}
          {error.details && error.details.length > 0 && (
            <ul className="text-sm text-left text-red-600 bg-red-50 rounded-lg p-4 space-y-1">
              {error.details.map((detail, index) => (
                <li key={index}>
                  {detail.field && <span className="font-medium">{detail.field}: </span>}
                  {detail.message}
                </li>
              ))}
            </ul>
          )}
          
          {/* Request ID for support */}
          {error.requestId && (
            <p className="text-xs text-gray-400">
              Reference: {error.requestId}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className={`bg-red-50 border-l-4 border-red-500 p-4 ${className}`}>
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">{title}</p>
            <p className="text-sm text-red-700 mt-1">{message}</p>
            
            {/* Validation error details */}
            {error.details && error.details.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                {error.details.map((detail, index) => (
                  <li key={index}>
                    {detail.field && <span className="font-medium">{detail.field}: </span>}
                    {detail.message}
                  </li>
                ))}
              </ul>
            )}
            
            {/* Actions */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            )}
            
            {error.requestId && (
              <p className="mt-2 text-xs text-red-500">
                Reference: {error.requestId}
              </p>
            )}
          </div>
          
          {onDismiss && (
            <button 
              onClick={onDismiss} 
              className="ml-3 flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`bg-white border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
            
            {/* Validation error details */}
            {error.details && error.details.length > 0 && (
              <ul className="mt-3 text-sm text-red-600 space-y-1">
                {error.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>
                      {detail.field && <span className="font-medium">{detail.field}: </span>}
                      {detail.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Dismiss
                </button>
              )}
            </div>
            
            {error.requestId && (
              <p className="mt-3 text-xs text-gray-400">
                Reference: {error.requestId}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      
      <p className="text-red-600 font-medium">{message}</p>
      
      {/* Validation error details */}
      {error.details && error.details.length > 0 && (
        <ul className="mt-2 text-sm text-red-500">
          {error.details.map((detail, index) => (
            <li key={index}>
              {detail.field && <span className="font-medium">{detail.field}: </span>}
              {detail.message}
            </li>
          ))}
        </ul>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
      
      {error.requestId && (
        <p className="mt-3 text-xs text-gray-400">
          Reference: {error.requestId}
        </p>
      )}
    </div>
  );
}

/**
 * Inline error message (minimal variant)
 * 
 * @example
 * <InlineError message="Email is required" />
 */
export function InlineError({ message, className = '' }) {
  if (!message) return null;
  
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
}

/**
 * Form field error (for form validation)
 * 
 * @example
 * <FieldError errors={errors} name="email" />
 */
export function FieldError({ errors, name, className = '' }) {
  const error = errors?.find(e => e.field === name);
  if (!error) return null;
  
  return <InlineError message={error.message} className={className} />;
}

export default ErrorDisplay;

