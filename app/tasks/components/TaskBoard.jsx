"use client";

/**
 * TaskBoard Component
 *
 * A futuristic Kanban board with glass columns and fluid drag-and-drop.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import TaskCard from "./TaskCard";
import { Plus, GripVertical } from "lucide-react";

export default function TaskBoard({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onQuickAdd,
}) {
  // Group tasks by status/priority for the board
  const columns = useMemo(() => {
    return [
      {
        id: "todo",
        title: "To Do",
        color: "bg-blue-500",
        tasks: tasks.filter(
          (t) => t.status !== "completed" && t.status !== "in_progress"
        ),
      },
      {
        id: "in_progress",
        title: "In Progress",
        color: "bg-purple-500",
        tasks: tasks.filter((t) => t.status === "in_progress"),
      },
      {
        id: "completed",
        title: "Completed",
        color: "bg-green-500",
        tasks: tasks.filter((t) => t.status === "completed"),
      },
    ];
  }, [tasks]);

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-6 min-w-max h-full">
        {columns.map((column) => (
          <div
            key={column.id}
            className="w-80 flex flex-col h-full rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5"
          >
            {/* Column Header */}
            <div
              className={`p-4 rounded-t-2xl border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/20 backdrop-blur-md z-10`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${column.color} shadow-[0_0_10px_currentColor]`}
                />
                <h3 className="font-semibold text-white tracking-wide">
                  {column.title}
                </h3>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(column.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>

              {column.tasks.length === 0 && (
                <div className="h-24 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-gray-600 text-sm italic">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Column Button (Visual only for now) */}
        <button className="w-12 h-full rounded-2xl border-2 border-dashed border-white/5 hover:border-white/20 transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-400">
          <Plus size={24} />
          <span className="vertical-text text-xs uppercase tracking-widest font-semibold opacity-50">
            Add Section
          </span>
        </button>
      </div>
    </div>
  );
}
