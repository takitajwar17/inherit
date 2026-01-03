"use client";

/**
 * SidebarSection - Groups related navigation links with optional border
 * 
 * @description
 * A wrapper component for grouping sidebar links into sections.
 * Handles spacing and border styling based on sidebar state.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Link components to render
 * @param {boolean} props.isOpen - Whether sidebar is expanded
 * @param {boolean} [props.showBorder=true] - Show bottom border when expanded
 * @param {boolean} [props.isFirst=false] - First section (no top padding)
 * @param {boolean} [props.isLast=false] - Last section (no bottom padding)
 * 
 * @example
 * <SidebarSection isOpen={true} showBorder={true} isFirst={true}>
 *   <SidebarLink href="/dashboard" icon={TbLayoutDashboardFilled} label="Dashboard" isOpen={true} />
 * </SidebarSection>
 */

import { cn } from "@/lib/utils";

export const SidebarSection = ({ 
  children, 
  isOpen, 
  showBorder = true,
  isFirst = false,
  isLast = false 
}) => {
  /**
   * Determine padding classes based on position
   * - First section: pb-4 (bottom only)
   * - Middle sections: py-4 (top + bottom)
   * - Last section: pt-4 (top only)
   */
  const getPaddingClass = () => {
    if (isFirst) return "pb-4";      // First: bottom padding only
    if (isLast) return "pt-4";       // Last: top padding only
    return "py-4";                   // Middle: both top and bottom
  };

  return (
    <div
      className={cn(
        "space-y-2",
        isOpen
          ? cn(getPaddingClass(), showBorder && "border-b border-gray-200")
          : "space-y-6"
      )}
    >
      {children}
    </div>
  );
};

export default SidebarSection;
