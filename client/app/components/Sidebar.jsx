"use client";

import Link from "next/link";
import { useState } from "react";
import { FaChevronDown, FaCodepen } from "react-icons/fa";
import { MdAddBox, MdNotifications } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import {
  TbLayoutDashboardFilled,
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  return (
    <div className="pt-20 flex flex-row">
      <div
        className={`fixed top-20 left-0 h-full bg-white transition-transform z-50 shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col w-56 p-4 pr-12 space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-900 hover:text-indigo-600"
          >
            <TbLayoutDashboardFilled className="mr-2" />
            Dashboard
          </Link>
          <Link
            href="/courses"
            className="flex items-center text-gray-900 hover:text-indigo-600"
          >
            <SiGoogleclassroom className="mr-2" />
            Courses
          </Link>
          <Link
            href="/projects"
            className="flex items-center text-gray-900 hover:text-indigo-600"
          >
            <FaCodepen className="mr-2" />
            My Projects
          </Link>
          <div>
            <button
              onClick={toggleSubMenu}
              className="flex items-center text-gray-900 hover:text-indigo-600 w-full"
            >
              <MdAddBox className="mr-2" />
              Create new
              <FaChevronDown
                className={`ml-auto transition-transform ${
                  isSubMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isSubMenuOpen && (
              <div className="ml-4 mt-2 space-y-2 flex flex-col">
                <Link href="/" className="text-gray-700 hover:text-indigo-600">
                  Course
                </Link>
                <Link href="/" className="text-gray-700 hover:text-indigo-600">
                  Project
                </Link>
              </div>
            )}
          </div>
          <Link
            href="/"
            className="flex items-center text-gray-900 hover:text-indigo-600"
          >
            <MdNotifications className="mr-2" />
            Notifications
          </Link>
        </nav>
      </div>

      <div
        className={`fixed z-50 ${
          isOpen ? "translate-x-56" : "translate-x-0"
        } mt-2 p-2 bg-white flex rounded-r-md transition-transform shadow-lg`}
      >
        {!isOpen ? (
          <button
            onClick={toggleSidebar}
            className="text-indigo-600 hover:text-indigo-700"
          >
            <TbLayoutSidebarLeftExpandFilled fontSize="22px" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="text-indigo-600 hover:text-indigo-700"
          >
            <TbLayoutSidebarLeftCollapseFilled fontSize="22px" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
