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
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: { color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200", label: "P1" },
  medium: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "P2",
  },
  low: { color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", label: "P3" },
};

const categoryConfig = {
  study: { color: "text-blue-600", bgColor: "bg-blue-50", label: "Study" },
  assignment: { color: "text-yellow-600", bgColor: "bg-yellow-50", label: "Assignment" },
  project: { color: "text-purple-600", bgColor: "bg-purple-50", label: "Project" },
  revision: { color: "text-green-600", bgColor: "bg-green-50", label: "Revision" },
  exam: { color: "text-red-600", bgColor: "bg-red-50", label: "Exam" },
  other: { color: "text-gray-600", bgColor: "bg-gray-50", label: "Other" },
};

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = task?.status === "completed";
  
  // Calculate overdue status based on date only (ignoring time)
  const isOverdue = useMemo(() => {
    if (!task?.dueDate || isCompleted) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    // Overdue if strictly before today
    return dueDate < today;
  }, [task?.dueDate, isCompleted]);

  const formatDate = (date) => {
    if (!date) return null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateObj = new Date(date);

    if (dateObj.toDateString() === now.toDateString()) {
      return { text: "Today", color: "text-green-400" };
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return { text: "Tomorrow", color: "text-yellow-400" };
    } else if (dateObj < now) {
      return {
        text: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        color: "text-red-600",
      };
    } else {
      return {
        text: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        color: "text-gray-600",
      };
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
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md cursor-pointer",
          isCompleted && "opacity-60",
          isOverdue && "border-red-200 bg-red-50/30",
          isHovered && "shadow-lg"
        )}
        onClick={() => onEdit(task)}
      >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            className={cn(
              "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              isCompleted
                ? "bg-primary border-primary text-white"
                : task.priority === "high"
                ? "border-red-400 hover:border-red-500 hover:bg-red-50"
                : "border-gray-300 hover:border-primary hover:bg-primary/10"
            )}
          >
            {isCompleted && (
              <CheckCircle2 className="w-3 h-3" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                )}
              >
                {task?.title || 'Untitled Task'}
              </h3>

              {/* Priority Flag (inline) */}
              {task.priority && task.priority !== "medium" && !isCompleted && (
                <Flag
                  className={`w-4 h-4 flex-shrink-0 ${
                    priorityConfig[task.priority]?.color
                  }`}
                />
              )}
            </div>

            {/* Description */}
            {task?.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
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
                <span
                  className={`flex items-center gap-1 ${
                    categoryConfig[task.category]?.color
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {categoryConfig[task.category]?.label}
                </span>
              )}

              {/* Time ago */}
              {task.createdAt && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Overdue Badge */}
        {isOverdue && (
          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
            Overdue
          </div>
        )}
      </Card>
    </motion.div>
  );
}
