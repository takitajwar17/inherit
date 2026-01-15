/**
 * Task Management Tools
 * 
 * LangChain tools for task CRUD operations.
 * Used by TaskManagerAgent to interact with the database.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { connect } from "@/lib/mongodb/mongoose";
import Task from "@/lib/models/taskModel";
import logger from "@/lib/logger";

/**
 * Tool: Create a new task
 */
export const createTaskTool = new DynamicStructuredTool({
  name: "create_task",
  description: "Create a new task for the user with title, category, priority, and optional due date. Use this when user wants to add a task, reminder, or assignment.",
  schema: z.object({
    title: z.string().describe("The task title (required)"),
    description: z.string().optional().describe("Additional details about the task"),
    category: z.enum(["study", "assignment", "project", "revision", "exam", "other"]).default("other").describe("Task category"),
    priority: z.enum(["high", "medium", "low"]).default("medium").describe("Task priority level"),
    dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD) or natural language"),
  }),
  func: async ({ title, description, category, priority, dueDate }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to create tasks",
        });
      }

      await connect();

      // Parse due date if provided
      let parsedDueDate = null;
      if (dueDate) {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          parsedDueDate = null;
        }
      }

      const task = new Task({
        clerkId,
        title,
        description: description || "",
        category: category || "other",
        priority: priority || "medium",
        dueDate: parsedDueDate,
        status: "pending",
      });

      await task.save();

      logger.info("Task created via tool", {
        taskId: task._id,
        title: task.title,
        clerkId,
      });

      return JSON.stringify({
        success: true,
        taskId: task._id.toString(),
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        message: `✓ Created task: "${title}" (${priority} priority${parsedDueDate ? `, due ${parsedDueDate.toLocaleDateString()}` : ''})`,
      });
    } catch (error) {
      logger.error("Create task tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to create task: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: List user's tasks
 */
export const listTasksTool = new DynamicStructuredTool({
  name: "list_tasks",
  description: "Get a list of user's tasks with optional filters. Use this when user asks to see their tasks, to-do list, or upcoming work.",
  schema: z.object({
    status: z.enum(["pending", "in-progress", "completed", "all"]).default("pending").describe("Filter by task status"),
    category: z.string().optional().describe("Filter by category (study, assignment, project, etc.)"),
    priority: z.enum(["high", "medium", "low"]).optional().describe("Filter by priority level"),
    limit: z.number().default(10).describe("Maximum number of tasks to return"),
  }),
  func: async ({ status, category, priority, limit }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to view tasks",
        });
      }

      await connect();

      const filter = { clerkId };
      if (status && status !== "all") filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      const tasks = await Task.find(filter)
        .limit(limit)
        .sort({ dueDate: 1, priority: -1 });

      const taskList = tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate?.toISOString(),
        createdAt: t.createdAt?.toISOString(),
      }));

      logger.info("Tasks listed via tool", {
        clerkId,
        count: tasks.length,
        filters: { status, category, priority },
      });

      return JSON.stringify({
        success: true,
        count: tasks.length,
        tasks: taskList,
        message: `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}${status !== 'all' ? ` (${status})` : ''}`,
      });
    } catch (error) {
      logger.error("List tasks tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to list tasks: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Update a task
 */
export const updateTaskTool = new DynamicStructuredTool({
  name: "update_task",
  description: "Update an existing task's properties like title, status, priority, or due date. Use this when user wants to modify a task.",
  schema: z.object({
    taskId: z.string().describe("The task ID to update"),
    title: z.string().optional().describe("New task title"),
    description: z.string().optional().describe("New task description"),
    status: z.enum(["pending", "in-progress", "completed"]).optional().describe("New task status"),
    priority: z.enum(["high", "medium", "low"]).optional().describe("New priority level"),
    dueDate: z.string().optional().describe("New due date in ISO format"),
  }),
  func: async ({ taskId, ...updates }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to update tasks",
        });
      }

      await connect();

      const updateData = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === "completed") {
          updateData.completedAt = new Date();
        }
      }
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.dueDate) {
        const parsedDate = new Date(updates.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          updateData.dueDate = parsedDate;
        }
      }

      const task = await Task.findOneAndUpdate(
        { _id: taskId, clerkId },
        updateData,
        { new: true }
      );

      if (!task) {
        return JSON.stringify({
          success: false,
          message: "Task not found or you don't have permission to update it",
        });
      }

      logger.info("Task updated via tool", {
        taskId,
        clerkId,
        updates: Object.keys(updateData),
      });

      return JSON.stringify({
        success: true,
        taskId: task._id.toString(),
        title: task.title,
        status: task.status,
        message: `✓ Updated task: "${task.title}"`,
      });
    } catch (error) {
      logger.error("Update task tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to update task: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Delete a task
 */
export const deleteTaskTool = new DynamicStructuredTool({
  name: "delete_task",
  description: "Delete a task permanently by its ID. Use this when user wants to remove a task.",
  schema: z.object({
    taskId: z.string().describe("The ID of the task to delete"),
  }),
  func: async ({ taskId }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to delete tasks",
        });
      }

      await connect();

      const task = await Task.findOneAndDelete({ _id: taskId, clerkId });

      if (!task) {
        return JSON.stringify({
          success: false,
          message: "Task not found or you don't have permission to delete it",
        });
      }

      logger.info("Task deleted via tool", {
        taskId,
        clerkId,
        deletedTitle: task.title,
      });

      return JSON.stringify({
        success: true,
        message: `✓ Deleted task: "${task.title}"`,
      });
    } catch (error) {
      logger.error("Delete task tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to delete task: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Get upcoming deadlines
 */
export const getDeadlinesTool = new DynamicStructuredTool({
  name: "get_deadlines",
  description: "Get tasks with upcoming deadlines within a specified number of days. Use this when user asks about upcoming deadlines, what's due soon, or their schedule.",
  schema: z.object({
    days: z.number().default(7).describe("Number of days to look ahead (default: 7)"),
    includeOverdue: z.boolean().default(true).describe("Include overdue tasks"),
  }),
  func: async ({ days, includeOverdue }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to view deadlines",
        });
      }

      await connect();

      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);

      const filter = {
        clerkId,
        status: { $ne: "completed" },
        dueDate: { $exists: true, $ne: null },
      };

      if (includeOverdue) {
        filter.dueDate.$lte = future;
      } else {
        filter.dueDate.$gte = now;
        filter.dueDate.$lte = future;
      }

      const tasks = await Task.find(filter).sort({ dueDate: 1 });

      const deadlines = tasks.map(t => {
        const daysUntil = Math.ceil((t.dueDate - now) / (1000 * 60 * 60 * 24));
        return {
          id: t._id.toString(),
          title: t.title,
          dueDate: t.dueDate.toISOString(),
          priority: t.priority,
          category: t.category,
          daysUntil,
          isOverdue: daysUntil < 0,
        };
      });

      const overdue = deadlines.filter(d => d.isOverdue).length;
      const upcoming = deadlines.filter(d => !d.isOverdue).length;

      logger.info("Deadlines fetched via tool", {
        clerkId,
        days,
        totalDeadlines: deadlines.length,
        overdue,
        upcoming,
      });

      return JSON.stringify({
        success: true,
        count: deadlines.length,
        overdue,
        upcoming,
        deadlines,
        message: `Found ${deadlines.length} deadline${deadlines.length !== 1 ? 's' : ''} in next ${days} days${overdue > 0 ? ` (${overdue} overdue)` : ''}`,
      });
    } catch (error) {
      logger.error("Get deadlines tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to get deadlines: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Mark task as complete
 */
export const completeTaskTool = new DynamicStructuredTool({
  name: "complete_task",
  description: "Mark a task as completed. Use this when user says they finished, completed, or are done with a task.",
  schema: z.object({
    taskId: z.string().describe("The ID of the task to mark as complete"),
  }),
  func: async ({ taskId }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "User authentication required to complete tasks",
        });
      }

      await connect();

      const task = await Task.findOneAndUpdate(
        { _id: taskId, clerkId },
        { 
          status: "completed",
          completedAt: new Date(),
        },
        { new: true }
      );

      if (!task) {
        return JSON.stringify({
          success: false,
          message: "Task not found or you don't have permission to complete it",
        });
      }

      logger.info("Task completed via tool", {
        taskId,
        clerkId,
        completedTitle: task.title,
      });

      return JSON.stringify({
        success: true,
        taskId: task._id.toString(),
        title: task.title,
        completedAt: task.completedAt.toISOString(),
        message: `🎉 Great job! Completed: "${task.title}"`,
      });
    } catch (error) {
      logger.error("Complete task tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to complete task: ${error.message}`,
      });
    }
  },
});

// Export all task tools
export const taskTools = [
  createTaskTool,
  listTasksTool,
  updateTaskTool,
  deleteTaskTool,
  getDeadlinesTool,
  completeTaskTool,
];

export default taskTools;
