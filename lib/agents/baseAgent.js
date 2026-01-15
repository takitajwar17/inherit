// Base Agent Class

/**
 * Base Agent Class
 *
 * Abstract base class for all agents in the multi-agent system.
 * Provides common functionality like conversation memory and response formatting.
 */

import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

/**
 * Base Agent class - all agents extend this
 */
export class BaseAgent {
  constructor(name, description, model) {
    this.name = name;
    this.description = description;
    this.model = model;
    this.systemPrompt = "";
  }

  /**
   * Set the system prompt for this agent
   * @param {string} prompt - The system prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  /**
   * Convert conversation history to LangChain messages
   * @param {Array} history - Array of {role, content} objects
   * @returns {Array} LangChain message objects
   */
  formatHistory(history = []) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(
        (msg) => msg && typeof msg.content === "string" && msg.content.trim()
      )
      .map((msg) => {
        const content = msg.content || "";
        if (msg.role === "user") {
          return new HumanMessage(content);
        } else if (msg.role === "assistant") {
          return new AIMessage(content);
        } else if (msg.role === "system") {
          return new SystemMessage(content);
        }
        return new HumanMessage(content);
      });
  }

  /**
   * Build messages array for model invocation
   * @param {string} userMessage - Current user message
   * @param {Array} history - Conversation history
   * @param {string} language - 'en' or 'bn'
   * @returns {Array} Messages for model
   */
  buildMessages(userMessage, history = [], language = "en") {
    // Ensure userMessage is a valid string
    const safeUserMessage =
      typeof userMessage === "string" ? userMessage : String(userMessage || "");

    const langInstruction =
      language === "bn"
        ? "\n\nIMPORTANT: Respond in Bengali (বাংলা). Use Bengali script for your entire response."
        : "\n\nRespond in English.";

    // Ensure systemPrompt is a string
    const safeSystemPrompt = this.systemPrompt || "";

    const messages = [
      new SystemMessage(safeSystemPrompt + langInstruction),
      ...this.formatHistory(history),
      new HumanMessage(safeUserMessage),
    ];

    return messages;
  }

  /**
   * Process a message - must be implemented by subclasses
   * @param {string} message - User message
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Agent response
   */
  async process(message, context = {}) {
    throw new Error("process() must be implemented by subclass");
  }

  /**
   * Safely extract content from a LangChain response
   * Handles edge cases where response might be in unexpected formats
   * @param {Object} response - LangChain model response
   * @returns {string} Extracted content string
   */
  safeExtractContent(response) {
    if (!response) {
      return "";
    }

    // Standard case: response.content is a string
    if (typeof response.content === "string") {
      return response.content;
    }

    // Edge case: content might be an array of message parts
    if (Array.isArray(response.content)) {
      return response.content
        .map((part) => (typeof part === "string" ? part : part?.text || ""))
        .join("");
    }

    // Edge case: content might be an object with text property
    if (response.content && typeof response.content.text === "string") {
      return response.content.text;
    }

    // Edge case: response itself might be a string
    if (typeof response === "string") {
      return response;
    }

    // Edge case: response.text exists
    if (typeof response.text === "string") {
      return response.text;
    }

    // Fallback: try to stringify if it's an object
    if (typeof response.content === "object" && response.content !== null) {
      try {
        return JSON.stringify(response.content);
      } catch {
        return "";
      }
    }

    return "";
  }

  /**
   * Format agent response consistently
   * @param {string} content - Response content
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted response
   */
  formatResponse(content, metadata = {}) {
    // Ensure content is always a string
    const safeContent =
      typeof content === "string" ? content : String(content || "");

    return {
      agent: this.name,
      content: safeContent,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }
}

export default BaseAgent;
