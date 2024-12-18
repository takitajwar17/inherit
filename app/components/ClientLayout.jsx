"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import dynamic from 'next/dynamic';

// Dynamically import TourGuide with no SSR
const TourGuide = dynamic(() => import("@/components/TourGuide"), {
  ssr: false,
});

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const [isOpen, setIsOpen] = useState(false);

  // Don't render any layout components for admin paths
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      {/* Conditionally render Header */}
      {!isHomePage && <Header />}

      {/* Conditionally render Sidebar */}
      {shouldRenderSidebar && <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />}

      <main
        className={`w-full transition-all duration-300 ${
          !isHomePage ? "pt-20" : ""
        } ${
          shouldRenderSidebar && isOpen && isMounted && window.innerWidth >= 768
            ? "pl-56"
            : shouldRenderSidebar
            ? "pl-8"
            : ""
        }`}
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
