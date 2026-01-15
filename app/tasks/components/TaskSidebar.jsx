"use client";

/**
 * TaskSidebar Component
 * 
 * Todoist-style sidebar with smart views for task filtering
 */

import { motion } from "framer-motion";
import {
  Inbox,
  Calendar,
  CalendarClock,
  Tag,
  Flag,
  BarChart3,
  ChevronRight,
  Hash,
} from "lucide-react";

const smartViews = [
  {
    id: "inbox",
    label: "Inbox",
    icon: Inbox,
    count: 0,
    color: "text-blue-400",
  },
  {
    id: "today",
    label: "Today",
    icon: Calendar,
    count: 0,
    color: "text-green-400",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: CalendarClock,
    count: 0,
    color: "text-purple-400",
  },
];

const priorityViews = [
  {
    id: "p1",
    label: "Priority 1",
    icon: Flag,
    count: 0,
    color: "text-red-400",
    priority: "high",
  },
  {
    id: "p2",
    label: "Priority 2",
    icon: Flag,
    count: 0,
    color: "text-yellow-400",
    priority: "medium",
  },
  {
    id: "p3",
    label: "Priority 3",
    icon: Flag,
    count: 0,
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

export default function TaskSidebar({
  currentView,
  onViewChange,
  tasks = [],
  isCollapsed = false,
  onToggleCollapse,
}) {
  // Calculate counts for each view
  const getViewCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const counts = {
      inbox: tasks.filter(t => t.status !== "completed" && !t.category).length,
      today: tasks.filter(t => {
        if (t.status === "completed") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      }).length,
      upcoming: tasks.filter(t => {
        if (t.status === "completed") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= tomorrow && dueDate < nextWeek;
      }).length,
      overdue: tasks.filter(t => {
        if (t.status === "completed") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate < today;
      }).length,
      p1: tasks.filter(t => t.status !== "completed" && t.priority === "high").length,
      p2: tasks.filter(t => t.status !== "completed" && t.priority === "medium").length,
      p3: tasks.filter(t => t.status !== "completed" && t.priority === "low").length,
    };

    categories.forEach(cat => {
      counts[cat.id] = tasks.filter(t => t.status !== "completed" && t.category === cat.id).length;
    });

    return counts;
  };

  const counts = getViewCounts();

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        {smartViews.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`p-2 rounded-lg transition-colors relative ${
                currentView === view.id
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
              title={view.label}
            >
              <Icon className="w-5 h-5" />
              {counts[view.id] > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {counts[view.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      className="w-70 bg-gray-900 border-r border-gray-800 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-white">Views</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          title="Collapse sidebar"
        >
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Smart Views */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Smart Views
            </h3>
          </div>
          <div className="space-y-1">
            {smartViews.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentView === view.id
                      ? "bg-violet-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${currentView === view.id ? "text-white" : view.color}`} />
                  <span className="flex-1 text-left text-sm">{view.label}</span>
                  {counts[view.id] > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      currentView === view.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {counts[view.id]}
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* Overdue (special view) */}
            {counts.overdue > 0 && (
              <button
                onClick={() => onViewChange("overdue")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === "overdue"
                    ? "bg-red-600 text-white"
                    : "text-red-400 hover:bg-red-900/20"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="flex-1 text-left text-sm font-medium">Overdue</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                  {counts.overdue}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Priority Filters */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <Flag className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Priority
            </h3>
          </div>
          <div className="space-y-1">
            {priorityViews.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentView === view.id
                      ? "bg-violet-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${currentView === view.id ? "text-white" : view.color}`} />
                  <span className="flex-1 text-left text-sm">{view.label}</span>
                  {counts[view.id] > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      currentView === view.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {counts[view.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Categories
            </h3>
          </div>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onViewChange(`category:${category.id}`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === `category:${category.id}`
                    ? "bg-violet-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Hash className={`w-4 h-4 ${currentView === `category:${category.id}` ? "text-white" : category.color}`} />
                <span className="flex-1 text-left text-sm">{category.label}</span>
                {counts[category.id] > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    currentView === `category:${category.id}`
                      ? "bg-white/20 text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}>
                    {counts[category.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

