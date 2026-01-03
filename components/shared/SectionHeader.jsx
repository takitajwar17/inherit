"use client";

/**
 * SectionHeader - Standardized section title component
 * 
 * @description
 * Use within pages to create consistent section headings.
 * Provides a unified look for section titles across the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Section title (required)
 * @param {string} props.subtitle - Section description (optional)
 * @param {React.ReactNode} props.icon - Icon element displayed before title (optional)
 * @param {React.ReactNode} props.action - Action element aligned right (optional)
 * @param {string} props.className - Additional classes (optional)
 * 
 * @example
 * // Basic usage
 * <SectionHeader title="Recent Activity" />
 * 
 * @example
 * // With icon and action
 * <SectionHeader 
 *   title="Active Roadmaps"
 *   icon={<FaRoad />}
 *   action={<Link href="/roadmaps">View All</Link>}
 * />
 */

import { cn } from "@/lib/utils";

export const SectionHeader = ({ 
  title, 
  subtitle,
  icon,
  action,
  className 
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        {/* Optional icon */}
        {icon && (
          <span className="text-gray-400">
            {icon}
          </span>
        )}
        
        <div>
          {/* Section Title - text-xl font-semibold text-gray-900 */}
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          
          {/* Section Subtitle - text-sm text-gray-500 */}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Optional action element */}
      {action && action}
    </div>
  );
};

export default SectionHeader;

