/**
 * Tasks API
 *
 * GET /api/tasks - List user tasks
 * POST /api/tasks - Create a task
 */

import { auth } from "@clerk/nextjs";
import { connect } from "@/lib/mongodb/mongoose";
import Task from "@/lib/models/taskModel";
import logger from "@/lib/logger";
import {
  successResponse,
  errorResponse,
  generateRequestId,
  parseJsonBody,
} from "@/lib/errors/apiResponse";

/**
 * GET /api/tasks - List user tasks with filters
 */
export async function GET(request) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connect();

    // Build filter
    const filter = { clerkId: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .sort({ order: 1, dueDate: 1, priority: -1, createdAt: -1 })
      .limit(Math.min(limit, 100));

    return successResponse({ tasks });
  } catch (error) {
    logger.error("Tasks GET error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    const body = await parseJsonBody(request);
    const { title, description, category, priority, dueDate, tags } = body;

    if (!title || typeof title !== "string") {
      return errorResponse({ message: "Title is required" }, requestId, 400);
    }

    await connect();

    // Get the highest order to append the new task to the end
    const lastTask = await Task.findOne({ clerkId: userId }).sort({ order: -1 });
    const newOrder = lastTask && lastTask.order !== undefined ? lastTask.order + 1 : 0;

    const task = new Task({
      clerkId: userId,
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "other",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || [],
      order: newOrder,
    });

    await task.save();

    logger.info("Task created", { userId, taskId: task._id, requestId });

    return successResponse({ task }, 201);
  } catch (error) {
    logger.error("Tasks POST error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}
