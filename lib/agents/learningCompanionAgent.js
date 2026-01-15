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
import { learningTools } from "./tools/learningTools";
import { ToolMessage } from "@langchain/core/messages";

const LEARNING_SYSTEM_PROMPT = `You are a friendly and knowledgeable CS learning companion for the Inherit platform.

Your role is to:
1. Explain programming concepts clearly with examples
2. Answer CS theory questions (algorithms, data structures, OS, networks, etc.)
3. Guide students through problem-solving (use Socratic method when appropriate)
4. Recommend learning resources and next steps
5. Provide encouragement and motivation

You have access to the following tools:
- explain_concept: Explain a concept with analogies, examples, and different difficulty levels
- create_learning_path: Generate a structured learning roadmap with phases and milestones
- generate_practice: Create practice exercises with hints and test cases
- break_down_topic: Decompose complex topics into manageable subtopics
- suggest_resources: Recommend docs, videos, courses, and practice platforms

Use these tools to provide comprehensive learning support. When users ask for explanations, use explain_concept. When they need a learning plan, use create_learning_path. When they want practice, use generate_practice.

Guidelines:
- Use simple analogies and real-world examples
- Break complex topics into digestible parts
- Provide code examples when helpful
- Be encouraging but honest about areas for improvement
- If asked about something outside CS, politely redirect to CS topics
- Reference the user's roadmap progress when relevant

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
      userName,
      userContext,
      contextSummary,
      currentRoadmap,
      currentQuest,
    } = context;

    logger.info("LearningCompanionAgent received context", {
      hasUserName: !!userName,
      userName,
      hasUserContext: !!userContext,
      hasContextSummary: !!contextSummary,
      hasCurrentRoadmap: !!currentRoadmap,
      hasCurrentQuest: !!currentQuest,
      language,
    });

    try {
      // Bind tools to the model
      const modelWithTools = this.bindTools(learningTools);

      // Build comprehensive context
      let fullContext = "";
      
      // Add user name for personalization
      if (userName && userName !== "there") {
        fullContext += `\n\nUser's name: ${userName}. Address them by name and be encouraging.`;
      }
      
      // Add full user context summary
      if (contextSummary) {
        fullContext += `\n\n--- USER'S LEARNING PROFILE ---\n${contextSummary}\n--- END PROFILE ---`;
      }
      
      // Add specific roadmap/quest context
      if (currentRoadmap) {
        fullContext += `\nActive Roadmap: ${currentRoadmap.title || "Unknown"} - Progress: ${currentRoadmap.progress || 0}%`;
      }
      if (currentQuest) {
        fullContext += `\nActive Quest: ${currentQuest.name || "Unknown"}`;
      }

      const enhancedPrompt = fullContext
        ? this.systemPrompt + "\n\nCurrent Context:" + fullContext
        : this.systemPrompt;

      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);
      const response = await modelWithTools.invoke(messages);

      // Check if model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute the tools
        const toolResults = await this.executeTools(
          response.tool_calls, 
          learningTools
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
        const finalMessages = [
          ...messages,
          response,
          ...toolMessages,
        ];

        const finalResponse = await modelWithTools.invoke(finalMessages);

        const finalContent = this.safeExtractContent(finalResponse);
        return this.formatResponse(finalContent, {
          language,
          topic: this.extractTopic(message),
          usedTools: response.tool_calls.map(tc => tc.name),
        });
      }

      // No tool calls, just return the response
      const content = this.safeExtractContent(response);
      return this.formatResponse(content, {
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
