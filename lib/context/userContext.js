/**
 * User Context Service
 * 
 * Gathers comprehensive user data to provide context-aware AI responses.
 * Fetches user profile, tasks, roadmaps, quests, and activity data.
 * 
 * @module lib/context/userContext
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import Task from "@/lib/models/taskModel";
import Roadmap from "@/lib/models/roadmapModel";
import Quest from "@/lib/models/questModel";
import logger from "@/lib/logger";

/**
 * Build comprehensive user context for AI agents
 * 
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object>} Complete user context
 */
export async function buildUserContext(userId) {
  if (!userId) {
    logger.warn("buildUserContext called without userId");
    return getEmptyContext();
  }

  try {
    await connect();

    // Fetch all user data in parallel for performance
    const [userProfile, tasks, roadmaps, quests] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserTasks(userId),
      fetchUserRoadmaps(userId),
      fetchUserQuests(userId),
    ]);

    // Build context summary
    const context = {
      // User profile
      user: {
        id: userId,
        name: userProfile.name,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        username: userProfile.username,
      },

      // Task statistics
      tasks: {
        total: tasks.total,
        pending: tasks.pending,
        completed: tasks.completed,
        overdue: tasks.overdue,
        highPriority: tasks.highPriority,
        upcomingDeadlines: tasks.upcomingDeadlines,
        recentTasks: tasks.recent,
      },

      // Roadmap progress
      roadmaps: {
        total: roadmaps.total,
        inProgress: roadmaps.inProgress,
        completed: roadmaps.completed,
        currentRoadmap: roadmaps.current,
        recentRoadmaps: roadmaps.recent,
      },

      // Quest activity
      quests: {
        total: quests.total,
        completed: quests.completed,
        inProgress: quests.inProgress,
        currentQuest: quests.current,
        recentQuests: quests.recent,
      },

      // Activity summary
      activity: {
        isActive: tasks.total > 0 || roadmaps.total > 0 || quests.total > 0,
        lastTaskDate: tasks.lastActivityDate,
        lastRoadmapUpdate: roadmaps.lastActivityDate,
        lastQuestActivity: quests.lastActivityDate,
      },

      // Context metadata
      contextGeneratedAt: new Date().toISOString(),
      contextVersion: "1.0",
    };

    logger.info("User context built successfully", {
      userId,
      userName: userProfile.name,
      tasksCount: tasks.total,
      roadmapsCount: roadmaps.total,
      questsCount: quests.total,
    });

    return context;
  } catch (error) {
    logger.error("Failed to build user context", {
      userId,
      error: error.message,
      stack: error.stack,
    });
    return getEmptyContext();
  }
}

/**
 * Fetch user profile from Clerk
 */
async function fetchUserProfile(userId) {
  try {
    // clerkClient is a function that returns a client in newer Clerk versions
    const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
    const user = await client.users.getUser(userId);
    
    return {
      name: user.firstName || user.username || "there",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.emailAddresses?.[0]?.emailAddress || "",
      username: user.username || "",
    };
  } catch (error) {
    logger.warn("Failed to fetch user profile from Clerk", {
      userId,
      error: error.message,
    });
    return {
      name: "there",
      firstName: "",
      lastName: "",
      email: "",
      username: "",
    };
  }
}

/**
 * Fetch user tasks
 */
