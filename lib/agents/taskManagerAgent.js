// Task Manager Agent

/**
 * Task Manager Agent
 *
 * Handles task-related queries: creating, updating, listing tasks.
 * Integrates with the Task model for CRUD operations.
 */

import { BaseAgent } from "./baseAgent";
import { getTaskModel } from "../gemini";
import { connect } from "../mongodb/mongoose";
import Task from "../models/taskModel";

const TASK_SYSTEM_PROMPT = `You are a task management assistant for CS students on the Inherit platform.

Your role is to:
1. Help create, update, and organize tasks
2. Remind users of upcoming deadlines
3. Suggest task prioritization
4. Break down large projects into smaller tasks
5. Link tasks to learning roadmaps when relevant

When the user wants to CREATE a task, extract:
- title: Clear, concise task title
- category: study | assignment | project | revision | exam | other
- priority: high | medium | low
- dueDate: Parse any date mentioned (or null)
- description: Optional details

When the user asks about their tasks, provide a helpful summary.

IMPORTANT: For task operations, respond with JSON when action is needed:
{
  "action": "create" | "list" | "update" | "complete" | "delete" | "chat",
  "task": { ...task details if creating/updating },
  "filter": { ...filter criteria if listing },
  "taskId": "id if updating/completing/deleting",
  "message": "Human-friendly response"
}

For general task advice, just use "action": "chat" with your response in "message".`;

export class TaskManagerAgent extends BaseAgent {
  constructor() {
    super("task", "Task management and organization", getTaskModel());
    this.setSystemPrompt(TASK_SYSTEM_PROMPT);
  }

  /**
   * Process a task-related query
   */
  async process(message, context = {}) {
    const { history = [], language = "en", clerkId } = context;

    try {
      // Get user's current tasks for context
      let tasksContext = "";
      if (clerkId) {
        await connect();
        const pendingTasks = await Task.find({
          clerkId,
          status: { $ne: "completed" },
        })
          .limit(5)
          .sort({ dueDate: 1 });

        if (pendingTasks.length > 0) {
          tasksContext = `\n\nUser's current pending tasks:\n${pendingTasks
            .map(
              (t) =>
                `- ${t.title} (${t.priority}, due: ${
                  t.dueDate ? t.dueDate.toLocaleDateString() : "no date"
                })`
            )
            .join("\n")}`;
        }
      }

      const enhancedPrompt = this.systemPrompt + tasksContext;
      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);
      const response = await this.model.invoke(messages);

      // Try to parse structured response
      const content = response.content;
      let parsed = null;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Not JSON, treat as regular message
      }

      // Handle task operations if parsed
      if (parsed && parsed.action && parsed.action !== "chat" && clerkId) {
        const result = await this.handleTaskAction(parsed, clerkId);
        return this.formatResponse(result.message || parsed.message, {
          action: parsed.action,
          result,
          language,
        });
      }

      return this.formatResponse(parsed?.message || content, { language });
    } catch (error) {
      console.error("Task manager agent error:", error);
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, টাস্ক ম্যানেজমেন্টে সমস্যা হয়েছে।"
          : "Sorry, I had trouble with that task operation.",
        { error: true }
      );
    }
  }

  /**
   * Handle actual task CRUD operations
   */
  async handleTaskAction(parsed, clerkId) {
    await connect();

    switch (parsed.action) {
      case "create":
        if (parsed.task) {
          const newTask = new Task({
            clerkId,
            title: parsed.task.title,
            description: parsed.task.description || "",
            category: parsed.task.category || "other",
            priority: parsed.task.priority || "medium",
            dueDate: parsed.task.dueDate ? new Date(parsed.task.dueDate) : null,
          });
          await newTask.save();
          return {
            success: true,
            task: newTask,
            message: `Created task: ${newTask.title}`,
          };
        }
        break;

      case "list":
        const filter = { clerkId, ...parsed.filter };
        const tasks = await Task.find(filter).limit(10).sort({ dueDate: 1 });
        return { success: true, tasks, message: `Found ${tasks.length} tasks` };

      case "complete":
        if (parsed.taskId) {
          const task = await Task.findOneAndUpdate(
            { _id: parsed.taskId, clerkId },
            { status: "completed", completedAt: new Date() },
            { new: true }
          );
          return { success: true, task, message: `Completed: ${task?.title}` };
        }
        break;

      case "delete":
        if (parsed.taskId) {
          await Task.deleteOne({ _id: parsed.taskId, clerkId });
          return { success: true, message: "Task deleted" };
        }
        break;
    }

    return { success: false, message: "Could not process task action" };
  }
}

export default TaskManagerAgent;
