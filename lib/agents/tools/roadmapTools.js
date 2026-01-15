/**
 * Roadmap Tools
 * 
 * LangChain tools for roadmap creation and management.
 * Outputs structured JSON for frontend rendering of visual roadmap components.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { connect } from "@/lib/mongodb/mongoose";
import Roadmap from "@/lib/models/roadmapModel";
import User from "@/lib/models/userModel";
import logger from "@/lib/logger";

/**
 * Tool: Create a learning roadmap
 * Generates a structured roadmap that the UI can render visually
 */
export const createRoadmapTool = new DynamicStructuredTool({
  name: "create_roadmap",
  description: "Create a new learning roadmap for a CS/programming topic. Use this when the user asks to 'create a roadmap for...', 'make me a learning path for...', or 'help me learn...'. The roadmap will be structured with phases and tasks.",
  schema: z.object({
    title: z.string().min(3).max(100).describe("Title of the roadmap (e.g., 'Learn React in 30 Days')"),
    topic: z.string().describe("The main topic/technology to learn"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner").describe("Difficulty level"),
    phases: z.array(z.object({
      name: z.string().describe("Phase name (e.g., 'Foundation', 'Core Concepts')"),
      tasks: z.array(z.string()).describe("List of specific learning tasks/topics in this phase"),
      duration: z.string().describe("Estimated duration (e.g., '1 week', '3 days')"),
    })).min(2).max(8).describe("Learning phases with tasks and duration"),
    description: z.string().optional().describe("Brief description of the roadmap"),
  }),
  func: async ({ title, topic, difficulty, phases, description }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Please log in to create a roadmap.",
        });
      }

      await connect();

      // Get user info
      const user = await User.findOne({ clerkId });
      if (!user) {
        return JSON.stringify({
          success: false,
          message: "User not found. Please make sure you're logged in.",
        });
      }

      logger.info("Creating roadmap via tool", { 
        title, 
        topic, 
        difficulty, 
        phaseCount: phases.length,
        clerkId,
      });

      // Convert phases to the steps format used by the Roadmap model
      const steps = [];
      let stepNumber = 1;
      
      for (const phase of phases) {
        for (const task of phase.tasks) {
          steps.push({
            step: stepNumber++,
            topic: task,
            description: `Part of ${phase.name} phase`,
            phase: phase.name,
            duration: phase.duration,
            completed: false,
          });
        }
      }

      // Create the roadmap in the database
      const roadmap = await Roadmap.create({
        title,
        prompt: topic,
        description: description || `A ${difficulty} roadmap to learn ${topic}`,
        author: user.userName,
        clerkId,
        content: { steps },
        difficulty,
        topic,
        status: "in-progress",
        progress: 0,
      });

      logger.info("Roadmap created successfully", {
        roadmapId: roadmap._id,
        title,
        stepCount: steps.length,
      });

      // Return structured response for UI rendering
      return JSON.stringify({
        success: true,
        action: "render_roadmap",
        roadmap: {
          id: roadmap._id.toString(),
          title,
          topic,
          difficulty,
          description: description || `A ${difficulty} roadmap to learn ${topic}`,
          phases: phases,
          totalSteps: steps.length,
          progress: 0,
        },
        message: `Created your "${title}" roadmap with ${phases.length} phases and ${steps.length} learning steps!`,
      });
    } catch (error) {
      logger.error("Create roadmap tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to create roadmap: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Get user's roadmaps
 * Retrieves all roadmaps for the current user
 */
export const getUserRoadmapsTool = new DynamicStructuredTool({
  name: "get_user_roadmaps",
  description: "Get a list of the user's existing learning roadmaps. Use this when the user asks 'show me my roadmaps', 'what roadmaps do I have', or wants to see their learning paths.",
  schema: z.object({
    status: z.enum(["all", "in-progress", "completed"]).default("all").describe("Filter by roadmap status"),
    limit: z.number().default(10).describe("Maximum number of roadmaps to return"),
  }),
  func: async ({ status, limit }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Please log in to view your roadmaps.",
        });
      }

      await connect();

      const user = await User.findOne({ clerkId });
      if (!user) {
        return JSON.stringify({
          success: false,
          message: "User not found.",
        });
      }

      const filter = { author: user.userName };
      if (status !== "all") {
        filter.status = status;
      }

      const roadmaps = await Roadmap.find(filter)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select("title topic difficulty status progress content createdAt");

      const roadmapList = roadmaps.map(r => ({
        id: r._id.toString(),
        title: r.title,
        topic: r.topic,
        difficulty: r.difficulty,
        status: r.status,
        progress: r.progress || 0,
        stepCount: r.content?.steps?.length || 0,
        createdAt: r.createdAt?.toISOString(),
      }));

      logger.info("User roadmaps fetched", {
        clerkId,
        count: roadmapList.length,
        status,
      });

      return JSON.stringify({
        success: true,
        roadmaps: roadmapList,
        count: roadmapList.length,
        message: `Found ${roadmapList.length} roadmap${roadmapList.length !== 1 ? 's' : ''}${status !== 'all' ? ` (${status})` : ''}.`,
      });
    } catch (error) {
      logger.error("Get user roadmaps tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to get roadmaps: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Get roadmap details
 * Retrieves detailed information about a specific roadmap
 */
export const getRoadmapDetailsTool = new DynamicStructuredTool({
  name: "get_roadmap_details",
  description: "Get detailed information about a specific roadmap including all phases and steps. Use this when the user asks about a particular roadmap's content.",
  schema: z.object({
    roadmapId: z.string().describe("The ID of the roadmap to get details for"),
  }),
  func: async ({ roadmapId }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Please log in to view roadmap details.",
        });
      }

      await connect();

      const roadmap = await Roadmap.findById(roadmapId);

      if (!roadmap) {
        return JSON.stringify({
          success: false,
          message: "Roadmap not found.",
        });
      }

      // Group steps by phase
      const phases = {};
      for (const step of roadmap.content?.steps || []) {
        const phaseName = step.phase || "General";
        if (!phases[phaseName]) {
          phases[phaseName] = {
            name: phaseName,
            tasks: [],
            duration: step.duration || "Flexible",
          };
        }
        phases[phaseName].tasks.push({
          step: step.step,
          topic: step.topic,
          description: step.description,
          completed: step.completed || false,
        });
      }

      const completedSteps = (roadmap.content?.steps || []).filter(s => s.completed).length;
      const totalSteps = (roadmap.content?.steps || []).length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return JSON.stringify({
        success: true,
        action: "render_roadmap",
        roadmap: {
          id: roadmap._id.toString(),
          title: roadmap.title,
          topic: roadmap.topic,
          difficulty: roadmap.difficulty,
          description: roadmap.description,
          phases: Object.values(phases),
          totalSteps,
          completedSteps,
          progress,
          status: roadmap.status,
          createdAt: roadmap.createdAt?.toISOString(),
        },
        message: `"${roadmap.title}" - ${progress}% complete (${completedSteps}/${totalSteps} steps)`,
      });
    } catch (error) {
      logger.error("Get roadmap details tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to get roadmap details: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Update roadmap progress
 * Marks steps as completed in a roadmap
 */
export const updateRoadmapProgressTool = new DynamicStructuredTool({
  name: "update_roadmap_progress",
  description: "Mark a step in a roadmap as completed. Use this when the user says they've finished a topic or completed a learning step.",
  schema: z.object({
    roadmapId: z.string().describe("The ID of the roadmap"),
    stepNumber: z.number().describe("The step number to mark as completed"),
    completed: z.boolean().default(true).describe("Whether the step is completed"),
  }),
  func: async ({ roadmapId, stepNumber, completed }, config) => {
    try {
      const clerkId = config?.configurable?.clerkId;
      
      if (!clerkId) {
        return JSON.stringify({
          success: false,
          message: "Please log in to update your progress.",
        });
      }

      await connect();

      const roadmap = await Roadmap.findById(roadmapId);

      if (!roadmap) {
        return JSON.stringify({
          success: false,
          message: "Roadmap not found.",
        });
      }

      // Find and update the step
      const stepIndex = roadmap.content?.steps?.findIndex(s => s.step === stepNumber);
      
      if (stepIndex === -1 || stepIndex === undefined) {
        return JSON.stringify({
          success: false,
          message: `Step ${stepNumber} not found in this roadmap.`,
        });
      }

      roadmap.content.steps[stepIndex].completed = completed;
      roadmap.content.steps[stepIndex].completedAt = completed ? new Date() : null;

      // Recalculate progress
      const completedSteps = roadmap.content.steps.filter(s => s.completed).length;
      const totalSteps = roadmap.content.steps.length;
      roadmap.progress = Math.round((completedSteps / totalSteps) * 100);

      // Update status if all completed
      if (completedSteps === totalSteps) {
        roadmap.status = "completed";
      } else if (completedSteps > 0) {
        roadmap.status = "in-progress";
      }

      await roadmap.save();

      const stepTopic = roadmap.content.steps[stepIndex].topic;

      logger.info("Roadmap progress updated", {
        roadmapId,
        stepNumber,
        completed,
        progress: roadmap.progress,
      });

      return JSON.stringify({
        success: true,
        roadmapId: roadmap._id.toString(),
        stepNumber,
        stepTopic,
        completed,
        progress: roadmap.progress,
        status: roadmap.status,
        message: completed 
          ? `Great job! Marked "${stepTopic}" as completed. You're now at ${roadmap.progress}% progress!`
          : `Marked "${stepTopic}" as incomplete.`,
      });
    } catch (error) {
      logger.error("Update roadmap progress tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to update progress: ${error.message}`,
      });
    }
  },
});

// Export all roadmap tools
export const roadmapTools = [
  createRoadmapTool,
  getUserRoadmapsTool,
  getRoadmapDetailsTool,
  updateRoadmapProgressTool,
];

export default roadmapTools;

