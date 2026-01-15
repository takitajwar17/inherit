// Router Agent

/**
 * Router Agent
 *
 * Classifies user intent and routes to the appropriate specialized agent.
 * Uses fast Gemini model for quick classification.
 */

import { BaseAgent } from "./baseAgent";
import { getRouterModel } from "../gemini";
import logger from "@/lib/logger";

// Available agents for routing
export const AgentTypes = {
  LEARNING: "learning",
  TASK: "task",
  CODE: "code",
  ROADMAP: "roadmap",
  GENERAL: "general",
};

const ROUTER_SYSTEM_PROMPT = `You are an intent classification agent for a CS student learning platform called Inherit.

Your job is to analyze the user's message and determine which specialized agent should handle it.

Available agents:
1. "learning" - For learning/studying queries: concept explanations, CS topics, programming concepts, tutorials, course questions
2. "task" - For task management: creating tasks, reminders, deadlines, to-do items, scheduling, assignments
3. "code" - For code-related: code review, debugging, error explanations, code examples, programming help
4. "roadmap" - For learning path queries: roadmap progress, next topics, skill tracking, career guidance
5. "general" - For greetings, small talk, motivation, unclear queries, or anything else

IMPORTANT: Respond with ONLY a JSON object in this exact format:
{
  "agent": "learning" | "task" | "code" | "roadmap" | "general",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

Examples:
- "তুমি কেমন আছ?" → {"agent": "general", "confidence": 0.95, "reasoning": "Greeting in Bengali"}
- "Explain recursion" → {"agent": "learning", "confidence": 0.95, "reasoning": "Concept explanation request"}
- "Create a task for algorithms assignment" → {"agent": "task", "confidence": 0.9, "reasoning": "Task creation request"}
- "Why is my for loop infinite?" → {"agent": "code", "confidence": 0.85, "reasoning": "Debugging help"}
- "What should I learn next?" → {"agent": "roadmap", "confidence": 0.8, "reasoning": "Learning path guidance"}`;

export class RouterAgent extends BaseAgent {
  constructor() {
    super("router", "Routes messages to appropriate agents", getRouterModel());
    this.setSystemPrompt(ROUTER_SYSTEM_PROMPT);
  }

  /**
   * Classify user intent and determine target agent
   * @param {string} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} Routing decision
   */
  async process(message, context = {}) {
    try {
      const messages = this.buildMessages(message, [], "en"); // Always classify in English
      const response = await this.model.invoke(messages);

      // Parse JSON response - use safeExtractContent for robust content extraction
      const content = this.safeExtractContent(response);

      if (!content) {
        logger.warn("Router agent received empty response from model");
        return {
          agent: AgentTypes.GENERAL,
          confidence: 0.3,
          reasoning: "Empty response from model",
        };
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          agent: parsed.agent || AgentTypes.GENERAL,
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || "",
        };
      }

      // Fallback to general if parsing fails
      logger.warn("Router agent could not parse routing decision", {
        contentPreview: content.substring(0, 100),
      });
      return {
        agent: AgentTypes.GENERAL,
        confidence: 0.5,
        reasoning: "Could not parse routing decision",
      };
    } catch (error) {
      logger.error("Router agent error", {
        error: error.message,
        stack: error.stack,
      });
      return {
        agent: AgentTypes.GENERAL,
        confidence: 0.3,
        reasoning: `Routing error: ${error.message}`,
      };
    }
  }
}

export default RouterAgent;
