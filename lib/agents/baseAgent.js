"use server";

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
    return history.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      } else if (msg.role === "system") {
        return new SystemMessage(msg.content);
      }
      return new HumanMessage(msg.content);
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
    const langInstruction =
      language === "bn"
        ? "\n\nIMPORTANT: Respond in Bengali (বাংলা). Use Bengali script for your entire response."
        : "\n\nRespond in English.";

    const messages = [
      new SystemMessage(this.systemPrompt + langInstruction),
      ...this.formatHistory(history),
      new HumanMessage(userMessage),
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
   * Format agent response consistently
   * @param {string} content - Response content
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted response
   */
  formatResponse(content, metadata = {}) {
    return {
      agent: this.name,
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }
}

export default BaseAgent;
