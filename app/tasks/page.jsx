"use client";

/**
 * Task Dashboard Page - Todoist Style
 *
 * Complete task management interface with smart views, quick add, and calendar
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, PageContainer } from "@/components/shared";
import {
  Plus,
  Loader2,
  List,
  Calendar as CalendarIcon,
  BarChart3,
  LayoutGrid,
} from "lucide-react";

// Components
import TaskSidebar from "./components/TaskSidebar";
import QuickAdd from "./components/QuickAdd";
import TaskList from "./components/TaskList";
import TaskBoard from "./components/TaskBoard";
import CalendarView from "./components/CalendarView";
import TaskDetail from "./components/TaskDetail";
import ProductivityStats from "./components/ProductivityStats";

export default function TasksPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("today");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'calendar', 'stats'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const response = await fetch(`/api/tasks?limit=1000&t=${Date.now()}`);
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
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        // Sync with server data (optional, but good for consistency)
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? data.data.task : t))
        );
        // We don't need to close anything here, TaskDetail handles its own edit state
        // or we close it if needed. For now, keep it open or let user close.
        // Actually, if we are in "editingTask" mode (legacy), we closed it.
        // But TaskDetail has a save button that just calls onUpdate.
        // It stays open. This is better UX.
      } else {
        // Revert on failure (server returned success: false)
        setTasks(previousTasks);
        console.error("Failed to update task:", data.error);
      }
    } catch (error) {
      // Revert on network error
      setTasks(previousTasks);
      console.error("Failed to update task:", error);
    }
  };

  // Initiate delete task
  const handleDeleteTask = (taskId) => {
    // Find the task object if we only have the ID (optional, for UI feedback)
    const task = tasks.find(t => t._id === taskId);
    setTaskToDelete(task || { _id: taskId });
  };

  // Confirm delete task
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete._id;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setSelectedTask(null); // Close detail modal if open
        setTaskToDelete(null); // Close confirmation modal
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Helper to open task in edit mode
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsEditMode(true);
  };

  // Helper to open task in view mode
  const handleViewTask = (task) => {
    setSelectedTask(task);
    setIsEditMode(false);
  };

  // Reorder tasks
  const handleReorder = async (reorderedTasks) => {
    // Optimistic update
    setTasks(reorderedTasks);

    try {
      // Prepare payload: array of { _id, order }
      const tasksWithOrder = reorderedTasks.map((t, index) => ({
        _id: t._id,
        order: index,
      }));

      const response = await fetch("/api/tasks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksWithOrder }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order");
      }
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      // We could revert here, but for reordering it might be jarring.
      // A toast notification might be better.
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
    <PageContainer>
      <PageHeader
        title="Tasks"
        subtitle="Manage your daily tasks and boost your productivity"
        action={
          <Button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        }
      />
      
      {/* Task Controls */}
      <Card className="p-3 mb-6 w-fit">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle & Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 transition-all duration-300">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
                {viewMode === "list" && (
                  <span className="text-xs font-medium pr-1">List</span>
                )}
              </button>

              <AnimatePresence>
                {viewMode === "list" && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, x: -10 }}
                    animate={{ width: "auto", opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -10 }}
                    className="overflow-hidden flex items-center border-l border-gray-300 ml-1 pl-1"
                  >
                    <select
                      value={currentView}
                      onChange={(e) => setCurrentView(e.target.value)}
                      className="bg-transparent border-none text-gray-900 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-6 py-1"
                    >
                      <option value="today">Today</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                      <option value="all">All Tasks</option>
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setViewMode("board")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "board"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
              title="Calendar view"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "stats"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
              title="Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-400 border-l border-gray-200 pl-4">
            <kbd className="px-1.5 py-0.5 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">⌘K</kbd>
            <span>Quick add</span>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <TaskList
          tasks={tasks}
          currentView={currentView}
          onToggleComplete={toggleComplete}
          onEdit={handleViewTask}
          onDelete={handleDeleteTask}
          onReorder={handleReorder}
          onUpdateTask={handleUpdateTask}
        />
      ) : viewMode === "board" ? (
        <TaskBoard
          tasks={tasks}
          onToggleComplete={toggleComplete}
          onEdit={handleViewTask}
          onDelete={handleDeleteTask}
          onQuickAdd={() => setShowQuickAdd(true)}
          onUpdateTaskStatus={(taskId, newStatus) => handleUpdateTask(taskId, { status: newStatus })}
          onReorder={handleReorder}
        />
      ) : viewMode === "calendar" ? (
        <CalendarView
          tasks={tasks}
          onDateSelect={(date) => {
            // Filter tasks by selected date
            console.log("Selected date:", date);
          }}
          onTaskClick={handleViewTask}
        />
      ) : (
        <ProductivityStats tasks={tasks} />
      )}

      {/* Quick Add Modal */}
      <QuickAdd
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={handleCreateTask}
      />

      {/* Task Detail Panel (Unified View/Edit Modal) */}
      {selectedTask && (
        <TaskDetail
          key={selectedTask._id + (isEditMode ? '-edit' : '-view')}
          task={selectedTask}
          initialEditMode={isEditMode}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            handleUpdateTask(selectedTask._id, updates);
            // We keep the modal open to let user continue viewing/editing
            // or close it if they want. 
            // If it was a status toggle from header, it stays open.
            // If it was "Save" from edit mode, TaskDetail handles switching back to view mode internally.
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task?</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Are you sure you want to delete <span className="font-medium text-gray-700">"{taskToDelete.title || 'this task'}"</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTask}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
