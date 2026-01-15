"use client";

/**
 * ProductivityStats Component
 * 
 * Displays meaningful productivity metrics and insights
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Activity,
  Zap,
  Calendar,
  Award,
  BarChart3,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared";

export default function ProductivityStats({ tasks }) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const toDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let tasksLast7Days = 0;
    const last7DaysMap = {};
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last7DaysMap[toDateStr(d)] = 0;
    }

    tasks.forEach(t => {
        if (t.status === 'completed') {
            const rawDate = t.completedAt || t.updatedAt || t.createdAt;
            if (rawDate) {
                const dStr = toDateStr(new Date(rawDate));
                if (last7DaysMap.hasOwnProperty(dStr)) {
                    last7DaysMap[dStr]++;
                    tasksLast7Days++;
                }
            }
        }
    });

    const velocity = (tasksLast7Days / 7).toFixed(1);

    const dayCounts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    tasks.forEach(t => {
        if (t.status === 'completed') {
            const rawDate = t.completedAt || t.updatedAt || t.createdAt;
            if (rawDate) {
                const day = new Date(rawDate).getDay();
                dayCounts[day]++;
            }
        }
    });
    const bestDayIndex = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostProductiveDay = dayCounts[bestDayIndex] > 0 ? dayNames[bestDayIndex] : "N/A";

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    let createdThisWeek = 0;
    let completedThisWeek = 0;

    tasks.forEach(t => {
        const createdDate = new Date(t.createdAt);
        if (createdDate >= thisWeekStart) createdThisWeek++;
        
        if (t.status === 'completed') {
             const completedDate = new Date(t.completedAt || t.updatedAt || t.createdAt);
             if (completedDate >= thisWeekStart) completedThisWeek++;
        }
    });

    const flowScore = createdThisWeek > 0 
        ? Math.round((completedThisWeek / (completedThisWeek + createdThisWeek)) * 100)
        : completedThisWeek > 0 ? 100 : 0; 
        
    const categories = {};
    tasks.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + 1;
    });

    const categoryDisplayNames = {
        study: 'Learning',
        assignment: 'Assignments',
        project: 'Projects',
        revision: 'Revision',
        exam: 'Exams',
        other: 'Miscellaneous'
    };

    const topCategoryKey = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'other');
    const topCategoryName = categoryDisplayNames[topCategoryKey] || topCategoryKey;
    const topCategoryCount = categories[topCategoryKey] || 0;
    const totalCount = tasks.length;
    const focusPercentage = totalCount > 0 ? Math.round((topCategoryCount / totalCount) * 100) : 0;

    const sortedChartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = toDateStr(d);
        sortedChartData.push({
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            count: last7DaysMap[dStr]
        });
    }

    return {
        velocity,
        mostProductiveDay,
        flowScore,
        topCategory: topCategoryName,
        focusPercentage,
        chartData: sortedChartData,
        totalCompleted: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks]);

  const maxChartValue = Math.max(...stats.chartData.map(d => d.count), 5);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Weekly Report"
        subtitle="Insights based on your recent activity"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Velocity</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.velocity}</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Tasks per day (7-day avg)</p>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peak Day</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{stats.mostProductiveDay}</h3>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Your most active day</p>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Focus</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{stats.topCategory}</h3>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">{stats.focusPercentage}% of your workload</p>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Flow Score</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.flowScore}</h3>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Weekly completion ratio</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Consistency</h3>
                <p className="text-sm text-gray-500">Task completions over the last 7 days</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-end justify-between gap-4 h-48">
            {stats.chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 h-full group">
                    <div className="relative w-full flex-1 flex items-end bg-gray-50 rounded-t-lg overflow-hidden">
                        <div
                            style={{ height: `${(day.count / maxChartValue) * 100}%` }}
                            className="w-full bg-violet-600 opacity-90 group-hover:opacity-100 transition-all duration-500 ease-out rounded-t-lg min-h-[4px]"
                        ></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pb-2 pointer-events-none">
                            <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap">
                                {day.count} tasks
                            </div>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{day.date}</span>
                </div>
            ))}
        </div>
      </Card>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-white border border-gray-200 rounded-full shadow-sm">
            <ArrowUpRight className="w-6 h-6 text-gray-900" />
        </div>
        <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Weekly Insight</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
                {stats.totalCompleted > 0 ? (
                    <>
                        You are averaging <span className="font-semibold text-gray-900">{stats.velocity} tasks</span> per day this week. 
                        Your activity peaks on <span className="font-semibold text-gray-900">{stats.mostProductiveDay}s</span>. 
                        Most of your energy is currently directed towards <span className="font-semibold text-gray-900">{stats.topCategory.toLowerCase()}</span>.
                    </>
                ) : (
                    "Complete some tasks to generate personalized insights about your working habits."
                )}
            </p>
        </div>
      </div>
    </div>
  );
}