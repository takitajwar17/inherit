'use client';

import ErrorBoundary from './ErrorBoundary';

/**
 * FeatureErrorBoundary - Pre-configured boundary for feature components with "Try Again" functionality
 * Designed for wrapping risky components like Monaco Editor, YouTube Player, etc.
 * 
 * @param {Object} props
 * @param {string} props.feature - Name of the feature (e.g., "Code Editor", "Video Player")
 * @param {'card'|'inline'} props.variant - Display variant (default: 'card')
 * @param {React.ReactNode} props.children - Child components to protect
 * @param {Function} props.onError - Optional custom error handler
 * 
 * @example
 * <FeatureErrorBoundary feature="Code Editor">
 *   <MonacoEditor />
 *   <OutputPanel />
 * </FeatureErrorBoundary>
 * 
 * @example
 * <FeatureErrorBoundary feature="Video Player" variant="inline">
 *   <YouTubePlayer videoId={videoId} />
 * </FeatureErrorBoundary>
 */
export function FeatureErrorBoundary({ 
  feature = "Feature", 
  variant = "card",
  children, 
  onError,
  ...props 
}) {
  return (
    <ErrorBoundary 
      variant={variant}
      feature={feature}
      showDetails={process.env.NODE_ENV === 'development'}
      onError={onError}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

export default FeatureErrorBoundary;