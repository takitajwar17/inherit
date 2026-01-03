'use client';

import React from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * RootErrorBoundary - Special boundary for the root layout with app-specific styling
 * Provides the last line of defense for application-wide errors
 */
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log critical error
    console.error('RootErrorBoundary caught a critical error:', error, errorInfo);
    
    // Log structured error data 
    try {
      // Only log to winston in server environments
      if (typeof window === 'undefined') {
        const logger = require('@/lib/logger').default;
        if (logger) {
          logger.error('RootErrorBoundary caught a critical error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            level: 'critical',
            context: 'root_layout'
          });
        }
      }
    } catch (logError) {
      // Silently fail if logging service is unavailable
      console.warn('Failed to log critical error to winston:', logError.message);
    }
    
    // TODO: Send critical error to monitoring service immediately
    // This is a root-level failure that needs immediate attention
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Force page reload for root-level errors to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          variant="fullscreen"
          feature="Application"
          onReset={this.handleReset}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;