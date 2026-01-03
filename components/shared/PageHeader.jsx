"use client";

/**
 * PageHeader - Standardized page title and subtitle component
 * 
 * @description
 * Use this component on ALL pages to ensure consistent typography.
 * Provides a unified look for page headings across the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Page title (required)
 * @param {string} props.subtitle - Page description (optional)
 * @param {React.ReactNode} props.action - Action button/element aligned right (optional)
 * @param {string} props.className - Additional classes (optional)
 * 
 * @example
 * // Basic usage
 * <PageHeader 
 *   title="Dashboard" 
 *   subtitle="Overview of your learning progress" 
 * />
 * 
 * @example
 * // With action button
 * <PageHeader 
 *   title="Roadmaps" 
 *   subtitle="Create and manage learning paths"
 *   action={<Button>Create New</Button>}
 * />
 */

import { cn } from "@/lib/utils";

export const PageHeader = ({ 
  title, 
  subtitle, 
  action,
  className 
}) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Page Title - text-3xl font-bold text-gray-900 */}
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>
          
          {/* Page Subtitle - text-base text-gray-600 */}
          {subtitle && (
            <p className="text-base text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Optional action element (button, link, etc.) */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

