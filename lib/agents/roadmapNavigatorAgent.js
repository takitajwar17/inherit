// Roadmap Navigator Agent

/**
 * Roadmap Navigator Agent
 *
 * Helps users navigate their learning roadmaps, track progress,
 * create new roadmaps, and get suggestions for next steps.
 * Equipped with roadmap management tools.
 */

import { BaseAgent } from "./baseAgent";
import { getTaskModel } from "../gemini";
import { connect } from "../mongodb/mongoose";
import Roadmap from "../models/roadmapModel";
import logger from "@/lib/logger";
import { roadmapTools } from "./tools/roadmapTools";
import { ToolMessage } from "@langchain/core/messages";

const ROADMAP_SYSTEM_PROMPT = `You are a learning path navigator for CS students on the Inherit platform.

Your role is to:
1. Help users understand their current roadmap progress
2. Create new learning roadmaps when requested
3. Suggest next topics to study based on their progress
4. Explain how topics connect and build on each other
5. Provide career guidance related to their chosen path
6. Recommend resources for each topic

You have access to the following tools:
- create_roadmap: Create a new learning roadmap with phases and tasks. The output will be rendered visually in the UI.
- get_user_roadmaps: Get a list of the user's existing roadmaps.
- get_roadmap_details: Get detailed information about a specific roadmap.
- update_roadmap_progress: Mark steps in a roadmap as completed.

When creating roadmaps:
- Structure them with clear phases (e.g., "Foundation", "Core Concepts", "Advanced Topics", "Projects")
- Each phase should have 3-6 specific, actionable tasks
- Include realistic time estimates (e.g., "1 week", "3 days")
- Tailor difficulty to the user's level (beginner/intermediate/advanced)
- ALWAYS include documentation links and YouTube video recommendations for each task

IMPORTANT - Roadmap Creation Schema:
When creating a roadmap, the phases array MUST follow this exact structure:
{
  "title": "Learn [Topic] in [Duration]",
  "topic": "[Main topic]",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "phases": [
    {
      "name": "Phase Name",
      "tasks": [
        {
          "topic": "Task name",
          "documentation": "https://official-docs.com/page",
          "youtubeVideoId": "dQw4w9WgXcQ",
          "videoDuration": "15:30"
        }
      ],
      "duration": "X days/weeks"
    }
  ]
}

RESOURCE GUIDELINES:
- For documentation: Use official docs (MDN, React docs, Node.js docs) or reputable tutorials (freeCodeCamp, W3Schools)
- For YouTube videos: Provide the VIDEO ID only (the part after v= in the URL), not the full URL
  Example: For "https://www.youtube.com/watch?v=dQw4w9WgXcQ" → use "dQw4w9WgXcQ"
- Recommend popular educational channels: Traversy Media, freeCodeCamp, Fireship, Web Dev Simplified, Codevolution, The Net Ninja
- Include video duration in format "MM:SS" or "H:MM:SS"

IMPORTANT FORMATTING:
- Use GitHub-flavored Markdown for all responses
- Use ### for section headers
- Use tables (|) for structured data showing progress
- Use > [!INFO] or > [!TIP] callouts for key insights
- Use \\( and \\) for inline math when showing progress formulas

When discussing roadmaps:
- Reference the user's actual progress when available
- Explain why certain topics come before others
- Connect learning to career goals
- Encourage consistent progress

If the user asks about switching paths or exploring new areas:
- Help them understand prerequisites
- Suggest how to bridge knowledge gaps
- Recommend hybrid learning approaches

Be motivating and help users see the bigger picture of their learning journey.`;

export class RoadmapNavigatorAgent extends BaseAgent {
  constructor() {
    super(
      "roadmap",
      "Learning path navigation and progress tracking",
      getTaskModel()
    );
    this.setSystemPrompt(ROADMAP_SYSTEM_PROMPT);
    this.tools = roadmapTools;
  }

  /**
   * Process a roadmap-related query
   */
  async process(message, context = {}) {
    const {
      history = [],
      language = "en",
      clerkId,
      userName,
      userContext,
      contextSummary,
    } = context;

    logger.info("RoadmapNavigatorAgent received context", {
      hasClerkId: !!clerkId,
      hasUserName: !!userName,
      userName,
      hasUserContext: !!userContext,
      hasContextSummary: !!contextSummary,
      language,
      messagePreview: message.substring(0, 50),
    });

    if (!clerkId) {
      logger.warn("RoadmapNavigatorAgent called without clerkId");
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, রোডম্যাপ ফিচার ব্যবহার করতে আপনাকে লগ ইন করতে হবে।"
          : "Sorry, you need to be logged in to use roadmap features. Please log in and try again.",
        { error: true, requiresAuth: true }
      );
    }

