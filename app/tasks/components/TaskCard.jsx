"use client";

/**
 * TaskCard Component
 * 
 * Todoist-style task card with subtasks, clean design, and hover actions
 */

import { motion } from "framer-motion";
import {
  Circle,
  CheckCircle2,
  Calendar,
  Flag,
  Hash,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
} from "lucide-react";
import { useState } from "react";

const priorityConfig = {
  high: { color: "text-red-400", borderColor: "border-red-400", label: "P1" },
  medium: { color: "text-yellow-400", borderColor: "border-yellow-400", label: "P2" },
  low: { color: "text-blue-400", borderColor: "border-blue-400", label: "P3" },
};

const categoryConfig = {
  study: { color: "text-blue-400", label: "Study" },
  assignment: { color: "text-yellow-400", label: "Assignment" },
  project: { color: "text-purple-400", label: "Project" },
  revision: { color: "text-green-400", label: "Revision" },
  exam: { color: "text-red-400", label: "Exam" },
  other: { color: "text-gray-400", label: "Other" },
};

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = task.status === "completed";
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const formatDate = (date) => {
    if (!date) return null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateObj = new Date(date);
    
    if (dateObj.toDateString() === now.toDateString()) {
      return { text: 'Today', color: 'text-green-400' };
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', color: 'text-yellow-400' };
    } else if (dateObj < now) {
      return { text: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-red-400' };
    } else {
      return { text: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-400' };
    }
  };

  const dateInfo = task.dueDate ? formatDate(task.dueDate) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border transition-all ${
        isCompleted
          ? "border-gray-200 dark:border-gray-700 opacity-60"
          : isOverdue
          ? "border-red-300 dark:border-red-900"
          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task)}
            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? "bg-green-500 border-green-500"
                : task.priority === "high"
                ? "border-red-400 hover:border-red-500"
                : "border-gray-400 hover:border-violet-500"
            }`}
          >
            {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`text-sm font-medium transition-colors ${
                  isCompleted
                    ? "line-through text-gray-500 dark:text-gray-600"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {task.title}
              </h3>

              {/* Priority Flag (inline) */}
              {task.priority && task.priority !== "medium" && !isCompleted && (
                <Flag className={`w-4 h-4 flex-shrink-0 ${priorityConfig[task.priority]?.color}`} />
              )}
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              {/* Due Date */}
              {dateInfo && (
                <span className={`flex items-center gap-1 ${dateInfo.color}`}>
                  <Calendar className="w-3 h-3" />
                  {dateInfo.text}
                </span>
              )}

              {/* Category */}
              {task.category && task.category !== "other" && (
                <span className={`flex items-center gap-1 ${categoryConfig[task.category]?.color}`}>
                  <Hash className="w-3 h-3" />
                  {categoryConfig[task.category]?.label}
                </span>
              )}

              {/* Time ago */}
              {task.createdAt && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Actions (show on hover) */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10"
        >
          <button
            onClick={() => {
              onEdit(task);
              setShowActions(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <Edit3 className="w-4 h-4" />
            Edit task
          </button>
          <button
            onClick={() => {
              onDelete(task._id);
              setShowActions(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete task
          </button>
        </motion.div>
      )}

      {/* Overdue Badge */}
      {isOverdue && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
          Overdue
        </div>
      )}
    </motion.div>
  );
}

