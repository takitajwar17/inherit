"use client";

/**
 * CalendarView Component
 * 
 * Month/week calendar view for tasks
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CalendarView({ tasks, onDateSelect, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // 'month' or 'week'

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const days = [];
      const current = new Date(startOfWeek);
      while (current <= endOfWeek) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return { days, firstDay: startOfWeek, lastDay: endOfWeek };
    }
    
    // Month View Logic
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
  }, [currentDate, view]);

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    // Calendar date is local time 00:00:00
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const isTodayDate = isToday(date);

    const matchingTasks = tasks.filter(task => {
      // Include unscheduled tasks for Today
      if (isTodayDate && !task.dueDate && task.status !== 'completed') {
        return true;
      }
      
      if (!task?.dueDate) return false;
      try {
        // Task due date is UTC 00:00:00 (usually)
        const taskDate = new Date(task.dueDate);
        const taskYear = taskDate.getUTCFullYear();
        const taskMonth = String(taskDate.getUTCMonth() + 1).padStart(2, '0');
        const taskDay = String(taskDate.getUTCDate()).padStart(2, '0');
        const taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
        
        return taskDateStr === dateStr;
      } catch (error) {
        console.warn('Invalid date format for task:', task);
        return false;
      }
    });
    
    return matchingTasks;
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
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView("month")}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  view === "month"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  view === "week"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Week
              </button>
            </div>

            {/* Navigation */}
            <Button
              onClick={goToPrevious}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToNext}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="flex-1 overflow-hidden border-0 shadow-sm">
        <div className="bg-gray-200 p-px">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-px bg-gray-200">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-gray-500 uppercase py-1.5 bg-gray-50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {calendarData.days.map((date, index) => {
              const dayTasks = getTasksForDate(date);
              const isTodayDate = isToday(date);
              const isCurrentMonthDate = isCurrentMonth(date);
              
              // Sort: High priority first, then incomplete, then completed
              const sortedTasks = [...dayTasks].sort((a, b) => {
                const priorityMap = { high: 0, medium: 1, low: 2 };
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                return (priorityMap[a.priority] || 2) - (priorityMap[b.priority] || 2);
              });

              // Increase limit for week view
              const taskLimit = view === 'week' ? 15 : 3;

              return (
                <div
                  key={index}
                  onClick={() => onDateSelect && onDateSelect(date)}
                  className={cn(
                    "p-1 bg-white hover:bg-gray-50 cursor-pointer transition-colors relative group",
                    view === 'week' ? "min-h-[400px]" : "min-h-[80px]",
                    !isCurrentMonthDate && "bg-gray-50/30 text-gray-400"
                  )}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isTodayDate
                          ? "bg-primary text-white"
                          : isCurrentMonthDate
                          ? "text-gray-700 group-hover:bg-gray-100"
                          : "text-gray-400"
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Task Indicators */}
                  <div className="space-y-0.5">
                    {sortedTasks.slice(0, taskLimit).map((task, i) => (
                      <div
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick && onTaskClick(task);
                        }}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded-sm truncate transition-opacity flex items-center gap-1",
                          task.status === "completed"
                            ? "bg-gray-100 text-gray-400 line-through"
                            : task.priority === "high"
                            ? "bg-red-50 text-red-700 border-l-2 border-red-500"
                            : task.priority === "medium"
                            ? "bg-yellow-50 text-yellow-700 border-l-2 border-yellow-500"
                            : "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                        )}
                        title={task.title}
                      >
                         {task.title}
                      </div>
                    ))}
                    {sortedTasks.length > taskLimit && (
                      <div className="text-[10px] text-gray-400 pl-1 font-medium">
                        +{sortedTasks.length - taskLimit} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-3">
        <div className="flex items-center gap-6 text-[10px] text-gray-500 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 bg-red-50 border-l-2 border-red-500"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 bg-yellow-50 border-l-2 border-yellow-500"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 bg-blue-50 border-l-2 border-blue-500"></div>
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 bg-gray-100 text-gray-400 line-through decoration-gray-400">abc</div>
            <span>Completed</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

