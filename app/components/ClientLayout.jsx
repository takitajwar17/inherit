"use client";

/**
 * ClientLayout - Main layout wrapper that handles sidebar and header rendering
 * 
 * @description
 * Manages the conditional rendering of Header, Sidebar, and TourGuide components.
 * Handles responsive padding for main content area based on sidebar state.
 */

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";

// Dynamically import TourGuide with no SSR
const TourGuide = dynamic(() => import("@/components/TourGuide"), {
  ssr: false,
});

/**
 * Sidebar width constants (matching Sidebar.jsx)
 * Used to calculate content padding
 */
const SIDEBAR_WIDTH = {
  OPEN: "pl-56",      // 224px - matches w-56 in Sidebar
  COLLAPSED: "pl-14", // 56px - matches w-14 in Sidebar
};

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Handle mounting and responsive state
  useEffect(() => {
    setIsMounted(true);
    
    // Set initial desktop state
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Normalize the pathname to handle trailing slashes
  const normalizedPath = pathname.replace(/\/+$/, "");
  const isHomePage = normalizedPath === "" || normalizedPath === "/";

  // Define paths where Sidebar should not be rendered
  const excludedPaths = ["/sign-in", "/sign-up"];
  const isExcludedPath =
    excludedPaths.includes(normalizedPath) ||
    pathname === "/not-found" ||
    pathname.startsWith("/admin");

  const shouldRenderSidebar = !isHomePage && !isExcludedPath;

  // Don't render any layout components for admin paths
  if (pathname.startsWith("/admin")) {
    return children;
  }

  /**
   * Calculate main content padding based on sidebar state
   * - No sidebar: no left padding
   * - Sidebar open (desktop): pl-56 (224px)
   * - Sidebar collapsed: pl-14 (56px)
   */
  const getContentPadding = () => {
    if (!shouldRenderSidebar) return "";
    
    // Only apply full padding on desktop when sidebar is open
    if (isMounted && isDesktop && isOpen) {
      return SIDEBAR_WIDTH.OPEN;
    }
    
    // Collapsed sidebar padding (always when sidebar exists but not fully open)
    if (shouldRenderSidebar) {
      return SIDEBAR_WIDTH.COLLAPSED;
    }
    
    return "";
  };

  return (
    <>
      {/* Conditionally render Header */}
      {!isHomePage && <Header />}

      {/* Conditionally render Sidebar */}
      {shouldRenderSidebar && <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />}

      {/* Main content area with responsive padding */}
      <main
        className={cn(
          "w-full transition-all duration-300",
          !isHomePage && "pt-20",  // Top padding for header
          getContentPadding()       // Left padding for sidebar
        )}
      >
        <div className="flex items-start justify-center min-h-screen w-full">
          <div className="w-full">
            {children}
            {isMounted && !isExcludedPath && <TourGuide />}
          </div>
        </div>
      </main>
    </>
  );
}
