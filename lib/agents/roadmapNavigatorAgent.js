// Roadmap Navigator Agent

/**
 * Roadmap Navigator Agent
 *
 * Helps users navigate their learning roadmaps, track progress,
 * and get suggestions for next steps.
 */

import { BaseAgent } from "./baseAgent";
import { getTaskModel } from "../gemini";
import { connect } from "../mongodb/mongoose";
import Roadmap from "../models/roadmapModel";
import logger from "@/lib/logger";

const ROADMAP_SYSTEM_PROMPT = `You are a learning path navigator for CS students on the Inherit platform.

Your role is to:
1. Help users understand their current roadmap progress
2. Suggest next topics to study based on their progress
3. Explain how topics connect and build on each other
4. Provide career guidance related to their chosen path
5. Recommend resources for each topic

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
    });

    try {
      // Build comprehensive context
      let fullContext = "";
      
      // Add user name for personalization
      if (userName && userName !== "there") {
        fullContext += `\n\nUser's name: ${userName}. Address them by name.`;
      }
      
      // Add full user context summary
      if (contextSummary) {
        fullContext += `\n\n--- USER'S FULL PROFILE ---\n${contextSummary}\n--- END PROFILE ---`;
      }
      
      // Get user's roadmaps for additional context
      if (clerkId) {
        await connect();
        const roadmaps = await Roadmap.find({ author: clerkId }).limit(5);

        if (roadmaps.length > 0) {
          fullContext += `\n\nUser's roadmaps (${roadmaps.length} total):\n${roadmaps
            .map((r) => {
              const completed =
                r.steps?.filter((s) => s.completed)?.length || 0;
              const total = r.steps?.length || 0;
              return `- "${r.title}": ${completed}/${total} steps completed (${total > 0 ? Math.round(completed/total*100) : 0}%)`;
            })
            .join("\n")}`;
        } else {
          fullContext += `\n\nUser has no roadmaps yet. Help them get started!`;
        }
      }

      const enhancedPrompt = this.systemPrompt + fullContext;
      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);
      const response = await this.model.invoke(messages);

      return this.formatResponse(this.safeExtractContent(response), {
        language,
        hasRoadmaps: fullContext.includes("User's roadmaps"),
      });
    } catch (error) {
      logger.error("Roadmap navigator agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, রোডম্যাপ তথ্য পেতে সমস্যা হয়েছে।"
          : "Sorry, I had trouble accessing roadmap information.",
        { error: true }
      );
    }
  }
}

export default RoadmapNavigatorAgent;
