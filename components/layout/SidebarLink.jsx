"use client";

/**
 * SidebarLink - Reusable navigation link component for sidebar
 *
 * @description
 * A single navigation link with icon, label, and tooltip on hover.
 * Handles both expanded and collapsed sidebar states.
 *
 * @param {Object} props - Component props
 * @param {string} props.href - Link destination URL
 * @param {React.ComponentType} props.icon - Icon component to display
 * @param {string} props.label - Link label text
 * @param {boolean} props.isOpen - Whether sidebar is expanded
 *
 * @example
 * <SidebarLink
 *   href="/dashboard"
 *   icon={TbLayoutDashboardFilled}
 *   label="Dashboard"
 *   isOpen={true}
 * />
 */

import Link from "next/link";
import { cn } from "@/lib/utils";

export const SidebarLink = ({ href, icon: Icon, label, isOpen }) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl",
        "transition-all duration-300 relative group",
        isOpen ? "p-2 mx-2" : "p-2 justify-center"
      )}
      title={label}
    >
      {/* Icon */}
      <Icon
        className={cn(
          "transition-all duration-300 min-w-[24px] min-h-[24px]",
          isOpen ? "mr-2 text-xl" : "text-2xl"
        )}
      />

      {/* Tooltip - shown when sidebar is collapsed */}
      {!isOpen && (
        <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left z-50">
          <div className="bg-black/80 backdrop-blur-md text-white border border-white/10 px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium whitespace-nowrap">
            {label}
          </div>
        </div>
      )}

      {/* Label - shown when sidebar is expanded */}
      <span
        className={cn(
          "transition-all duration-300",
          isOpen ? "opacity-100" : "opacity-0 w-0"
        )}
      >
        {isOpen && label}
      </span>
    </Link>
  );
};

export default SidebarLink;
