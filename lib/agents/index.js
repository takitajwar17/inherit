// Agent Index Module

/**
 * Agent Index
 *
 * Exports all agents and provides initialization function.
 */

import { getOrchestrator, AgentTypes } from "./agentOrchestrator";
import LearningCompanionAgent from "./learningCompanionAgent";
import TaskManagerAgent from "./taskManagerAgent";
import CodeAssistantAgent from "./codeAssistantAgent";
import RoadmapNavigatorAgent from "./roadmapNavigatorAgent";
import GeneralAgent from "./generalAgent";

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

  // Build the graph
  orchestrator.buildGraph();

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

export {
  AgentTypes,
  LearningCompanionAgent,
  TaskManagerAgent,
  CodeAssistantAgent,
  RoadmapNavigatorAgent,
  GeneralAgent,
};
