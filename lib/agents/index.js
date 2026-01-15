// Agent Index Module

/**
 * Agent Index
 *
 * Exports all agents, tools, and provides initialization function.
 */

import { getOrchestrator } from "./agentOrchestrator";
import { AgentTypes } from "./routerAgent";
import LearningCompanionAgent from "./learningCompanionAgent";
import TaskManagerAgent from "./taskManagerAgent";
import CodeAssistantAgent from "./codeAssistantAgent";
import RoadmapNavigatorAgent from "./roadmapNavigatorAgent";
import GeneralAgent from "./generalAgent";

// Tool exports
import { taskTools } from "./tools/taskTools";
import { contextTools } from "./tools/contextTools";
import { navigationTools } from "./tools/navigationTools";
import { roadmapTools } from "./tools/roadmapTools";

/**
 * Initialize the orchestrator with all agents
 * Call this once when the application starts
 */
export function initializeAgents() {
  const orchestrator = getOrchestrator();

  // Register all specialized agents
  orchestrator.registerAgent(AgentTypes.LEARNING, new LearningCompanionAgent());
  orchestrator.registerAgent(AgentTypes.TASK, new TaskManagerAgent());
  orchestrator.registerAgent(AgentTypes.CODE, new CodeAssistantAgent());
  orchestrator.registerAgent(AgentTypes.ROADMAP, new RoadmapNavigatorAgent());
  orchestrator.registerAgent(AgentTypes.GENERAL, new GeneralAgent());

  // Note: Graph is built lazily on first message to avoid initialization overhead
  // See agentOrchestrator.js processMessage() method

  return orchestrator;
}

// Singleton initialized orchestrator
let initializedOrchestrator = null;

/**
 * Get the initialized orchestrator
 * Lazy initialization on first call
 */
export function getInitializedOrchestrator() {
  if (!initializedOrchestrator) {
    initializedOrchestrator = initializeAgents();
  }
  return initializedOrchestrator;
}

// Agent exports
export {
  AgentTypes,
  LearningCompanionAgent,
  TaskManagerAgent,
  CodeAssistantAgent,
  RoadmapNavigatorAgent,
  GeneralAgent,
};

// Tool exports
export {
  taskTools,
  contextTools,
  navigationTools,
  roadmapTools,
};

// All tools combined
export const allTools = [
  ...taskTools,
  ...contextTools,
  ...navigationTools,
  ...roadmapTools,
];