    try {
      // Build comprehensive context
      let fullContext = "";

      // Add user name for personalization
      if (userName && userName !== "there") {
        fullContext += `\n\nUser's name: ${userName}. Address them by name.`;
      }

      // Add full user context summary
      if (contextSummary) {
        fullContext += `\n\n--- USER'S PROFILE SUMMARY ---\n${contextSummary}\n--- END PROFILE ---`;
      }

      // Get user's existing roadmaps for context
      await connect();
      const roadmaps = await Roadmap.find({ clerkId })
        .limit(5)
        .sort({ updatedAt: -1 });

      if (roadmaps.length > 0) {
        fullContext += `\n\nUser's existing roadmaps (${roadmaps.length} total):`;
        for (const r of roadmaps) {
          const steps = r.content?.steps || [];
          const completed = steps.filter((s) => s.completed).length;
          const total = steps.length;
          const progress =
            total > 0 ? Math.round((completed / total) * 100) : 0;
          fullContext += `\n- "${r.title}" (ID: ${
            r._id
          }): ${completed}/${total} steps, ${progress}% complete, status: ${
            r.status || "active"
          }`;
        }
      } else {
        fullContext += `\n\nUser has no roadmaps yet. They might want to create their first one!`;
      }

      // Bind tools to the model
      const modelWithTools = this.bindTools(this.tools);

      const enhancedPrompt = this.systemPrompt + fullContext;
      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);

      logger.debug("Built roadmap agent messages", {
        messageCount: messages.length,
        toolsCount: this.tools.length,
        existingRoadmaps: roadmaps.length,
      });

      // First model call
      const response = await modelWithTools.invoke(messages, {
        configurable: { clerkId },
      });

      // Check if model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        logger.info("RoadmapNavigatorAgent executing tools", {
          toolCalls: response.tool_calls.map((tc) => tc.name),
        });

        // Execute the tools
        const toolResults = await this.executeTools(
          response.tool_calls,
          this.tools,
          { configurable: { clerkId } }
        );

        // Create tool messages for the model
        const toolMessages = response.tool_calls.map((toolCall, index) => {
          const result = toolResults[index];
          return new ToolMessage({
            tool_call_id: toolCall.id,
            content: result.success ? result.result : `Error: ${result.error}`,
          });
        });

        // Get final response from model with tool results
        const finalMessages = [...messages, response, ...toolMessages];

        const finalResponse = await modelWithTools.invoke(finalMessages, {
          configurable: { clerkId },
        });

        let content = this.safeExtractContent(finalResponse);

        // Ensure we have content
        if (!content || content.trim() === "") {
          // Build response from tool results
          const successResults = toolResults.filter((r) => r.success);
          if (successResults.length > 0) {
            content = successResults
              .map((r) => {
                try {
                  const parsed = JSON.parse(r.result);
                  return parsed.message || "Operation completed successfully.";
                } catch {
                  return r.result;
                }
              })
              .join("\n\n");
          } else {
            content =
              language === "bn"
                ? "রোডম্যাপ অপারেশন সম্পন্ন হয়েছে।"
                : "Roadmap operation completed.";
          }
        }

        // Extract tool results data for response metadata
        const toolResultsData = toolResults
          .filter((r) => r.success)
          .map((r) => {
            try {
              return JSON.parse(r.result);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        return this.formatResponse(content, {
          language,
          usedTools: response.tool_calls.map((tc) => tc.name),
          toolResults: toolResultsData,
          hasRoadmaps: roadmaps.length > 0,
        });
      }

      // No tool calls, return direct response
      const content = this.safeExtractContent(response);

      return this.formatResponse(content, {
        language,
        hasRoadmaps: roadmaps.length > 0,
      });
    } catch (error) {
      logger.error("Roadmap navigator agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, রোডম্যাপ তথ্য পেতে সমস্যা হয়েছে।"
          : "Sorry, I had trouble with that roadmap operation. Please try again.",
        { error: true }
      );
    }
  }
}

export default RoadmapNavigatorAgent;
