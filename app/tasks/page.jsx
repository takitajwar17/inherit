"use client";

/**
 * Task Dashboard Page - Todoist Style
 *
 * Complete task management interface with smart views, quick add, and calendar
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
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

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setSelectedTask(null); // Close modal if open
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
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "board"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title="Calendar view"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "stats"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title="Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Task Filter Selector */}
          <select
            value={currentView}
            onChange={(e) => setCurrentView(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="all">All Tasks</option>
          </select>

          {/* Keyboard Hint */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-300">⌘K</kbd>
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
    </PageContainer>
  );
}
