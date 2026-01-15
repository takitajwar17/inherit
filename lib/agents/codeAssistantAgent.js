// Code Assistant Agent

/**
 * Code Assistant Agent
 *
 * Helps with code-related queries: debugging, code review, error explanations.
 * Wraps and enhances existing code review functionality.
 */

import { BaseAgent } from "./baseAgent";
import { getCodeModel } from "../gemini";
import logger from "@/lib/logger";
import { codeTools } from "./tools/codeTools";
import { ToolMessage } from "@langchain/core/messages";

const CODE_SYSTEM_PROMPT = `You are an expert programming assistant for CS students on the Inherit platform.

Your role is to:
1. Debug code and explain errors clearly
2. Review code and suggest improvements
3. Explain programming concepts with code examples
4. Help refactor and optimize code
5. Teach best practices and design patterns

You have access to the following tools:
- analyze_code: Analyze code for bugs, performance, security, and style issues
- debug_code: Debug problematic code and suggest specific fixes
- generate_code: Generate code snippets for tasks, patterns, or algorithms
- explain_code: Explain how code works line-by-line or conceptually
- compare_approaches: Compare different solutions to the same problem

Use these tools to provide comprehensive code assistance. When users share code with issues, use debug_code or analyze_code. When they need code examples, use generate_code. When they want to understand code, use explain_code.

Guidelines:
- Always explain WHY something is wrong, not just what
- Provide corrected code with explanations
- Be encouraging - bugs are learning opportunities
- If code is good, praise what's done well before suggesting improvements

Remember: You're helping them become better programmers, not just fixing their code.`;
export class CodeAssistantAgent extends BaseAgent {
  constructor() {
    super("code", "Code debugging and review assistance", getCodeModel());
    this.setSystemPrompt(CODE_SYSTEM_PROMPT);
  }

  /**
   * Process a code-related query
   */
  async process(message, context = {}) {
    const { 
      history = [], 
      language = "en",
      userName,
      userContext,
      contextSummary,
    } = context;

    logger.info("CodeAssistantAgent received context", {
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
        fullContext += `\n\nUser's name: ${userName}. Be encouraging when reviewing their code.`;
      }
      
      // Add user context summary for better personalization
      if (contextSummary) {
        fullContext += `\n\n--- USER'S PROFILE ---\n${contextSummary}\n--- END PROFILE ---\nUse this context to tailor your code explanations to their skill level.`;
      }
      
      const enhancedPrompt = fullContext
        ? this.systemPrompt + fullContext
        : this.systemPrompt;
      
      this.setSystemPrompt(enhancedPrompt);

      // Bind tools to the model
      const modelWithTools = this.bindTools(codeTools);

      const messages = this.buildMessages(message, history, language);
      const response = await modelWithTools.invoke(messages);

      // Check if model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute the tools
        const toolResults = await this.executeTools(
          response.tool_calls, 
          codeTools
        );

        // Create tool messages for the model
        const toolMessages = response.tool_calls.map((toolCall, index) => {
          const result = toolResults[index];
          return new ToolMessage({
            tool_call_id: toolCall.id,
            content: result.success ? result.result : `Error: ${result.error}`,
          });
        });

        // Get final response from model with tool results
        const finalMessages = [
          ...messages,
          response,
          ...toolMessages,
        ];

        const finalResponse = await modelWithTools.invoke(finalMessages);

        const finalContent = this.safeExtractContent(finalResponse);
        
        // Extract code language if present in the query
        const codeLanguage = this.detectCodeLanguage(message);

        return this.formatResponse(finalContent, {
          language,
          codeLanguage,
          type: this.classifyCodeQuery(message),
          usedTools: response.tool_calls.map(tc => tc.name),
        });
      }

      // No tool calls, just return the response
      const content = this.safeExtractContent(response);
      const codeLanguage = this.detectCodeLanguage(message);

      return this.formatResponse(content, {
        language,
        codeLanguage,
        type: this.classifyCodeQuery(message),
      });
    } catch (error) {
      logger.error("Code assistant agent error", {
        error: error.message,
        stack: error.stack,
      });
      return this.formatResponse(
        language === "bn"
          ? "দুঃখিত, কোড বিশ্লেষণে সমস্যা হয়েছে।"
          : "Sorry, I had trouble analyzing that code.",
        { error: true }
      );
    }
  }

  /**
   * Detect programming language from message
   */
  detectCodeLanguage(message) {
    const patterns = {
      javascript: /javascript|js|node|react|vue|angular/i,
      python: /python|py|django|flask/i,
      java: /\bjava\b|spring|android/i,
      cpp: /c\+\+|cpp/i,
      c: /\bc\b|gcc/i,
      typescript: /typescript|ts/i,
      sql: /sql|mysql|postgres|database query/i,
      html: /html|webpage/i,
      css: /css|style/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) return lang;
    }
    return null;
  }

  /**
   * Classify the type of code query
   */
  classifyCodeQuery(message) {
    const lower = message.toLowerCase();
    if (
      lower.includes("debug") ||
      lower.includes("error") ||
      lower.includes("bug") ||
      lower.includes("fix")
    ) {
      return "debug";
    }
    if (
      lower.includes("review") ||
      lower.includes("improve") ||
      lower.includes("optimize")
    ) {
      return "review";
    }
    if (
      lower.includes("explain") ||
      lower.includes("what does") ||
      lower.includes("how does")
    ) {
      return "explain";
    }
    if (
      lower.includes("write") ||
      lower.includes("create") ||
      lower.includes("example")
    ) {
      return "generate";
    }
    return "general";
  }
}

export default CodeAssistantAgent;
