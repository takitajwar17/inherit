/**
 * User Context Tools
 * 
 * LangChain tools for fetching user context and statistics.
 * Used by agents to retrieve real-time user data when asked about progress.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { buildUserContext } from "@/lib/context/userContext";
import logger from "@/lib/logger";

/**
 * Tool: Fetch user context and statistics
 * Returns comprehensive user data including roadmaps, tasks, and progress
 */
export const fetchUserContextTool = new DynamicStructuredTool({
  name: "fetch_user_context",
  description: "Fetch the current user's progress, statistics, and activity data. Use this when the user asks about 'my progress', 'my roadmaps', 'how am I doing', 'my tasks', or wants a summary of their learning journey.",
  schema: z.object({
    includeDetails: z.boolean().default(true).describe("Whether to include detailed task and roadmap lists"),
  }),
  func: async ({ includeDetails }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Unable to fetch your progress. Please make sure you are logged in.",
        });
      }

      logger.info("Fetching user context via tool", { clerkId, includeDetails });

      // Use the existing buildUserContext function
      const context = await buildUserContext(clerkId);

      if (!context || !context.user) {
        return JSON.stringify({
          success: false,
          message: "Could not retrieve your profile data. Please try again.",
        });
      }

      // Calculate overall completion rate
      const totalTasks = context.tasks.total || 0;
      const completedTasks = context.tasks.completed || 0;
      const taskCompletionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      // Build the response
      const response = {
        success: true,
        data: {
          // User profile
          userName: context.user.name,
          email: context.user.email,

          // Roadmap statistics
          roadmapCount: context.roadmaps.total,
          roadmapsInProgress: context.roadmaps.inProgress,
          roadmapsCompleted: context.roadmaps.completed,
          currentRoadmap: context.roadmaps.currentRoadmap ? {
            title: context.roadmaps.currentRoadmap.title,
            topic: context.roadmaps.currentRoadmap.topic,
            progress: context.roadmaps.currentRoadmap.progress || 0,
          } : null,

          // Task statistics
          taskCount: totalTasks,
          tasksPending: context.tasks.pending,
          tasksCompleted: completedTasks,
          tasksOverdue: context.tasks.overdue,
          highPriorityTasks: context.tasks.highPriority,
          completionRate: taskCompletionRate,

          // Quest statistics
          questCount: context.quests.total,
          questsCompleted: context.quests.completed,
          questsInProgress: context.quests.inProgress,
          currentQuest: context.quests.currentQuest ? {
            name: context.quests.currentQuest.name,
            difficulty: context.quests.currentQuest.difficulty,
          } : null,

          // Activity status
          isActive: context.activity.isActive,
          lastActivity: context.activity.lastTaskDate || context.activity.lastRoadmapUpdate,
        },
      };

      // Add detailed lists if requested
      if (includeDetails) {
        response.data.activeTasks = context.tasks.upcomingDeadlines?.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          category: t.category,
        })) || [];

        response.data.recentRoadmaps = context.roadmaps.recentRoadmaps?.map(r => ({
          title: r.title,
          topic: r.topic,
          status: r.status,
          progress: r.progress,
        })) || [];

        response.data.recentActivity = [
          ...(context.tasks.recentTasks?.map(t => ({
            type: 'task',
            title: t.title,
            status: t.status,
          })) || []),
          ...(context.quests.recentQuests?.map(q => ({
            type: 'quest',
            title: q.name,
            status: q.status,
          })) || []),
        ].slice(0, 5);
      }

      logger.info("User context fetched successfully", {
        clerkId,
        roadmapCount: response.data.roadmapCount,
        taskCount: response.data.taskCount,
        completionRate: response.data.completionRate,
      });

      return JSON.stringify(response);
    } catch (error) {
      logger.error("Fetch user context tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to fetch your progress: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Get user statistics summary
 * Returns a quick overview of user stats for dashboard queries
 */
export const getUserStatsTool = new DynamicStructuredTool({
  name: "get_user_stats",
  description: "Get a quick summary of user statistics including task completion rate, roadmap progress, and learning streak. Use this for quick status checks.",
  schema: z.object({}),
  func: async (_, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Please log in to view your statistics.",
        });
      }

      const context = await buildUserContext(clerkId);

      if (!context) {
        return JSON.stringify({
          success: false,
          message: "Could not retrieve statistics.",
        });
      }

      const totalTasks = context.tasks.total || 0;
      const completedTasks = context.tasks.completed || 0;
      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      return JSON.stringify({
        success: true,
        stats: {
          roadmapCount: context.roadmaps.total,
          completionRate: completionRate,
          activeTasks: context.tasks.pending,
          overdueTasks: context.tasks.overdue,
          questsCompleted: context.quests.completed,
          isActive: context.activity.isActive,
        },
        message: `You have ${context.roadmaps.total} roadmap(s), ${context.tasks.pending} pending task(s), and a ${completionRate}% completion rate.`,
      });
    } catch (error) {
      logger.error("Get user stats tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to get statistics: ${error.message}`,
      });
    }
  },
});

// Export all context tools
export const contextTools = [
  fetchUserContextTool,
  getUserStatsTool,
];

export default contextTools;

