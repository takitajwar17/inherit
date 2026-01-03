/**
 * Error Boundary Components - Centralized exports
 * 
 * Provides error boundaries for protecting React components from crashes
 * and displaying graceful fallback UIs.
 */

export { default as ErrorBoundary } from './ErrorBoundary';
export { default as RootErrorBoundary } from './RootErrorBoundary';
export { FeatureErrorBoundary } from './FeatureErrorBoundary';
export { ErrorFallback } from './ErrorFallback';

// Re-export default as the main ErrorBoundary
export { default } from './ErrorBoundary';