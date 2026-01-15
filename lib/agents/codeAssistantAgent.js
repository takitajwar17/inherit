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

const CODE_SYSTEM_PROMPT = `You are an expert programming assistant for CS students on the Inherit platform.

Your role is to:
1. Debug code and explain errors clearly
2. Review code and suggest improvements
3. Explain programming concepts with code examples
4. Help refactor and optimize code
5. Teach best practices and design patterns

Guidelines:
- Always explain WHY something is wrong, not just what
- Provide corrected code with explanations
- Use proper syntax highlighting (specify language in code blocks)
- Be encouraging - bugs are learning opportunities
- If code is good, praise what's done well before suggesting improvements

For debugging:
1. Identify the error type (syntax, logic, runtime)
2. Explain what the error means
3. Show the fix with before/after comparison
4. Explain how to avoid similar bugs

Format your responses with clear sections:
## Problem Identified
## Explanation
## Solution
## Code Example

Use markdown code blocks with language specification:
\`\`\`javascript
// code here
\`\`\``;

export class CodeAssistantAgent extends BaseAgent {
  constructor() {
    super("code", "Code debugging and review assistance", getCodeModel());
    this.setSystemPrompt(CODE_SYSTEM_PROMPT);
  }

  /**
   * Process a code-related query
   */
  async process(message, context = {}) {
    const { history = [], language = "en" } = context;

    try {
      const messages = this.buildMessages(message, history, language);
      const response = await this.model.invoke(messages);

      // Extract code language if present in the query
      const codeLanguage = this.detectCodeLanguage(message);

      return this.formatResponse(this.safeExtractContent(response), {
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
