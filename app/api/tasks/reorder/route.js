
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

export async function PUT(request) {
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
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return errorResponse(
        { message: "Invalid tasks array" },
        requestId,
        400
      );
    }

    await connect();

    // Prepare bulk operations
    const operations = tasks.map((task) => ({
      updateOne: {
        filter: { _id: task._id, clerkId: userId },
        update: { $set: { order: task.order } },
      },
    }));

    if (operations.length > 0) {
      const result = await Task.bulkWrite(operations);
      logger.info("Bulk write result", { result, userId, requestId });
    }

    logger.info("Tasks reordered", { userId, count: tasks.length, requestId });

    return successResponse({ success: true });
  } catch (error) {
    logger.error("Tasks reorder error", { error: error.message, requestId });
    return errorResponse(error, requestId);
  }
}
