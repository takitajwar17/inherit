"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  CircularProgressbar,
  CircularProgressbarWithChildren,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getUserRoadmaps } from "@/lib/actions/roadmap";
import { getRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { PageHeader, SectionHeader } from "@/components/shared";
import { FaYoutube, FaTrophy, FaRoad, FaBook, FaClock, FaCalendarAlt } from "react-icons/fa";
import { IoTrendingUp } from "react-icons/io5";

// Lightning-fast fetch functions
const fetchQuests = async () => {
  const response = await fetch('/api/quests/user');
  const result = await response.json();
  return result.data || result;
};

const fetchRoadmaps = async (userId) => {
  return await getUserRoadmaps(userId);
};

// Ultra-optimized calculations with memoization
const useOptimizedStats = (questsData, roadmaps) => {
  return useMemo(() => {
    if (!questsData || !roadmaps) return null;

    // Fast progress calculation with early exit
    let totalProgress = 0;
    let validRoadmaps = 0;
    
    for (const roadmap of roadmaps.slice(0, 10)) { // Limit to prevent slowdown
      if (roadmap?.content?.steps?.length) {
        const { progress } = getRoadmapProgress(roadmap._id, roadmap.content.steps.length);
        totalProgress += progress;
        validRoadmaps++;
      }
    }

    // Super-fast streak calculation
    const streak = questsData.history?.length > 0 
      ? Math.min(questsData.history.length, 30) // Cap for performance
      : 1;

    return {
      activeQuests: questsData?.active?.length || 0,
      completedQuests: questsData?.completed?.length || 0,
      roadmapProgress: validRoadmaps > 0 ? Math.round(totalProgress / validRoadmaps) : 0,
      learningStreak: streak,
    };
  }, [questsData, roadmaps]);
};

// Pre-processed activity data
const useOptimizedActivity = (questsData, roadmaps) => {
  return useMemo(() => {
    if (!questsData || !roadmaps) return [];

    const activities = [];
    
    // Add recent quest activities (pre-limited)
    const recentQuests = questsData.recent?.slice(0, 2) || [];
    activities.push(...recentQuests);
    
    // Add roadmap activities (pre-limited)
    const recentRoadmaps = roadmaps.slice(0, 1)
      .filter(r => r.title && r.createdAt)
      .map(r => ({
        title: r.title,
        type: 'Roadmap',
        date: r.createdAt
      }));
    activities.push(...recentRoadmaps);

    // Fast sort and limit
    return activities
      .filter(a => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [questsData, roadmaps]);
};

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();

  // Parallel queries with aggressive caching
  const queries = useQueries({
    queries: [
      {
        queryKey: ['quests', user?.id],
        queryFn: fetchQuests,
        enabled: !!user?.id,
        staleTime: 30000, // 30 seconds
        cacheTime: 300000, // 5 minutes
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['roadmaps', user?.id],
        queryFn: () => fetchRoadmaps(user?.id),
        enabled: !!user?.id,
        staleTime: 60000, // 1 minute
        cacheTime: 600000, // 10 minutes
        refetchOnWindowFocus: false,
      }
    ]
  });

  const [questsQuery, roadmapsQuery] = queries;
  
  const questsData = questsQuery.data;
  const roadmaps = roadmapsQuery.data || [];
  
  // Lightning-fast calculations
  const stats = useOptimizedStats(questsData, roadmaps);
  const recentActivity = useOptimizedActivity(questsData, roadmaps);

  const isLoading = questsQuery.isLoading || roadmapsQuery.isLoading;

  // Skeleton loader with minimal re-renders
  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="h-12 w-3/4 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="space-y-3">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity and Roadmaps Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse"></div>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Roadmaps Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse"></div>
              {[1, 2].map((item) => (
                <div key={item} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full">
                    <div className="h-2 w-1/3 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Standardized typography */}
        <PageHeader
          title={<>Welcome back, <span className="text-primary">{user?.firstName}</span>!</>}
          subtitle="Here's an overview of your learning journey"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Quests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeQuests}</h3>
                <p className="text-xs text-gray-400 mt-1">Ongoing challenges</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <FaTrophy className="text-2xl text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Quests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.completedQuests}</h3>
                <p className="text-xs text-gray-400 mt-1">Successfully finished</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <FaBook className="text-2xl text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Roadmap Progress</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.roadmapProgress}%</h3>
                <p className="text-xs text-gray-400 mt-1">Overall completion</p>
              </div>
              <div style={{ width: 60, height: 60 }}>
                <CircularProgressbar
                  value={stats.roadmapProgress}
                  text={`${stats.roadmapProgress}%`}
                  styles={{
                    path: { stroke: '#0891b2', transition: 'stroke-dashoffset 0.5s ease' },
                    text: { fill: '#0891b2', fontSize: '24px', fontWeight: 'bold' },
                    trail: { stroke: '#e2e8f0' },
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Learning Streak</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.learningStreak} {stats.learningStreak === 1 ? 'day' : 'days'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Keep it up!</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <IoTrendingUp className="text-2xl text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="bg-white p-6 hover:shadow-lg transition-all duration-300">
            <SectionHeader
              title="Recent Activity"
              icon={<FaClock />}
            />
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer border border-gray-100"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <div className="flex items-center mt-1">
                      <FaCalendarAlt className="text-gray-400 text-xs mr-1" />
                      <p className="text-sm text-gray-500">
                        {activity.type} • {activity.date ? new Date(activity.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Not started'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Roadmaps */}
          <Card className="bg-white p-6 hover:shadow-lg transition-all duration-300">
            <SectionHeader
              title="Active Roadmaps"
              icon={<FaRoad />}
            />
            <div className="space-y-4">
              {roadmaps.slice(0, 2).map((roadmap) => {
                // Use the shared utility for progress calculation
                const totalSteps = roadmap.content?.steps?.length || 0;
                const { completedCount, progress } = getRoadmapProgress(roadmap._id, totalSteps);

                return (
                  <div
                    key={roadmap._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/roadmaps/${roadmap._id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{roadmap.title}</h3>
                        <p className="text-sm text-gray-500">{roadmap.description}</p>
                      </div>
                      <div className="w-16 h-16">
                        <CircularProgressbar
                          value={progress}
                          text={`${progress}%`}
                          styles={{
                            path: {
                              stroke: `rgba(62, 152, 199, ${progress / 100})`,
                            },
                            text: {
                              fill: '#3e98c7',
                              fontSize: '24px',
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>{completedCount} / {totalSteps} steps completed</span>
                      <span>{progress}% complete</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
