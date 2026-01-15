// General Agent

/**
 * General Agent
 *
 * Handles general conversation, greetings, motivation,
 * and anything that doesn't fit other specialized agents.
 * Equipped with context and navigation tools.
 */

import { BaseAgent } from "./baseAgent";
import { getLearningModel } from "../gemini";
import { getMessage } from "@/lib/i18n/agentMessages";
import logger from "@/lib/logger";
import { contextTools } from "./tools/contextTools";
import { navigationTools } from "./tools/navigationTools";
import { ToolMessage } from "@langchain/core/messages";

const GENERAL_SYSTEM_PROMPT = `You are a friendly AI companion for CS students on the Inherit learning platform.

Your role is to:
1. Greet users warmly and maintain friendly conversation
2. Provide motivation and encouragement for learning
3. Answer general questions about the platform
4. Help users who seem lost or confused
5. Be a supportive presence in their learning journey

You have access to the following tools:
- fetch_user_context: Get the user's progress, statistics, and activity data. Use when they ask about "my progress", "how am I doing", "my roadmaps", etc.
- get_user_stats: Get a quick summary of user statistics.
- maps_to: Navigate the user to a different page. Use when they say "go to dashboard", "show me tasks", "take me to roadmaps", etc.
- get_available_routes: Get a list of all available pages to navigate to.
- open_roadmap: Open a specific roadmap by ID.
- open_quest: Open a specific quest by ID.

Platform features you can mention:
- Learning videos and tutorials (/learn)
- AI-generated learning roadmaps (/roadmaps)
- Coding quests and challenges (/quests)
- Task management for assignments (/tasks)
- Community discussions (/dev-discuss)
- Code playground (/playground)

Personality traits:
- Friendly and approachable
- Encouraging but not pushy
- Helpful and patient
- Occasionally uses appropriate humor
- Celebrates user achievements

IMPORTANT FORMATTING:
- Use GitHub-flavored Markdown for all responses
- Use ### for section headers
- Use tables (|) for structured data
- Use > [!INFO] style callouts for key insights
- Keep responses concise and well-formatted

If a user seems stressed or overwhelmed:
- Acknowledge their feelings
- Suggest taking breaks
- Remind them learning is a journey
- Offer to help break down tasks

Keep responses concise and warm. Use emojis sparingly but effectively.`;

// Combine tools for this agent
const generalAgentTools = [...contextTools, ...navigationTools];

export class GeneralAgent extends BaseAgent {
  constructor() {
    super(
      "general",
      "General conversation and platform guidance",
      getLearningModel()
    );
    this.setSystemPrompt(GENERAL_SYSTEM_PROMPT);
    this.tools = generalAgentTools;
  }

  /**
   * Process a general query
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

    // Debug logging
    logger.info("GeneralAgent received context", {
      hasUserName: !!userName,
      userName: userName,
      hasClerkId: !!clerkId,
      hasUserContext: !!userContext,
      hasTasks: userContext?.tasks?.total > 0,
      hasRoadmaps: userContext?.roadmaps?.total > 0,
      hasQuests: userContext?.quests?.total > 0,
      language: language,
      messagePreview: message.substring(0, 50),
    });

    try {
      // Build rich personalized system prompt
      let personalizedPrompt = this.systemPrompt;
      
      if (userName && typeof userName === 'string' && userName.trim() && userName !== 'there') {
        personalizedPrompt += `\n\nIMPORTANT: The user's name is ${userName}. Use their name naturally in greetings and responses.`;
        
        if (contextSummary && contextSummary.trim()) {
          personalizedPrompt += `\n\nUser Context Summary:\n${contextSummary}`;
          personalizedPrompt += `\n\nUse this context to provide personalized responses. You can also use the fetch_user_context tool for more detailed data.`;
        }
        
        logger.info("Using personalized prompt with full context", {
          userName: userName,
          hasContext: !!contextSummary,
          contextLength: contextSummary?.length || 0,
          tasksCount: userContext?.tasks?.total || 0,
          roadmapsCount: userContext?.roadmaps?.total || 0,
        });
      }

      // Bind tools to the model
      const modelWithTools = this.bindTools(this.tools);

      // Store original and set personalized prompt
      const originalPrompt = this.systemPrompt;
      this.setSystemPrompt(personalizedPrompt);

      const messages = this.buildMessages(message, history, language);
      
      logger.debug("Built conversation messages", {
        messageCount: messages.length,
        systemPromptLength: personalizedPrompt.length,
        toolsCount: this.tools.length,
      });

      // First model call
      const response = await modelWithTools.invoke(messages, {
        configurable: { clerkId }
      });

      // Check if model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        logger.info("GeneralAgent executing tools", {
          toolCalls: response.tool_calls.map(tc => tc.name),
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
        const finalMessages = [
          ...messages,
          response,
          ...toolMessages,
        ];

        const finalResponse = await modelWithTools.invoke(finalMessages, {
          configurable: { clerkId }
        });

        // Restore original prompt
        this.setSystemPrompt(originalPrompt);

        let content = this.safeExtractContent(finalResponse);
        
        // Include tool results in response metadata
        const toolResultsData = toolResults
          .filter(r => r.success)
          .map(r => {
            try {
              return JSON.parse(r.result);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        return this.formatResponse(content, {
          language,
          type: this.getResponseType(message),
          usedTools: response.tool_calls.map(tc => tc.name),
          toolResults: toolResultsData,
        });
      }

      // Restore original prompt
      this.setSystemPrompt(originalPrompt);

      const content = this.safeExtractContent(response);

      logger.info("General agent response generated", {
        responseLength: content.length,
        responsePreview: content.substring(0, 100),
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
        userName: userName,
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
    if (
      lower.includes("go to") ||
      lower.includes("show me") ||
      lower.includes("take me") ||
      lower.includes("navigate") ||
      lower.includes("open")
    ) {
      return "navigation";
    }
    if (
      lower.includes("progress") ||
      lower.includes("how am i") ||
      lower.includes("my roadmaps") ||
      lower.includes("my tasks") ||
      lower.includes("my stats")
    ) {
      return "status";
    }
    return "general";
  }
}

export default GeneralAgent;
