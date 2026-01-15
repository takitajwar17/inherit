/**
 * Navigation Tools
 * 
 * LangChain tools for frontend navigation commands.
 * Returns structured JSON that the frontend intercepts to trigger route changes.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import logger from "@/lib/logger";

// Valid routes in the application
const VALID_ROUTES = {
  dashboard: "/dashboard",
  roadmaps: "/roadmaps",
  tasks: "/tasks",
  quests: "/quests",
  playground: "/playground",
  learn: "/learn",
  "dev-discuss": "/dev-discuss",
  faq: "/faq",
  settings: "/settings",
};

// Route descriptions for the AI to understand context
const ROUTE_DESCRIPTIONS = {
  dashboard: "User's personal dashboard with overview of progress, stats, and recent activity",
  roadmaps: "AI-generated learning roadmaps and paths for studying CS topics",
  tasks: "Task management page for assignments, to-dos, and deadlines",
  quests: "Coding challenges and quests to practice programming skills",
  playground: "Code editor and playground for writing and running code",
  learn: "Video tutorials and learning content",
  "dev-discuss": "Community discussions and Q&A forum",
  faq: "Frequently asked questions and help documentation",
  settings: "User account settings and preferences",
};

/**
 * Tool: Navigate to a route
 * Returns a JSON action for the frontend to handle
 */
export const mapsToTool = new DynamicStructuredTool({
  name: "maps_to",
  description: `Navigate the user to a different page in the application. Use this when the user says things like "go to my dashboard", "show me my tasks", "take me to roadmaps", "open the playground", etc. Available destinations: ${Object.keys(VALID_ROUTES).join(", ")}`,
  schema: z.object({
    destination: z.enum([
      "dashboard",
      "roadmaps", 
      "tasks",
      "quests",
      "playground",
      "learn",
      "dev-discuss",
      "faq",
      "settings",
    ]).describe("The page to navigate to"),
    reason: z.string().optional().describe("Brief explanation of why navigating here"),
  }),
  func: async ({ destination, reason }) => {
    try {
      const route = VALID_ROUTES[destination];
      
      if (!route) {
        logger.warn("Invalid navigation destination", { destination });
        return JSON.stringify({
          success: false,
          message: `I don't recognize "${destination}" as a valid page. Available pages are: ${Object.keys(VALID_ROUTES).join(", ")}`,
        });
      }

      logger.info("Navigation tool triggered", { destination, route, reason });

      return JSON.stringify({
        success: true,
        action: "navigate",
        route: route,
        destination: destination,
        description: ROUTE_DESCRIPTIONS[destination],
        message: `Taking you to ${destination}...`,
      });
    } catch (error) {
      logger.error("Navigation tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to navigate: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Get available routes
 * Helps the AI understand what pages are available
 */
export const getAvailableRoutesTool = new DynamicStructuredTool({
  name: "get_available_routes",
  description: "Get a list of all available pages/routes the user can navigate to. Use this when unsure where to direct the user or to provide navigation options.",
  schema: z.object({}),
  func: async () => {
    try {
      const routes = Object.entries(VALID_ROUTES).map(([name, path]) => ({
        name,
        path,
        description: ROUTE_DESCRIPTIONS[name],
      }));

      return JSON.stringify({
        success: true,
        routes,
        message: "Here are all the available pages you can navigate to.",
      });
    } catch (error) {
      logger.error("Get available routes tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to get routes: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Open specific roadmap
 * Navigate to a specific roadmap by ID
 */
export const openRoadmapTool = new DynamicStructuredTool({
  name: "open_roadmap",
  description: "Open a specific roadmap by its ID. Use this when the user wants to view a particular learning roadmap.",
  schema: z.object({
    roadmapId: z.string().describe("The ID of the roadmap to open"),
    title: z.string().optional().describe("The title of the roadmap for confirmation"),
  }),
  func: async ({ roadmapId, title }) => {
    try {
      if (!roadmapId) {
        return JSON.stringify({
          success: false,
          message: "Please specify which roadmap you'd like to open.",
        });
      }

      logger.info("Open roadmap tool triggered", { roadmapId, title });

      return JSON.stringify({
        success: true,
        action: "navigate",
        route: `/roadmaps/${roadmapId}`,
        destination: "roadmap_detail",
        message: title 
          ? `Opening your "${title}" roadmap...` 
          : "Opening the roadmap...",
      });
    } catch (error) {
      logger.error("Open roadmap tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to open roadmap: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Open specific quest
 * Navigate to a specific quest by ID
 */
export const openQuestTool = new DynamicStructuredTool({
  name: "open_quest",
  description: "Open a specific coding quest by its ID. Use this when the user wants to start or continue a particular quest.",
  schema: z.object({
    questId: z.string().describe("The ID of the quest to open"),
    name: z.string().optional().describe("The name of the quest for confirmation"),
  }),
  func: async ({ questId, name }) => {
    try {
      if (!questId) {
        return JSON.stringify({
          success: false,
          message: "Please specify which quest you'd like to open.",
        });
      }

      logger.info("Open quest tool triggered", { questId, name });

      return JSON.stringify({
        success: true,
        action: "navigate",
        route: `/quests/${questId}`,
        destination: "quest_detail",
        message: name 
          ? `Opening the "${name}" quest...` 
          : "Opening the quest...",
      });
    } catch (error) {
      logger.error("Open quest tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to open quest: ${error.message}`,
      });
    }
  },
});

// Export all navigation tools
export const navigationTools = [
  mapsToTool,
  getAvailableRoutesTool,
  openRoadmapTool,
  openQuestTool,
];

export default navigationTools;

