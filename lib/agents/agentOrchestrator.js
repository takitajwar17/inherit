// Agent Orchestrator - LangGraph Multi-Agent System

/**
 * Agent Orchestrator
 *
 * LangGraph-based multi-agent orchestration system.
 * Routes messages through the router agent to specialized agents.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { RouterAgent, AgentTypes } from "./routerAgent";

// Graph state schema
const createGraphState = () => ({
  messages: [],
  currentAgent: null,
  routingDecision: null,
  response: null,
  language: "en",
  context: {},
});

/**
 * Agent Orchestrator using LangGraph
 * Manages multi-agent workflow and state
 */
export class AgentOrchestrator {
  constructor() {
    this.router = new RouterAgent();
    this.agents = new Map();
    this.graph = null;
  }

  /**
   * Register a specialized agent
   * @param {string} type - Agent type from AgentTypes
   * @param {BaseAgent} agent - Agent instance
   */
  registerAgent(type, agent) {
    this.agents.set(type, agent);
  }

  /**
   * Get registered agent by type
   * @param {string} type - Agent type
   * @returns {BaseAgent|null} Agent instance
   */
  getAgent(type) {
    return this.agents.get(type) || null;
  }

  /**
   * Build the LangGraph workflow
   */
  buildGraph() {
    // Define the graph nodes
    const routeNode = async (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") {
        return { ...state, currentAgent: AgentTypes.GENERAL };
      }

      const decision = await this.router.process(
        lastMessage.content,
        state.context
      );

      return {
        ...state,
        routingDecision: decision,
        currentAgent: decision.agent,
      };
    };

    const processNode = async (state) => {
      const agent = this.getAgent(state.currentAgent);

      if (!agent) {
        return {
          ...state,
          response: {
            agent: "system",
            content:
              "I'm sorry, I couldn't process that request. Please try again.",
            error: true,
          },
        };
      }

      const lastMessage = state.messages[state.messages.length - 1];
      const result = await agent.process(lastMessage.content, {
        history: state.messages.slice(0, -1),
        language: state.language,
        ...state.context,
      });

      return {
        ...state,
        response: result,
      };
    };

    // Build the graph
    const workflow = new StateGraph({
      channels: {
        messages: { value: (a, b) => b || a, default: () => [] },
        currentAgent: { value: (a, b) => b || a, default: () => null },
        routingDecision: { value: (a, b) => b || a, default: () => null },
        response: { value: (a, b) => b || a, default: () => null },
        language: { value: (a, b) => b || a, default: () => "en" },
        context: { value: (a, b) => ({ ...a, ...b }), default: () => ({}) },
      },
    });

    // Add nodes
    workflow.addNode("route", routeNode);
    workflow.addNode("process", processNode);

    // Add edges
    workflow.addEdge(START, "route");
    workflow.addEdge("route", "process");
    workflow.addEdge("process", END);

    this.graph = workflow.compile();
  }

  /**
   * Process a message through the multi-agent system
   * @param {string} message - User message
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Agent response
   */
  async processMessage(message, options = {}) {
    const { history = [], language = "en", context = {} } = options;

    // Build graph if not already built
    if (!this.graph) {
      this.buildGraph();
    }

    // Prepare initial state
    const initialState = {
      messages: [...history, { role: "user", content: message }],
      language,
      context,
      currentAgent: null,
      routingDecision: null,
      response: null,
    };

    // Run the graph
    const result = await this.graph.invoke(initialState);

    return {
      response: result.response,
      routedTo: result.currentAgent,
      routing: result.routingDecision,
    };
  }
}

// Singleton instance
let orchestratorInstance = null;

/**
 * Get the orchestrator singleton
 * @returns {AgentOrchestrator} Orchestrator instance
 */
export function getOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

export default AgentOrchestrator;
