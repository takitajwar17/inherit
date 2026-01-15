"use client";

/**
 * Task Dashboard Page - Todoist Style
 *
 * Complete task management interface with smart views, quick add, and calendar
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  Menu,
  X,
  List,
  Calendar as CalendarIcon,
  BarChart3,
} from "lucide-react";

// Components
import TaskSidebar from "./components/TaskSidebar";
import QuickAdd from "./components/QuickAdd";
import TaskList from "./components/TaskList";
import CalendarView from "./components/CalendarView";
import TaskDetail from "./components/TaskDetail";
import ProductivityStats from "./components/ProductivityStats";

export default function TasksPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("today");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'calendar', 'stats'
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchTasks();
    }
  }, [isSignedIn, fetchTasks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open quick add
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowQuickAdd(true);
      }
      // Escape to close quick add
      if (e.key === "Escape" && showQuickAdd) {
        setShowQuickAdd(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQuickAdd]);

  // Create task
  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();
      if (data.success) {
        setTasks((prev) => [data.data.task, ...prev]);
        setShowQuickAdd(false);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  // Update task
  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? data.data.task : t))
        );
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Toggle complete
  const toggleComplete = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await handleUpdateTask(task._id, { status: newStatus });
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Unauthenticated state
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Sign in to view your tasks
          </h1>
          <p className="text-gray-400">
            Please sign in to access your task dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 h-16 border-b border-gray-800 flex items-center px-4 gap-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
        >
          {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition-colors ${
              viewMode === "list"
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded transition-colors ${
              viewMode === "calendar"
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Calendar view"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("stats")}
            className={`p-2 rounded transition-colors ${
              viewMode === "stats"
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Statistics"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Quick Add Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Task</span>
        </motion.button>

        {/* Keyboard Hint */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <kbd className="px-2 py-1 bg-gray-800 rounded">⌘K</kbd>
          <span>Quick add</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <TaskSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          tasks={tasks}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <TaskList
            tasks={tasks}
            currentView={currentView}
            onToggleComplete={toggleComplete}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        ) : viewMode === "calendar" ? (
          <CalendarView
            tasks={tasks}
            onDateSelect={(date) => {
              // Filter tasks by selected date
              console.log("Selected date:", date);
            }}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        ) : (
          <ProductivityStats tasks={tasks} />
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAdd
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={handleCreateTask}
      />

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            handleUpdateTask(selectedTask._id, updates);
            setSelectedTask(null);
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Edit Task Modal (reuse QuickAdd with prefilled data) */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingTask(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateTask(editingTask._id, {
                  title: formData.get("title"),
                  description: formData.get("description"),
                  category: formData.get("category"),
                  priority: formData.get("priority"),
                  dueDate: formData.get("dueDate") || null,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingTask.title}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingTask.category}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="revision">Revision</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={
                    editingTask.dueDate
                      ? new Date(editingTask.dueDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
