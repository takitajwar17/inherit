"use client";

/**
 * GlassDock Component
 *
 * A futuristic floating dock navigation that replaces the traditional sidebar.
 * Features glassmorphism, hover animations, and smart indicators.
 */

import { motion } from "framer-motion";
import {
  Inbox,
  Calendar,
  CalendarClock,
  Tag,
  Flag,
  BarChart3,
  List,
  LayoutGrid,
  Hash,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const smartViews = [
  { id: "inbox", label: "Inbox", icon: Inbox, color: "text-blue-400" },
  { id: "today", label: "Today", icon: Calendar, color: "text-green-400" },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: CalendarClock,
    color: "text-purple-400",
  },
];

const priorityViews = [
  {
    id: "p1",
    label: "Priority 1",
    icon: Flag,
    color: "text-red-400",
    priority: "high",
  },
  {
    id: "p2",
    label: "Priority 2",
    icon: Flag,
    color: "text-yellow-400",
    priority: "medium",
  },
  {
    id: "p3",
    label: "Priority 3",
    icon: Flag,
    color: "text-blue-400",
    priority: "low",
  },
];

const categories = [
  { id: "study", label: "Study", color: "text-blue-400" },
  { id: "assignment", label: "Assignment", color: "text-yellow-400" },
  { id: "project", label: "Project", color: "text-purple-400" },
  { id: "revision", label: "Revision", color: "text-green-400" },
  { id: "exam", label: "Exam", color: "text-red-400" },
  { id: "other", label: "Other", color: "text-gray-400" },
];

export default function GlassDock({
  currentView,
  onViewChange,
  tasks = [],
  isCollapsed,
  onToggleCollapse,
}) {
  // Calculate counts
  const getCount = (viewId, type = "view") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (viewId) {
      case "inbox":
        return tasks.filter((t) => t.status !== "completed" && !t.category)
          .length;
      case "today":
        return tasks.filter((t) => {
          if (t.status === "completed" || !t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d >= today && d < tomorrow;
        }).length;
      case "upcoming":
        return tasks.filter((t) => {
          if (t.status === "completed" || !t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d >= tomorrow && d < nextWeek;
        }).length;
      case "p1":
        return tasks.filter(
          (t) => t.status !== "completed" && t.priority === "high"
        ).length;
      case "p2":
        return tasks.filter(
          (t) => t.status !== "completed" && t.priority === "medium"
        ).length;
      case "p3":
        return tasks.filter(
          (t) => t.status !== "completed" && t.priority === "low"
        ).length;
      default:
        if (type === "category") {
          return tasks.filter(
            (t) => t.status !== "completed" && t.category === viewId
          ).length;
        }
        return 0;
    }
  };

  return (
    <motion.div
      layout
      className={`relative h-full transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border-r border-white/10" />

      <div className="relative h-full flex flex-col p-4">
        {/* Header/Collapse Toggle */}
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              Command Center
            </motion.h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {/* Smart Views */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 flex items-center gap-2">
                <LayoutGrid size={12} /> Overview
              </h3>
            )}
            {smartViews.map((view) => {
              const count = getCount(view.id);
              const isActive = currentView === view.id;
              const Icon = view.icon;

              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? "bg-primary/20 text-white shadow-lg shadow-primary/10 border border-primary/20"
                      : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-primary/10 blur-xl"
                    />
                  )}
                  <div
                    className={`relative z-10 p-2 rounded-lg ${
                      isActive
                        ? "bg-primary/20"
                        : "bg-white/5 group-hover:bg-white/10"
                    } transition-colors`}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive ? "text-primary-foreground" : view.color
                      }
                    />
                  </div>
                  {!isCollapsed && (
                    <span className="relative z-10 font-medium text-sm flex-1 text-left">
                      {view.label}
                    </span>
                  )}
                  {count > 0 && (
                    <span
                      className={`relative z-10 text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-gray-500 group-hover:text-white"
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  {isCollapsed && count > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Priorities */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 flex items-center gap-2">
                <Flag size={12} /> Priorities
              </h3>
            )}
            {priorityViews.map((view) => {
              const count = getCount(view.id);
              const isActive = currentView === view.id;

              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`w-full group flex items-center gap-3 p-2 rounded-xl transition-all ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={isCollapsed ? view.label : undefined}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${view.color.replace(
                      "text-",
                      "bg-"
                    )} shadow-[0_0_10px_currentColor]`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm flex-1 text-left">
                      {view.label}
                    </span>
                  )}
                  {!isCollapsed && count > 0 && (
                    <span className="text-xs text-gray-600 group-hover:text-gray-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 flex items-center gap-2">
                <Hash size={12} /> Categories
              </h3>
            )}
            {categories.map((cat) => {
              const count = getCount(cat.id, "category");
              const isActive = currentView === `category:${cat.id}`;

              return (
                <button
                  key={cat.id}
                  onClick={() => onViewChange(`category:${cat.id}`)}
                  className={`w-full group flex items-center gap-3 p-2 rounded-xl transition-all ${
                    isActive
                      ? "text-secondary"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={isCollapsed ? cat.label : undefined}
                >
                  <span
                    className={`text-lg leading-none ${
                      isActive
                        ? "text-secondary font-bold"
                        : "text-gray-600 group-hover:text-gray-400"
                    }`}
                  >
                    #
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm flex-1 text-left">
                      {cat.label}
                    </span>
                  )}
                  {!isCollapsed && count > 0 && (
                    <span className="text-xs text-gray-600 group-hover:text-gray-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
