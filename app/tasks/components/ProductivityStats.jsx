"use client";

/**
 * ProductivityStats Component
 * 
 * Displays productivity metrics, streaks, and completion trends
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Target,
  Calendar,
  Award,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared";

export default function ProductivityStats({ tasks }) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Total tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const pendingTasks = tasks.filter(t => t.status !== "completed").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Today's tasks
    const todayTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.toDateString() === today.toDateString();
    });
    const todayCompleted = todayTasks.filter(t => t.status === "completed").length;
    const todayPending = todayTasks.length - todayCompleted;

    // This week - use updatedAt or createdAt as fallback
    const thisWeekTasks = tasks.filter(t => {
      if (t.status !== "completed") return false;
      const completedDate = t.completedAt 
        ? new Date(t.completedAt) 
        : t.updatedAt 
        ? new Date(t.updatedAt) 
        : new Date(t.createdAt);
      return completedDate >= thisWeekStart;
    });

    // Last week
    const lastWeekTasks = tasks.filter(t => {
      if (t.status !== "completed") return false;
      const completedDate = t.completedAt 
        ? new Date(t.completedAt) 
        : t.updatedAt 
        ? new Date(t.updatedAt) 
        : new Date(t.createdAt);
      return completedDate >= lastWeekStart && completedDate < thisWeekStart;
    });

    // Calculate streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (currentStreak < 365) {
      const dayTasks = tasks.filter(t => {
        if (t.status !== "completed") return false;
        const completedDate = t.completedAt 
          ? new Date(t.completedAt) 
          : t.updatedAt 
          ? new Date(t.updatedAt) 
          : new Date(t.createdAt);
        return completedDate.toDateString() === checkDate.toDateString();
      });
      
      if (dayTasks.length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (currentStreak > 0) {
        break;
      } else {
        break;
      }
    }

    // Category breakdown
    const categoryBreakdown = {};
    tasks.forEach(t => {
      if (t.status === "completed") {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
      }
    });

    // Priority breakdown
    const priorityBreakdown = {
      high: tasks.filter(t => t.status === "completed" && t.priority === "high").length,
      medium: tasks.filter(t => t.status === "completed" && t.priority === "medium").length,
      low: tasks.filter(t => t.status === "completed" && t.priority === "low").length,
    };

    // 7-day completion trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayTasks = tasks.filter(t => {
        if (t.status !== "completed") return false;
        const completedDate = t.completedAt 
          ? new Date(t.completedAt) 
          : t.updatedAt 
          ? new Date(t.updatedAt) 
          : new Date(t.createdAt);
        return completedDate.toDateString() === date.toDateString();
      });
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayTasks.length,
      });
    }

    // Weekly comparison
    const weeklyChange = lastWeekTasks.length > 0
      ? Math.round(((thisWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100)
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      todayCompleted,
      todayPending,
      thisWeekCount: thisWeekTasks.length,
      weeklyChange,
      currentStreak,
      categoryBreakdown,
      priorityBreakdown,
      last7Days,
    };
  }, [tasks]);

  const maxDayCount = Math.max(...stats.last7Days.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Productivity Stats"
        subtitle="Track your progress and streaks"
      />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 text-violet-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.completionRate}%</span>
            </div>
            <div className="text-gray-900 font-medium">Completion Rate</div>
            <div className="text-gray-600 text-sm mt-1">
              {stats.completedTasks} of {stats.totalTasks} tasks
            </div>
          </Card>
        </motion.div>

        {/* Current Streak */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <Flame className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.currentStreak}</span>
            </div>
            <div className="text-gray-900 font-medium">Day Streak</div>
            <div className="text-gray-600 text-sm mt-1">
              {stats.currentStreak > 0 ? "Keep it up! 🔥" : "Start your streak today"}
            </div>
          </Card>
        </motion.div>

        {/* Today's Progress */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.todayCompleted}</span>
            </div>
            <div className="text-gray-900 font-medium">Completed Today</div>
            <div className="text-gray-600 text-sm mt-1">
              {stats.todayPending > 0 ? `${stats.todayPending} remaining` : "All done! ✨"}
            </div>
          </Card>
        </motion.div>

        {/* This Week */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.thisWeekCount}</span>
            </div>
            <div className="text-gray-900 font-medium">This Week</div>
            <div className="text-gray-600 text-sm mt-1 flex items-center gap-1">
              {stats.weeklyChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  +{stats.weeklyChange}% from last week
                </>
              ) : stats.weeklyChange < 0 ? (
                <>
                  {stats.weeklyChange}% from last week
                </>
              ) : (
                "Same as last week"
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 7-Day Trend Chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-gray-900">7-Day Completion Trend</h3>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.last7Days.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.count / maxDayCount) * 100}%` }}
                transition={{ delay: index * 0.1 }}
                className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-lg min-h-[4px] relative group cursor-pointer"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {day.count} tasks
                </div>
              </motion.div>
              <span className="text-xs text-gray-600">{day.date}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Category & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">By Category</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
              const percentage = stats.completedTasks > 0 
                ? Math.round((count / stats.completedTasks) * 100) 
                : 0;
              
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{category}</span>
                    <span className="text-gray-900 font-medium">{count} tasks</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-violet-500"
                    />
                  </div>
                </div>
              );
            })}
            
            {Object.keys(stats.categoryBreakdown).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No completed tasks yet
              </div>
            )}
          </div>
        </Card>

        {/* Priority Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">By Priority</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-red-600">High Priority</span>
                <span className="text-gray-900 font-medium">{stats.priorityBreakdown.high} tasks</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: stats.completedTasks > 0
                      ? `${(stats.priorityBreakdown.high / stats.completedTasks) * 100}%`
                      : '0%'
                  }}
                  className="h-full bg-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-yellow-600">Medium Priority</span>
                <span className="text-gray-900 font-medium">{stats.priorityBreakdown.medium} tasks</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: stats.completedTasks > 0
                      ? `${(stats.priorityBreakdown.medium / stats.completedTasks) * 100}%`
                      : '0%'
                  }}
                  className="h-full bg-yellow-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-blue-600">Low Priority</span>
                <span className="text-gray-900 font-medium">{stats.priorityBreakdown.low} tasks</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: stats.completedTasks > 0
                      ? `${(stats.priorityBreakdown.low / stats.completedTasks) * 100}%`
                      : '0%'
                  }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Motivational Message */}
      {stats.completedTasks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 text-center bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
            <div className="text-2xl mb-2">
              {stats.currentStreak >= 7 ? "🔥" : stats.completionRate >= 80 ? "🌟" : "💪"}
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {stats.currentStreak >= 7
                ? "Amazing streak! Keep the momentum going!"
                : stats.completionRate >= 80
                ? "Excellent completion rate! You're crushing it!"
                : stats.completedTasks >= 5
                ? "Great progress! Keep up the good work!"
                : "You've got this! Stay focused!"}
            </div>
            <div className="text-sm text-gray-600">
              You've completed {stats.completedTasks} task{stats.completedTasks !== 1 ? 's' : ''} so far
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

