/**
 * Sidebar Navigation Configuration
 * Centralized config for all sidebar navigation links
 * 
 * @description
 * This file defines the navigation structure for the sidebar.
 * Each section contains links with icons and labels.
 * To add a new link, simply add an entry to the appropriate section.
 */

import { TbLayoutDashboardFilled } from "react-icons/tb";
import { SiGoogleclassroom } from "react-icons/si";
import { FiMap, FiHelpCircle } from "react-icons/fi";
import { FaCodepen, FaComments, FaTrophy } from "react-icons/fa";

/**
 * Sidebar navigation sections configuration
 * @type {Array<{
 *   section: string,
 *   showBorder: boolean,
 *   isFirst: boolean,
 *   isLast: boolean,
 *   links: Array<{href: string, icon: React.ComponentType, label: string}>
 * }>}
 */
export const SIDEBAR_NAVIGATION = [
  {
    section: "main",
    showBorder: true,
    isFirst: true,   // No top padding
    isLast: false,
    links: [
      { href: "/dashboard", icon: TbLayoutDashboardFilled, label: "Dashboard" },
    ],
  },
  {
    section: "learning",
    showBorder: true,
    isFirst: false,
    isLast: false,
    links: [
      { href: "/learn", icon: SiGoogleclassroom, label: "Learn" },
      { href: "/roadmaps", icon: FiMap, label: "Roadmaps" },
    ],
  },
  {
    section: "interactive",
    showBorder: true,
    isFirst: false,
    isLast: false,
    links: [
      { href: "/playground", icon: FaCodepen, label: "Playground" },
      { href: "/dev-discuss", icon: FaComments, label: "DevDiscuss" },
    ],
  },
  {
    section: "achievements",
    showBorder: true,
    isFirst: false,
    isLast: false,
    links: [
      { href: "/quests", icon: FaTrophy, label: "Quests" },
    ],
  },
  {
    section: "help",
    showBorder: false,
    isFirst: false,
    isLast: true,    // No bottom padding
    links: [
      { href: "/faq", icon: FiHelpCircle, label: "Help & FAQ" },
    ],
  },
];

