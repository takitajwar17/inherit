"use client";

/**
 * PageContainer - Standardized page wrapper with consistent spacing
 * 
 * @description
 * Wraps page content with consistent max-width, padding, and background.
 * Ensures all pages have uniform layout structure.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.gradient - Use gradient background (default: false)
 * @param {boolean} props.narrow - Use narrow container max-w-5xl (default: false)
 * @param {boolean} props.noPadding - Remove default padding (default: false)
 * @param {string} props.className - Additional classes (optional)
 * 
 * @example
 * // Standard page
 * <PageContainer>
 *   <PageHeader title="Dashboard" />
 *   <Content />
 * </PageContainer>
 * 
 * @example
 * // Gradient background with narrow container
 * <PageContainer gradient narrow>
 *   <PageHeader title="Settings" />
 *   <Form />
 * </PageContainer>
 */

import { cn } from "@/lib/utils";

export const PageContainer = ({ 
  children, 
  gradient = false,
  narrow = false,
  noPadding = false,
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen",
      gradient 
        ? "bg-gradient-to-br from-gray-50 to-gray-100" 
        : "bg-gray-50",
      className
    )}>
      <div className={cn(
        "mx-auto",
        narrow ? "max-w-5xl" : "max-w-7xl",
        !noPadding && "py-8 px-4 sm:px-6 lg:px-8"
      )}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;

