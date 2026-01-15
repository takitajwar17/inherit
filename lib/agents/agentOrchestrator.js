// Agent Orchestrator - LangGraph Multi-Agent System

/**
 * Agent Orchestrator
 *
 * LangGraph-based multi-agent orchestration system.
 * Routes messages through the router agent to specialized agents.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { RouterAgent, AgentTypes } from "./routerAgent";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/responseCache";
import { recordRequest } from "@/lib/metrics/agentMetrics";
import logger from "@/lib/logger";


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
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:routeNode',message:'routeNode entered',data:{hasContext:!!state.context,contextKeys:state.context?Object.keys(state.context):[],hasClerkId:!!state.context?.clerkId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
      } catch (error) {
        logger.error("Route node error", {
          error: error.message,
          stack: error.stack,
        });
        // Fallback to general agent on routing error
        return {
          ...state,
          currentAgent: AgentTypes.GENERAL,
          routingDecision: {
            agent: AgentTypes.GENERAL,
            confidence: 0.3,
            reasoning: "Routing error occurred",
          },
        };
      }
    };

    const processNode = async (state) => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:processNode',message:'processNode entered',data:{hasContext:!!state.context,contextKeys:state.context?Object.keys(state.context):[],hasClerkId:!!state.context?.clerkId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
        
        // Ensure context is properly passed - merge state.context with defaults
        const agentContext = {
          history: state.messages.slice(0, -1),
          language: state.language || "en",
          ...(state.context || {}), // Spread context if it exists
        };

        logger.debug("Process node - passing context to agent", {
          agent: state.currentAgent,
          hasContext: !!state.context,
          contextKeys: state.context ? Object.keys(state.context) : [],
          hasUserName: !!state.context?.userName,
          hasUserContext: !!state.context?.userContext,
          hasClerkId: !!state.context?.clerkId,
        });

        const result = await agent.process(lastMessage.content, agentContext);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:processNodeAfter',message:'processNode after agent.process',data:{agent:state.currentAgent,hasContext:!!state.context,contextKeys:state.context?Object.keys(state.context):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // Ensure the response has the expected structure
        const safeResult = {
          agent: result?.agent || state.currentAgent || "general",
          content:
            typeof result?.content === "string"
              ? result.content
              : String(result?.content || ""),
          timestamp: result?.timestamp || new Date().toISOString(),
          ...(result || {}),
        };

        return {
          ...state,
          response: safeResult,
        };
      } catch (error) {
        logger.error("Process node error", {
          error: error.message,
          stack: error.stack,
          agent: state.currentAgent,
        });
        return {
          ...state,
          response: {
            agent: "system",
            content:
              "I encountered an issue processing your request. Please try again.",
            error: true,
            timestamp: new Date().toISOString(),
          },
        };
      }
    };

    // Build the graph
    const workflow = new StateGraph({
      channels: {
        messages: { value: (a, b) => b || a, default: () => [] },
        currentAgent: { value: (a, b) => b || a, default: () => null },
        routingDecision: { value: (a, b) => b || a, default: () => null },
        response: { value: (a, b) => b || a, default: () => null },
        language: { value: (a, b) => b || a, default: () => "en" },
        context: { 
          value: (a, b) => {
            // Merge context objects, preserving all properties
            const merged = { ...(a || {}), ...(b || {}) };
            return Object.keys(merged).length > 0 ? merged : {};
          }, 
          default: () => ({}) 
        },
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
   * @param {Object} options - Processing options (contains context at top level)
   * @returns {Promise<Object>} Agent response
   */
  async processMessage(message, options = {}) {
    // Context is passed at the top level of options, not nested
    const { history = [], language = "en", ...contextFields } = options;
    
    // Everything except history and language IS the context
    const mergedContext = { ...contextFields };
    const startTime = Date.now();
    
    logger.info("Orchestrator.processMessage received", {
      messageLength: message?.length,
      optionsKeys: Object.keys(options),
      hasUserName: !!options.userName,
      userName: options.userName,
      hasClerkId: !!options.clerkId,
      clerkId: options.clerkId,
      hasUserContext: !!options.userContext,
      mergedContextKeys: Object.keys(mergedContext),
    });

    try {
      logger.debug("Orchestrator processing message", {
        messageLength: message?.length,
        language,
      });

      // Check cache first
      const cachedResponse = getCachedResponse(message, 'general', language);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        
        recordRequest({
          agent: cachedResponse.agent || 'general',
          language,
          responseTime,
          confidence: 1.0,
        });

        logger.debug("Returning cached response", {
          responseTime: `${responseTime}ms`,
        });

        return {
          response: cachedResponse,
          routedTo: cachedResponse.agent || 'general',
          routing: {
            agent: cachedResponse.agent || 'general',
            confidence: 1.0,
            reasoning: 'Cached response',
          },
        };
      }

      // Build graph if not already built
      if (!this.graph) {
        logger.debug("Building orchestrator graph");
        this.buildGraph();
      }

      // Prepare initial state - ensure context is properly structured
      const initialState = {
        messages: [...history, { role: "user", content: message }],
        language,
        context: mergedContext || {}, // Ensure context is always an object
        currentAgent: null,
        routingDecision: null,
        response: null,
      };
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:initialState',message:'initialState prepared',data:{contextKeys:mergedContext?Object.keys(mergedContext):[],hasClerkId:!!mergedContext?.clerkId,hasUserContext:!!mergedContext?.userContext},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      logger.info("Orchestrator initial state prepared", {
        messageLength: message.length,
        historyLength: history.length,
        language,
        contextKeys: Object.keys(initialState.context),
        hasUserName: !!initialState.context.userName,
        userName: initialState.context.userName,
        hasUserContext: !!initialState.context.userContext,
        hasClerkId: !!initialState.context.clerkId,
        clerkId: initialState.context.clerkId,
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:beforeInvoke',message:'invoking graph',data:{contextKeys:initialState.context?Object.keys(initialState.context):[],hasClerkId:!!initialState.context?.clerkId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Run the graph with error handling
      const result = await this.graph.invoke(initialState);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2196eccc-e8fe-4ec3-87bd-0060f37d358f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/agents/agentOrchestrator.js:afterInvoke',message:'graph invoke completed',data:{hasResponse:!!result?.response,agent:result?.currentAgent},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Validate result structure
      if (!result || !result.response) {
        throw new Error("Invalid orchestrator response structure");
      }

      if (typeof result.response.content !== "string") {
        throw new Error("Response content must be a string");
      }

      const responseTime = Date.now() - startTime;

      // Cache successful responses
      if (!result.response.error) {
        setCachedResponse(
          message,
          result.currentAgent || 'general',
          language,
          result.response
        );
      }

      // Record metrics
      recordRequest({
        agent: result.currentAgent,
        language,
        responseTime,
        confidence: result.routingDecision?.confidence,
        error: result.response?.error ? new Error(result.response.content) : null,
      });

      logger.debug("Orchestrator completed successfully", {
        agent: result.currentAgent,
        confidence: result.routingDecision?.confidence,
        responseTime: `${responseTime}ms`,
      });

      return {
        response: result.response,
        routedTo: result.currentAgent,
        routing: result.routingDecision,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metrics
      recordRequest({
        agent: 'system',
        language,
        responseTime,
        error,
      });

      logger.error("Orchestrator error in processMessage", {
        error: error.message,
        stack: error.stack,
        language,
        responseTime: `${responseTime}ms`,
      });

      // Return a graceful fallback response
      return {
        response: {
          agent: "system",
          content:
            language === "bn"
              ? "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
              : "I'm sorry, I encountered an error. Please try again.",
          error: true,
          timestamp: new Date().toISOString(),
        },
        routedTo: "general",
        routing: {
          agent: "general",
          confidence: 0,
          reasoning: "Error fallback",
        },
      };
    }
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
