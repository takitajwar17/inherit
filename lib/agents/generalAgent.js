// General Agent

/**
 * General Agent
 *
 * Handles general conversation, greetings, motivation,
 * and anything that doesn't fit other specialized agents.
 */

import { BaseAgent } from "./baseAgent";
import { getLearningModel } from "../gemini";
import { getMessage } from "@/lib/i18n/agentMessages";
import logger from "@/lib/logger";

const GENERAL_SYSTEM_PROMPT = `You are a friendly AI companion for CS students on the Inherit learning platform.

Your role is to:
1. Greet users warmly and maintain friendly conversation
2. Provide motivation and encouragement for learning
3. Answer general questions about the platform
4. Help users who seem lost or confused
5. Be a supportive presence in their learning journey

Platform features you can mention:
- Learning videos and tutorials
- AI-generated learning roadmaps
- Coding quests and challenges
- Task management for assignments
- Community discussions (dev-discuss)
- Code playground

Personality traits:
- Friendly and approachable
- Encouraging but not pushy
- Helpful and patient
- Occasionally uses appropriate humor
- Celebrates user achievements

If a user seems stressed or overwhelmed:
- Acknowledge their feelings
- Suggest taking breaks
- Remind them learning is a journey
- Offer to help break down tasks

For platform navigation questions, guide them to:
- /dashboard - Their personal dashboard
- /learn - Video tutorials
- /roadmaps - Learning paths
- /quests - Coding challenges
- /playground - Code editor
- /dev-discuss - Community discussions

Keep responses concise and warm. Use emojis sparingly but effectively.`;

export class GeneralAgent extends BaseAgent {
  constructor() {
    super(
      "general",
      "General conversation and platform guidance",
      getLearningModel()
    );
    this.setSystemPrompt(GENERAL_SYSTEM_PROMPT);
  }

  /**
   * Process a general query
   */
  async process(message, context = {}) {
    const { history = [], language = "en" } = context;

    try {
      const messages = this.buildMessages(message, history, language);

      const response = await this.model.invoke(messages);
      const content = this.safeExtractContent(response);

      logger.debug("General agent response", {
        responseType: typeof response,
        contentType: typeof content,
        language,
      });

      return this.formatResponse(content, {
        language,
        type: this.getResponseType(message),
      });
    } catch (error) {
      logger.error("General agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "হ্যালো! আমি আপনাকে সাহায্য করতে এখানে আছি। কিভাবে সাহায্য করতে পারি?"
          : "Hello! I'm here to help. What can I assist you with?",
        { error: false }
      );
    }
  }

  /**
   * Determine the type of response needed
   */
  getResponseType(message) {
    const lower = message.toLowerCase();

    if (lower.match(/^(hi|hello|hey|হ্যালো|নমস্কার|আসসালামু)/)) {
      return "greeting";
    }
    if (lower.includes("thank") || lower.includes("ধন্যবাদ")) {
      return "gratitude";
    }
    if (
      lower.includes("help") ||
      lower.includes("confused") ||
      lower.includes("সাহায্য")
    ) {
      return "help";
    }
    if (
      lower.includes("tired") ||
      lower.includes("stressed") ||
      lower.includes("difficult")
    ) {
      return "support";
    }
    return "general";
  }
}

export default GeneralAgent;
