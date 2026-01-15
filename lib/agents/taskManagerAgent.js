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
import logger from "@/lib/logger";
import { taskTools } from "./tools/taskTools";
import { ToolMessage } from "@langchain/core/messages";

const TASK_SYSTEM_PROMPT = `You are a task management assistant for CS students on the Inherit platform.

Your role is to:
1. Help create, update, and organize tasks
2. Remind users of upcoming deadlines
3. Suggest task prioritization
4. Break down large projects into smaller tasks
5. Link tasks to learning roadmaps when relevant

You have access to the following tools:
- create_task: Create a new task with title, description, category, priority, dueDate
- list_tasks: Get user's tasks with optional filters (status, category, priority, dueBefore)
- update_task: Modify an existing task
- delete_task: Permanently remove a task
- complete_task: Mark a task as completed
- get_deadlines: Find upcoming or overdue tasks

Use these tools to help users manage their tasks effectively. When users ask about their tasks, use list_tasks or get_deadlines to retrieve current information. When they want to create or modify tasks, use the appropriate tools.

Always provide friendly, helpful responses that summarize what you've done.`;

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
      // Bind tools to the model
      const modelWithTools = this.bindTools(taskTools);

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
      const response = await modelWithTools.invoke(messages, {
        configurable: { clerkId } // Pass clerkId to tools
      });

      // Check if model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute the tools
        const toolResults = await this.executeTools(
          response.tool_calls, 
          taskTools,
          { configurable: { clerkId } }
        );

        // Format tool results into user-friendly response
        const toolOutputs = this.formatToolResults(toolResults);

        // Create tool messages for the model
        const toolMessages = response.tool_calls.map((toolCall, index) => {
          const result = toolResults[index];
          return new ToolMessage({
            tool_call_id: toolCall.id,
            content: result.success ? result.result : `Error: ${result.error}`,
          });
        });

        // Get final response from model with tool results
        const finalMessages = [
          ...messages,
          response,
          ...toolMessages,
        ];

        const finalResponse = await modelWithTools.invoke(finalMessages, {
          configurable: { clerkId }
        });

        const finalContent = this.safeExtractContent(finalResponse);
        return this.formatResponse(finalContent, {
          language,
          usedTools: response.tool_calls.map(tc => tc.name),
        });
      }

      // No tool calls, just return the response
      const content = this.safeExtractContent(response);
      return this.formatResponse(content, { language });
    } catch (error) {
      logger.error("Task manager agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, টাস্ক ম্যানেজমেন্টে সমস্যা হয়েছে।"
          : "Sorry, I had trouble with that task operation.",
        { error: true }
      );
    }
  }
}

export default TaskManagerAgent;
