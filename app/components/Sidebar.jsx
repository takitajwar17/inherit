"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaCodepen,
  FaComments,
  FaQuestionCircle,
  FaTrophy,
} from "react-icons/fa";
import { MdAddBox, MdNotifications } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import {
  TbLayoutDashboardFilled,
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";
import { FiMap, FiHelpCircle } from "react-icons/fi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // desktop breakpoint
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  return (
    <div className="flex flex-row">
      <div
        className={`fixed top-20 left-0 h-full bg-sky-50 z-50 shadow-2xl transition-all duration-300 ${
          isOpen ? "w-56" : "w-16"
        }`}
      >
        <nav className={`flex flex-col p-4 ${isOpen ? "pr-12" : "pr-4"} space-y-2 ${!isOpen && "pt-14"}`}>
          {/* Main Navigation */}
          <div className={`space-y-2 ${isOpen ? "pb-4 border-b border-gray-200" : ""}`}>
            <Link
              href="/dashboard"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Dashboard"
            >
              <TbLayoutDashboardFilled className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    Dashboard
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Dashboard"}
              </span>
            </Link>
          </div>

          {/* Learning Section */}
          <div className={`space-y-2 ${isOpen ? "py-4 border-b border-gray-200" : ""}`}>
            <Link
              href="/learn"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Learn"
            >
              <SiGoogleclassroom className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    Learn
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Learn"}
              </span>
            </Link>
            <Link
              href="/roadmaps"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Roadmaps"
            >
              <FiMap className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    Roadmaps
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Roadmaps"}
              </span>
            </Link>
          </div>

          {/* Interactive Section */}
          <div className={`space-y-2 ${isOpen ? "py-4 border-b border-gray-200" : ""}`}>
            <Link
              href="/playground"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Playground"
            >
              <FaCodepen className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    Playground
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Playground"}
              </span>
            </Link>
            <Link
              href="/dev-discuss"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="DevDiscuss"
            >
              <FaComments className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    DevDiscuss
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "DevDiscuss"}
              </span>
            </Link>
          </div>

          {/* Achievement Section */}
          <div className={`space-y-2 ${isOpen ? "py-4 border-b border-gray-200" : ""}`}>
            <Link
              href="/quests"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Quests"
            >
              <FaTrophy className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium">
                    Quests
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Quests"}
              </span>
            </Link>
          </div>

          {/* Help Section */}
          <div className={`space-y-2 ${isOpen ? "pt-4" : ""}`}>
            <Link
              href="/faq"
              className={`flex items-center text-gray-900 hover:text-indigo-600 hover:bg-white rounded-lg text-lg p-2 relative group ${
                !isOpen && "justify-center"
              } transition-all duration-300`}
              title="Help & FAQ"
            >
              <FiHelpCircle className={`transition-all duration-300 ${isOpen ? "mr-2 text-2xl" : "text-[32px]"}`} />
              {!isOpen && (
                <div className="absolute left-full ml-4 scale-0 group-hover:scale-100 transition-all duration-300 origin-left">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-medium whitespace-nowrap">
                    Help & FAQ
                  </div>
                </div>
              )}
              <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {isOpen && "Help & FAQ"}
              </span>
            </Link>
          </div>
        </nav>

        <div className="absolute right-2 top-2">
          {!isOpen ? (
            <button
              onClick={toggleSidebar}
              className="text-indigo-600 hover:text-indigo-700 rounded-lg"
            >
              <TbLayoutSidebarLeftExpandFilled className="text-[32px]" />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="text-indigo-600 hover:text-indigo-700 rounded-lg"
            >
              <TbLayoutSidebarLeftCollapseFilled className="text-[32px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
