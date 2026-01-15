// Learning Companion Agent

/**
 * Learning Companion Agent
 *
 * Explains CS concepts, answers programming questions,
 * and provides learning guidance in Bengali or English.
 */

import { BaseAgent } from "./baseAgent";
import { getLearningModel } from "../gemini";
import { getMessage } from "@/lib/i18n/agentMessages";
import logger from "@/lib/logger";

const LEARNING_SYSTEM_PROMPT = `You are a friendly and knowledgeable CS learning companion for the Inherit platform.

Your role is to:
1. Explain programming concepts clearly with examples
2. Answer CS theory questions (algorithms, data structures, OS, networks, etc.)
3. Guide students through problem-solving (use Socratic method when appropriate)
4. Recommend learning resources and next steps
5. Provide encouragement and motivation

Guidelines:
- Use simple analogies and real-world examples
- Break complex topics into digestible parts
- Provide code examples when helpful
- Be encouraging but honest about areas for improvement
- If asked about something outside CS, politely redirect to CS topics
- Reference the user's roadmap progress when relevant

Format your responses with:
- Clear headings for different sections
- Code blocks for code examples
- Bullet points for lists
- Emojis sparingly for engagement

Remember: You're a patient tutor, not just an information source.`;

export class LearningCompanionAgent extends BaseAgent {
  constructor() {
    super(
      "learning",
      "CS learning and concept explanation",
      getLearningModel()
    );
    this.setSystemPrompt(LEARNING_SYSTEM_PROMPT);
  }

  /**
   * Process a learning-related query
   * @param {string} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} Agent response
   */
  async process(message, context = {}) {
    const {
      history = [],
      language = "en",
      currentRoadmap,
      currentQuest,
    } = context;

    try {
      // Add context about user's learning progress
      let contextPrompt = "";
      if (currentRoadmap) {
        contextPrompt += `\nUser's current roadmap: ${
          currentRoadmap.title || "Unknown"
        }`;
      }
      if (currentQuest) {
        contextPrompt += `\nUser's active quest: ${
          currentQuest.name || "Unknown"
        }`;
      }

      const enhancedPrompt = contextPrompt
        ? this.systemPrompt + "\n\nCurrent Context:" + contextPrompt
        : this.systemPrompt;

      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);
      const response = await this.model.invoke(messages);

      return this.formatResponse(this.safeExtractContent(response), {
        language,
        topic: this.extractTopic(message),
      });
    } catch (error) {
      logger.error("Learning agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          : "Sorry, I encountered an issue. Please try again.",
        { error: true }
      );
    }
  }

  /**
   * Extract the main topic from a learning query
   */
  extractTopic(message) {
    // Simple extraction - can be enhanced with NLP
    const keywords = message
      .toLowerCase()
      .match(
        /(javascript|python|java|react|node|algorithm|data structure|array|loop|function|class|oop|database|sql|api|git|html|css)/i
      );
    return keywords ? keywords[0] : null;
  }
}

export default LearningCompanionAgent;
