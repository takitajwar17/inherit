/**
 * Task by ID API
 *
 * GET /api/tasks/[id] - Get single task
 * PUT /api/tasks/[id] - Update task
 * DELETE /api/tasks/[id] - Delete task
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
 * GET /api/tasks/[id] - Get a specific task
 */
export async function GET(request, { params }) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    const { id } = await params;

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    await connect();

    const task = await Task.findOne({ _id: id, clerkId: userId });

    if (!task) {
      return errorResponse({ message: "Task not found" }, requestId, 404);
    }

    return successResponse({ task });
  } catch (error) {
    logger.error("Task GET error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}

/**
 * PUT /api/tasks/[id] - Update a task
 */
export async function PUT(request, { params }) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    const { id } = await params;

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    const body = await parseJsonBody(request);
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "priority",
      "status",
      "dueDate",
      "tags",
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle status change to completed
    if (updates.status === "completed") {
      updates.completedAt = new Date();
    }

    // Parse date if provided
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    await connect();

    const task = await Task.findOneAndUpdate(
      { _id: id, clerkId: userId },
      updates,
      { new: true }
    );

    if (!task) {
      return errorResponse({ message: "Task not found" }, requestId, 404);
    }

    logger.info("Task updated", {
      userId,
      taskId: id,
      updates: Object.keys(updates),
      requestId,
    });

    return successResponse({ task });
  } catch (error) {
    logger.error("Task PUT error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(request, { params }) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    const { id } = await params;

    if (!userId) {
      return errorResponse(
        { message: "Authentication required" },
        requestId,
        401
      );
    }

    await connect();

    const task = await Task.findOneAndDelete({ _id: id, clerkId: userId });

    if (!task) {
      return errorResponse({ message: "Task not found" }, requestId, 404);
    }

    logger.info("Task deleted", { userId, taskId: id, requestId });

    return successResponse({ message: "Task deleted successfully" });
  } catch (error) {
    logger.error("Task DELETE error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}
