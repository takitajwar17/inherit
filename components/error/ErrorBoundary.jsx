'use client';

import React from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * @example
 * <ErrorBoundary fallback={<CustomError />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log structured error data
    try {
      // Only log to winston in server environments
      if (typeof window === 'undefined') {
        const logger = require('@/lib/logger').default;
        if (logger) {
          logger.error('ErrorBoundary caught an error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            variant: this.props.variant || 'inline',
            feature: this.props.feature || 'unknown',
          });
        }
      }
    } catch (logError) {
      // Silently fail if logging service is unavailable
      console.warn('Failed to log to winston:', logError.message);
    }
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on variant
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          variant={this.props.variant || 'inline'}
          feature={this.props.feature}
          onReset={this.handleReset}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;