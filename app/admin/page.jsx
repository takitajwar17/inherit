"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import QuestList from "./components/QuestList";

/**
 * Admin Dashboard Page Component
 * 
 * Main admin dashboard that displays quest management interface.
 * Protected by JWT token authentication - redirects to login if not authenticated.
 * 
 * @component
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuests: 0,
    activeQuests: 0,
    upcomingQuests: 0,
  });

  // Check authentication on component mount
  useEffect(() => {
    /**
     * Verifies the admin token and redirects to login if invalid
     */
    const checkAuth = async () => {
      const adminToken = Cookies.get("adminToken");
      
      if (!adminToken) {
        // No token found, redirect to login
        window.location.href = "/admin/login";
        return;
      }

      try {
        // Verify token by making a test request to protected endpoint
        const response = await fetch("/api/admin/quests", {
          headers: {
            "Authorization": `Bearer ${adminToken}`,
          },
        });

        if (!response.ok) {
          // Token is invalid or expired, clear it and redirect
          Cookies.remove("adminToken", { path: "/" });
          window.location.href = "/admin/login";
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        Cookies.remove("adminToken", { path: "/" });
        window.location.href = "/admin/login";
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-xl text-gray-600">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quest Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage coding challenges and quests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-900 text-sm font-medium">Total Quests</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-blue-900">{stats.totalQuests}</span>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-900 text-sm font-medium">Active Quests</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-green-900">{stats.activeQuests}</span>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-900 text-sm font-medium">Upcoming Quests</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-purple-900">{stats.upcomingQuests}</span>
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="bg-white rounded-lg">
        <QuestList onStatsUpdate={setStats} />
      </div>
    </div>
  );
}
