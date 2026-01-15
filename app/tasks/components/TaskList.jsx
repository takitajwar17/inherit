"use client";

/**
 * TaskList Component
 * 
 * Groups and displays tasks based on current view
 */

import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import { Calendar, CheckCircle2 } from "lucide-react";

export default function TaskList({
  tasks,
  currentView,
  onToggleComplete,
  onEdit,
  onDelete,
}) {
  // Filter tasks based on current view
  const filterTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (currentView) {
      case "inbox":
        return tasks.filter(t => t.status !== "completed" && !t.category);
      
      case "today":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      
      case "upcoming":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= tomorrow && dueDate < nextWeek;
        });
      
      case "overdue":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today;
        });
      
      case "p1":
        return tasks.filter(t => t.status !== "completed" && t.priority === "high");
      
      case "p2":
        return tasks.filter(t => t.status !== "completed" && t.priority === "medium");
      
      case "p3":
        return tasks.filter(t => t.status !== "completed" && t.priority === "low");
      
      default:
        // Category views
        if (currentView.startsWith("category:")) {
          const category = currentView.split(":")[1];
          return tasks.filter(t => t.status !== "completed" && t.category === category);
        }
        return tasks.filter(t => t.status !== "completed");
    }
  };

  // Group tasks by date for upcoming view
  const groupTasksByDate = (taskList) => {
    const groups = {};
    
    taskList.forEach(task => {
      if (!task.dueDate) {
        if (!groups["No date"]) groups["No date"] = [];
        groups["No date"].push(task);
        return;
      }

      const dateStr = new Date(task.dueDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });

    return groups;
  };

  const getViewTitle = () => {
    const titles = {
      inbox: "Inbox",
      today: "Today",
      upcoming: "Upcoming",
      overdue: "Overdue",
      p1: "Priority 1",
      p2: "Priority 2",
      p3: "Priority 3",
    };

    if (currentView.startsWith("category:")) {
      const category = currentView.split(":")[1];
      return category.charAt(0).toUpperCase() + category.slice(1);
    }

    return titles[currentView] || "All Tasks";
  };

  const getViewDescription = () => {
    const descriptions = {
      inbox: "Tasks without a category",
      today: "Tasks due today",
      upcoming: "Tasks due in the next 7 days",
      overdue: "Tasks that are past their due date",
      p1: "High priority tasks",
      p2: "Medium priority tasks",
      p3: "Low priority tasks",
    };

    if (currentView.startsWith("category:")) {
      const category = currentView.split(":")[1];
      return `All ${category} tasks`;
    }

    return descriptions[currentView] || "All your tasks";
  };

  const filteredTasks = filterTasks();
  const isGrouped = currentView === "upcoming";
  const groupedTasks = isGrouped ? groupTasksByDate(filteredTasks) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* View Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 z-10">
        <h1 className="text-2xl font-bold text-white">{getViewTitle()}</h1>
        <p className="text-sm text-gray-400 mt-1">{getViewDescription()}</p>
        {filteredTasks.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Task List */}
      <div className="p-6">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              No tasks here
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {currentView === "today" 
                ? "You're all caught up for today! 🎉"
                : "Create a task to get started"}
            </p>
          </div>
        ) : isGrouped && groupedTasks ? (
          // Grouped by date (Upcoming view)
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([date, dateTasks]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-20 bg-gray-900 py-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-400">
                    {date}
                  </h3>
                  <span className="text-xs text-gray-600">
                    ({dateTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {dateTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Simple list
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

