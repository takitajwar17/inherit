"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useState } from "react"; // Import useState

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isOpen, setIsOpen] = useState(false); // Manage isOpen state

  return (
    <>
      {!isHomePage && <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />}
      <main className={`w-full ${isOpen && !isHomePage ? "md:pl-56" : ""}`}>
        {" "}
        <div className="flex items-start justify-center min-h-screen w-full">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </>
  );
}
