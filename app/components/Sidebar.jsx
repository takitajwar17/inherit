"use client";

/**
 * Sidebar - Main navigation sidebar component
 * 
 * @description
 * Collapsible sidebar navigation that displays on the left side of the app.
 * Automatically collapses on mobile devices and expands on desktop.
 * Uses configuration-driven navigation from lib/constants/navigation.js
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether sidebar is expanded
 * @param {Function} props.setIsOpen - Function to toggle sidebar state
 */

import { useEffect } from "react";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";
import { SidebarLink } from "@/components/layout/SidebarLink";
import { SidebarSection } from "@/components/layout/SidebarSection";
import { SIDEBAR_NAVIGATION } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const Sidebar = ({ isOpen, setIsOpen }) => {
  /**
   * Handle responsive sidebar behavior
   * Expands on desktop (>=768px), collapses on mobile
   */
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };

    // Set initial state based on screen size
    handleResize();

    // Listen for window resize events
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  /**
   * Toggle sidebar expanded/collapsed state
   */
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-row">
      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed top-20 left-0 h-full bg-sky-50 z-50 shadow-2xl transition-all duration-300",
          isOpen ? "w-56" : "w-14"
        )}
      >
        {/* Navigation Links */}
        <nav
          className={cn(
            "flex flex-col",
            isOpen ? "p-4 pr-12 space-y-2" : "px-2 pt-14 space-y-6"
          )}
        >
          {SIDEBAR_NAVIGATION.map((section) => (
            <SidebarSection
              key={section.section}
              isOpen={isOpen}
              showBorder={section.showBorder}
              isFirst={section.isFirst}
              isLast={section.isLast}
            >
              {section.links.map((link) => (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  isOpen={isOpen}
                />
              ))}
            </SidebarSection>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="absolute right-2 top-2">
          <button
            onClick={toggleSidebar}
            className="text-indigo-600 hover:text-indigo-700 rounded-lg p-0.5"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? (
              <TbLayoutSidebarLeftCollapseFilled className="text-2xl min-w-[24px] min-h-[24px]" />
            ) : (
              <TbLayoutSidebarLeftExpandFilled className="text-2xl min-w-[24px] min-h-[24px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
