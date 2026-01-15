"use client";

/**
 * CalendarView Component
 * 
 * Month/week calendar view for tasks
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function CalendarView({ tasks, onDateSelect, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // 'month' or 'week'

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday before first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End on Saturday after last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // Generate days
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  }, [currentDate]);

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    const dateStr = date.toDateString();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === dateStr;
    });
  };

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-white"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === "month"
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === "week"
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 uppercase py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.days.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isTodayDate = isToday(date);
            const isCurrentMonthDate = isCurrentMonth(date);
            const completedCount = dayTasks.filter(t => t.status === "completed").length;
            const pendingCount = dayTasks.filter(t => t.status !== "completed").length;
            const hasOverdue = dayTasks.some(t => {
              return t.status !== "completed" && new Date(t.dueDate) < new Date();
            });

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => onDateSelect && onDateSelect(date)}
                className={`min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all ${
                  isTodayDate
                    ? "border-violet-500 bg-violet-500/10"
                    : isCurrentMonthDate
                    ? "border-gray-700 hover:border-gray-600 bg-gray-800"
                    : "border-gray-800 bg-gray-900 opacity-50 hover:opacity-75"
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate
                        ? "text-violet-400"
                        : isCurrentMonthDate
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      {pendingCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          hasOverdue
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {pendingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick && onTaskClick(task);
                      }}
                      className={`text-xs p-1 rounded truncate ${
                        task.status === "completed"
                          ? "bg-gray-700 text-gray-500 line-through"
                          : task.priority === "high"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-violet-500/20 text-violet-400"
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-violet-500/20"></div>
          <span className="text-gray-400">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/20"></div>
          <span className="text-gray-400">High Priority / Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-700"></div>
          <span className="text-gray-400">Completed</span>
        </div>
      </div>
    </div>
  );
}

