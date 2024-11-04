"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react"; // Import useEffect for debugging if needed
import Header from "./Header"; // Import Header component
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Normalize the pathname to handle trailing slashes
  const normalizedPath = pathname.replace(/\/+$/, "");
  const isHomePage = normalizedPath === "" || normalizedPath === "/";

  // Debugging: Uncomment to check the pathname value
  // useEffect(() => {
  //   console.log("Current pathname:", pathname);
  // }, [pathname]);

  const [isOpen, setIsOpen] = useState(false); // Manage isOpen state

  return (
    <>
      {/* Conditionally render Header and Sidebar only if not on the homepage */}
      {!isHomePage && <Header />}
      {!isHomePage && <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />}

      <main className={`w-full ${isOpen && !isHomePage ? "md:pl-56" : ""}`}>
        <div className="flex items-start justify-center min-h-screen w-full">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </>
  );
}
