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
    const { history = [], language = "en", clerkId } = context;

    try {
      // Get user's roadmaps for context
      let roadmapContext = "";
      if (clerkId) {
        await connect();
        const roadmaps = await Roadmap.find({ author: clerkId }).limit(5);

        if (roadmaps.length > 0) {
          roadmapContext = `\n\nUser's roadmaps:\n${roadmaps
            .map((r) => {
              const completed =
                r.steps?.filter((s) => s.completed)?.length || 0;
              const total = r.steps?.length || 0;
              return `- ${r.title}: ${completed}/${total} steps completed`;
            })
            .join("\n")}`;
        }
      }

      const enhancedPrompt = this.systemPrompt + roadmapContext;
      this.setSystemPrompt(enhancedPrompt);

      const messages = this.buildMessages(message, history, language);
      const response = await this.model.invoke(messages);

      return this.formatResponse(this.safeExtractContent(response), {
        language,
        hasRoadmaps: roadmapContext.length > 0,
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
