'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * ErrorFallback - The fallback UI that displays when an error is caught
 * 
 * @param {Object} props
 * @param {Error} props.error - The error that was thrown
 * @param {Object} props.errorInfo - React error info with component stack
 * @param {'fullscreen'|'card'|'inline'} props.variant - Display variant
 * @param {string} props.feature - Feature name for better error messages
 * @param {Function} props.onReset - Reset function
 * @param {boolean} props.showDetails - Whether to show error details in dev
 */
export function ErrorFallback({ 
  error, 
  errorInfo,
  variant = 'inline',
  feature,
  onReset,
  showDetails = false,
}) {
  const errorId = error ? `${Date.now()}-${Math.random().toString(36).slice(2)}` : null;
  
  // Get appropriate error message
  const getErrorMessage = () => {
    if (feature) {
      return `The ${feature} couldn't load due to an unexpected error.`;
    }
    return 'An unexpected error occurred.';
  };

  const getErrorTitle = () => {
    if (feature) {
      return `${feature} Error`;
    }
    return 'Something went wrong';
  };

  // Fullscreen variant (for root-level errors)
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {getErrorTitle()}
            </h1>
            <p className="text-gray-600">
              {getErrorMessage()} Please try again.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
          
          {/* Reference ID */}
          {errorId && (
            <p className="text-xs text-gray-400">
              Reference: {errorId}
            </p>
          )}
          
          {/* Development-only error details */}
          {(showDetails || process.env.NODE_ENV === 'development') && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
                Error Details (Development Only)
              </summary>
              <div className="mt-3 p-4 bg-gray-900 rounded-lg overflow-auto max-h-64">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {error.name}: {error.message}
                </p>
                <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">
                  {error.stack}
                </pre>
                {errorInfo?.componentStack && (
                  <pre className="text-blue-400 font-mono text-xs whitespace-pre-wrap mt-2">
                    Component Stack: {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Card variant (for feature-level errors)
  if (variant === 'card') {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900">{getErrorTitle()}</h3>
            <p className="mt-1 text-sm text-gray-600">{getErrorMessage()}</p>
            
            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              {onReset && (
                <button
                  onClick={onReset}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
              
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium inline-flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>
            
            {errorId && (
              <p className="mt-3 text-xs text-gray-400">
                Reference: {errorId}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant (minimal)
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      
      <p className="text-red-600 font-medium mb-2">{getErrorMessage()}</p>
      
      {onReset && (
        <button
          onClick={onReset}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
      
      {errorId && (
        <p className="mt-3 text-xs text-gray-400">
          Reference: {errorId}
        </p>
      )}
    </div>
  );
}

export default ErrorFallback;