async function fetchUserTasks(userId) {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const [allTasks, pendingTasks, completedTasks, overdueTasks, highPriorityTasks, upcomingTasks] = await Promise.all([
      Task.countDocuments({ clerkId: userId }),
      Task.countDocuments({ clerkId: userId, status: "pending" }),
      Task.countDocuments({ clerkId: userId, status: "completed" }),
      Task.countDocuments({ 
        clerkId: userId, 
        status: "pending",
        dueDate: { $lt: now }
      }),
      Task.countDocuments({ 
        clerkId: userId, 
        status: "pending",
        priority: "high"
      }),
      Task.find({ 
        clerkId: userId, 
        status: "pending",
        dueDate: { $gte: now, $lte: sevenDaysFromNow }
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .select("title dueDate priority category"),
    ]);

    // Get recent tasks for context
    const recentTasks = await Task.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title status category priority");

    // Get last activity date
    const lastTask = await Task.findOne({ clerkId: userId })
      .sort({ createdAt: -1 })
      .select("createdAt");

    return {
      total: allTasks,
      pending: pendingTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      highPriority: highPriorityTasks,
      upcomingDeadlines: upcomingTasks.map(t => ({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        category: t.category,
      })),
      recent: recentTasks.map(t => ({
        title: t.title,
        status: t.status,
        category: t.category,
      })),
      lastActivityDate: lastTask?.createdAt || null,
    };
  } catch (error) {
    logger.warn("Failed to fetch user tasks", {
      userId,
      error: error.message,
    });
    return {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
      highPriority: 0,
      upcomingDeadlines: [],
      recent: [],
      lastActivityDate: null,
    };
  }
}

/**
 * Fetch user roadmaps
 */
async function fetchUserRoadmaps(userId) {
  try {
    const [totalRoadmaps, inProgressRoadmaps, completedRoadmaps] = await Promise.all([
      Roadmap.countDocuments({ clerkId: userId }),
      Roadmap.countDocuments({ clerkId: userId, status: "in-progress" }),
      Roadmap.countDocuments({ clerkId: userId, status: "completed" }),
    ]);

    // Get current/most recent roadmap
    const currentRoadmap = await Roadmap.findOne({ 
      clerkId: userId,
      status: "in-progress"
    })
      .sort({ updatedAt: -1 })
      .select("title topic difficulty progress");

    // Get recent roadmaps
    const recentRoadmaps = await Roadmap.find({ clerkId: userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select("title topic difficulty status progress");

    // Get last activity
    const lastRoadmap = await Roadmap.findOne({ clerkId: userId })
      .sort({ updatedAt: -1 })
      .select("updatedAt");

    return {
      total: totalRoadmaps,
      inProgress: inProgressRoadmaps,
      completed: completedRoadmaps,
      current: currentRoadmap ? {
        title: currentRoadmap.title,
        topic: currentRoadmap.topic,
        difficulty: currentRoadmap.difficulty,
        progress: currentRoadmap.progress,
      } : null,
      recent: recentRoadmaps.map(r => ({
        title: r.title,
        topic: r.topic,
        status: r.status,
        progress: r.progress,
      })),
      lastActivityDate: lastRoadmap?.updatedAt || null,
    };
  } catch (error) {
    logger.warn("Failed to fetch user roadmaps", {
      userId,
      error: error.message,
    });
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      current: null,
      recent: [],
      lastActivityDate: null,
    };
  }
}

/**
 * Fetch user quests
 */
async function fetchUserQuests(userId) {
  try {
    // Note: Quest model structure may vary, adjust as needed
    const [totalQuests, completedQuests, inProgressQuests] = await Promise.all([
      Quest.countDocuments({ participants: userId }),
      Quest.countDocuments({ participants: userId, status: "completed" }),
      Quest.countDocuments({ participants: userId, status: "active" }),
    ]);

    // Get current quest
    const currentQuest = await Quest.findOne({ 
      participants: userId,
      status: "active"
    })
      .sort({ startedAt: -1 })
      .select("name difficulty category");

    // Get recent quests
    const recentQuests = await Quest.find({ participants: userId })
      .sort({ startedAt: -1 })
      .limit(3)
      .select("name difficulty category status");

    // Get last activity
    const lastQuest = await Quest.findOne({ participants: userId })
      .sort({ startedAt: -1 })
      .select("startedAt");

    return {
      total: totalQuests,
      completed: completedQuests,
      inProgress: inProgressQuests,
      current: currentQuest ? {
        name: currentQuest.name,
        difficulty: currentQuest.difficulty,
        category: currentQuest.category,
      } : null,
      recent: recentQuests.map(q => ({
        name: q.name,
        difficulty: q.difficulty,
        status: q.status,
      })),
      lastActivityDate: lastQuest?.startedAt || null,
    };
  } catch (error) {
    logger.warn("Failed to fetch user quests", {
      userId,
      error: error.message,
    });
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      current: null,
      recent: [],
      lastActivityDate: null,
    };
  }
}

/**
 * Get empty context object
 */
function getEmptyContext() {
  return {
    user: {
      id: null,
      name: "there",
      firstName: "",
      lastName: "",
      email: "",
      username: "",
    },
    tasks: {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
      highPriority: 0,
      upcomingDeadlines: [],
      recentTasks: [],
    },
    roadmaps: {
      total: 0,
      inProgress: 0,
      completed: 0,
      currentRoadmap: null,
      recentRoadmaps: [],
    },
    quests: {
      total: 0,
      completed: 0,
      inProgress: 0,
      currentQuest: null,
      recentQuests: [],
    },
    activity: {
      isActive: false,
      lastTaskDate: null,
      lastRoadmapUpdate: null,
      lastQuestActivity: null,
    },
    contextGeneratedAt: new Date().toISOString(),
    contextVersion: "1.0",
  };
}

/**
 * Format user context as human-readable summary for AI agents
 */
export function formatContextForAgent(context) {
  if (!context || !context.user) {
    return "";
  }

  const parts = [];

  // User info
  parts.push(`User: ${context.user.name} (@${context.user.username || 'user'})`);
  if (context.user.email) {
    parts.push(`Email: ${context.user.email}`);
  }

  // Tasks summary
  if (context.tasks.total > 0) {
    parts.push(`\nTasks: ${context.tasks.total} total (${context.tasks.pending} pending, ${context.tasks.completed} completed)`);
    if (context.tasks.overdue > 0) {
      parts.push(`⚠️ ${context.tasks.overdue} overdue tasks`);
    }
    if (context.tasks.highPriority > 0) {
      parts.push(`🔴 ${context.tasks.highPriority} high-priority tasks`);
    }
    if (context.tasks.upcomingDeadlines.length > 0) {
      parts.push(`Upcoming: ${context.tasks.upcomingDeadlines.map(t => t.title).join(', ')}`);
    }
  }

  // Roadmaps summary
  if (context.roadmaps.total > 0) {
    parts.push(`\nRoadmaps: ${context.roadmaps.total} total (${context.roadmaps.inProgress} active)`);
    if (context.roadmaps.currentRoadmap) {
      parts.push(`Current: ${context.roadmaps.currentRoadmap.title} (${context.roadmaps.currentRoadmap.progress || 0}% complete)`);
    }
  }

  // Quests summary
  if (context.quests.total > 0) {
    parts.push(`\nQuests: ${context.quests.total} total (${context.quests.completed} completed)`);
    if (context.quests.currentQuest) {
      parts.push(`Active Quest: ${context.quests.currentQuest.name}`);
    }
  }

  return parts.join('\n');
}

export default { buildUserContext, formatContextForAgent };
