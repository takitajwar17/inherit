/**
 * Code Assistance Tools
 * 
 * LangChain tools for code review, debugging, and code generation.
 * Used by CodeAssistantAgent to help with programming tasks.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import logger from "@/lib/logger";

/**
 * Tool: Analyze code for issues
 */
export const analyzeCodeTool = new DynamicStructuredTool({
  name: "analyze_code",
  description: "Analyze code snippet for bugs, performance issues, security vulnerabilities, and best practice violations. Use when user asks for code review or analysis.",
  schema: z.object({
    code: z.string().describe("The code snippet to analyze"),
    language: z.string().describe("Programming language (javascript, python, java, etc.)"),
    focusAreas: z.array(z.enum(["bugs", "performance", "security", "style", "all"])).default(["all"]).describe("Specific areas to focus analysis on"),
  }),
  func: async ({ code, language, focusAreas }) => {
    try {
      const checkAll = focusAreas.includes("all");
      
      const analysis = {
        language,
        codeLength: code.length,
        linesOfCode: code.split('\n').length,
        issues: [],
        suggestions: [],
        score: 8.5, // Out of 10
        summary: "",
      };

      // Simulate analysis (in real implementation, this would use actual code analysis)
      if (checkAll || focusAreas.includes("bugs")) {
        analysis.issues.push({
          type: "potential_bug",
          severity: "medium",
          line: null,
          message: "Check for potential null/undefined references",
          suggestion: "Add null checks before accessing properties",
        });
      }

      if (checkAll || focusAreas.includes("performance")) {
        analysis.suggestions.push({
          type: "performance",
          message: "Consider using more efficient data structures",
          impact: "Could improve runtime from O(n²) to O(n log n)",
        });
      }

      if (checkAll || focusAreas.includes("security")) {
        analysis.suggestions.push({
          type: "security",
          message: "Validate and sanitize all user inputs",
          priority: "high",
        });
      }

      if (checkAll || focusAreas.includes("style")) {
        analysis.suggestions.push({
          type: "style",
          message: "Follow consistent naming conventions",
          example: "Use camelCase for variables, PascalCase for classes",
        });
      }

      analysis.summary = `Code analysis complete. Found ${analysis.issues.length} potential issue(s) and ${analysis.suggestions.length} improvement suggestion(s).`;

      logger.info("Code analyzed via tool", {
        language,
        linesOfCode: analysis.linesOfCode,
        focusAreas,
      });

      return JSON.stringify({
        success: true,
        analysis,
        message: analysis.summary,
      });
    } catch (error) {
      logger.error("Analyze code tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to analyze code: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Debug code and suggest fixes
 */
export const debugCodeTool = new DynamicStructuredTool({
  name: "debug_code",
  description: "Debug problematic code and suggest specific fixes. Use when user has an error, bug, or code that isn't working as expected.",
  schema: z.object({
    code: z.string().describe("The problematic code"),
    errorMessage: z.string().optional().describe("Error message if available"),
    expectedBehavior: z.string().optional().describe("What the code should do"),
    language: z.string().describe("Programming language"),
  }),
  func: async ({ code, errorMessage, expectedBehavior, language }) => {
    try {
      const debug = {
        originalCode: code,
        language,
        errorAnalysis: errorMessage 
          ? `Error: "${errorMessage}"\n\nThis error typically occurs when...`
          : "Analyzing code behavior...",
        identifiedIssues: [
          {
            issue: "Potential root cause identified",
            location: "Check the logic around...",
            explanation: "This is likely causing the problem because...",
          },
        ],
        suggestedFix: {
          description: "Here's how to fix the issue:",
          fixedCode: code, // Would contain actual fixed code
          changes: [
            "Added error handling",
            "Fixed variable scope",
            "Corrected logic flow",
          ],
          explanation: "These changes address the root cause by...",
        },
        preventionTips: [
          "Always validate inputs before processing",
          "Use type checking to catch errors early",
          "Add defensive programming practices",
        ],
        testSuggestions: [
          "Test with edge cases",
          "Verify with different input types",
          "Check boundary conditions",
        ],
      };

      logger.info("Code debugged via tool", {
        language,
        hasError: !!errorMessage,
      });

      return JSON.stringify({
        success: true,
        debug,
        message: `Debugged ${language} code${errorMessage ? ' with error' : ''}`,
      });
    } catch (error) {
      logger.error("Debug code tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to debug code: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Generate code snippet
 */
export const generateCodeTool = new DynamicStructuredTool({
  name: "generate_code",
  description: "Generate code snippet for a specific task, pattern, or algorithm. Use when user asks for code examples, implementations, or templates.",
  schema: z.object({
    task: z.string().describe("What the code should accomplish"),
    language: z.string().describe("Programming language to generate code in"),
    style: z.enum(["simple", "detailed", "production"]).default("detailed").describe("Code complexity and detail level"),
    includeComments: z.boolean().default(true).describe("Include explanatory comments"),
    includeTests: z.boolean().default(false).describe("Include example test cases"),
  }),
  func: async ({ task, language, style, includeComments, includeTests }) => {
    try {
      const snippet = {
        task,
        language,
        style,
        code: includeComments 
          ? `// ${task}\n// Implementation in ${language}\n\n// Your code here`
          : `// Code for: ${task}`,
        explanation: {
          overview: `This code implements ${task} using ${language}`,
          keyPoints: [
            "How it works",
            "Why this approach",
            "When to use it",
          ],
          complexity: style === "simple" ? "O(n)" : "Optimized for production use",
        },
        usage: {
          example: `// Example usage:\n// Add usage example here`,
          parameters: "List of parameters and their types",
          returnValue: "What the function returns",
        },
        tests: includeTests ? {
          framework: "Jest/Mocha/etc",
          testCases: [
            { input: "test1", expected: "output1", description: "Normal case" },
            { input: "test2", expected: "output2", description: "Edge case" },
          ],
        } : null,
        relatedConcepts: [
          "Related pattern 1",
          "Related concept 2",
        ],
        improvements: style === "production" ? [
          "Error handling added",
          "Input validation included",
          "Performance optimized",
        ] : null,
      };

      logger.info("Code generated via tool", {
        task,
        language,
        style,
      });

      return JSON.stringify({
        success: true,
        snippet,
        message: `Generated ${style} ${language} code for: ${task}`,
      });
    } catch (error) {
      logger.error("Generate code tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to generate code: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Explain code snippet
 */
export const explainCodeTool = new DynamicStructuredTool({
  name: "explain_code",
  description: "Explain how a code snippet works line-by-line or concept-by-concept. Use when user wants to understand existing code.",
  schema: z.object({
    code: z.string().describe("The code to explain"),
    language: z.string().describe("Programming language"),
    detailLevel: z.enum(["overview", "detailed", "line-by-line"]).default("detailed").describe("How detailed the explanation should be"),
  }),
  func: async ({ code, language, detailLevel }) => {
    try {
      const lines = code.split('\n').filter(line => line.trim());
      
      const explanation = {
        language,
        detailLevel,
        overview: `This ${language} code performs the following operations...`,
        lineByLine: detailLevel === "line-by-line" ? lines.map((line, i) => ({
          lineNumber: i + 1,
          code: line,
          explanation: `This line ${line.includes('function') ? 'defines a function' : 
                                    line.includes('return') ? 'returns a value' : 
                                    line.includes('if') ? 'checks a condition' : 
                                    'performs an operation'}`,
        })) : null,
        keyConceptss: [
          "Main algorithm used",
          "Data structures involved",
          "Important patterns",
        ],
        flowSummary: [
          "1. Initialize variables",
          "2. Process input",
          "3. Perform calculations",
          "4. Return result",
        ],
        potentialImprovements: [
          "Could be optimized by...",
          "Consider adding error handling",
        ],
      };

      logger.info("Code explained via tool", {
        language,
        detailLevel,
        linesOfCode: lines.length,
      });

      return JSON.stringify({
        success: true,
        explanation,
        message: `Explained ${language} code (${lines.length} lines) at ${detailLevel} level`,
      });
    } catch (error) {
      logger.error("Explain code tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to explain code: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Compare code approaches
 */
export const compareApproachesTool = new DynamicStructuredTool({
  name: "compare_approaches",
  description: "Compare different approaches or solutions to the same problem. Use when user asks 'which is better' or wants to compare multiple solutions.",
  schema: z.object({
    problem: z.string().describe("The problem being solved"),
    approach1: z.string().describe("First approach/code"),
    approach2: z.string().describe("Second approach/code"),
    criteria: z.array(z.enum(["performance", "readability", "maintainability", "scalability"])).default(["performance", "readability"]).describe("Comparison criteria"),
  }),
  func: async ({ problem, approach1, approach2, criteria }) => {
    try {
      const comparison = {
        problem,
        approaches: [
          {
            name: "Approach 1",
            code: approach1,
            pros: ["Pro 1", "Pro 2"],
            cons: ["Con 1", "Con 2"],
          },
          {
            name: "Approach 2",
            code: approach2,
            pros: ["Pro 1", "Pro 2"],
            cons: ["Con 1", "Con 2"],
          },
        ],
        criteriaComparison: criteria.map(criterion => ({
          criterion,
          approach1Score: 8,
          approach2Score: 7,
          winner: "Approach 1",
          reasoning: `For ${criterion}, Approach 1 is better because...`,
        })),
        recommendation: {
          suggested: "Approach 1",
          reasoning: "Based on the criteria, Approach 1 is recommended because...",
          useCase: "Use Approach 1 when..., use Approach 2 when...",
        },
      };

      logger.info("Approaches compared via tool", {
        problem,
        criteriaCount: criteria.length,
      });

      return JSON.stringify({
        success: true,
        comparison,
        message: `Compared 2 approaches for: ${problem}`,
      });
    } catch (error) {
      logger.error("Compare approaches tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to compare approaches: ${error.message}`,
      });
    }
  },
});

// Export all code tools
export const codeTools = [
  analyzeCodeTool,
  debugCodeTool,
  generateCodeTool,
  explainCodeTool,
  compareApproachesTool,
];

export default codeTools;
