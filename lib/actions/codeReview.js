"use server"

/**
 * Code Review Server Actions
 * 
 * Server-side actions for AI-powered code review.
 */

import logger, { logExternalApi, events } from "../logger";
import { ExternalServiceError } from "../errors";

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates an AI code review for the provided code
 * @param {string} code - The code to review
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} Review with suggestions, issues, and improvements
 * @throws {ExternalServiceError} If all retry attempts fail
 */
export const generateReview = async (code, retries = 3) => {
  const systemPrompt = `You are an expert code reviewer. Analyze the code and return ONLY a JSON object with this exact structure:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "code": "string",
      "lineNumber": number
    }
  ],
  "issues": [
    {
      "title": "string",
      "description": "string",
      "severity": "high|medium|low",
      "code": "string",
      "lineNumber": number
    }
  ],
  "improvements": [
    {
      "title": "string",
      "description": "string",
      "code": "string",
      "lineNumber": number
    }
  ]
}

Focus on:
1. Code quality and best practices
2. Performance improvements
3. Security concerns
4. Maintainability and readability
5. Potential bugs and edge cases

IMPORTANT: Return ONLY the JSON object, no other text. The response must be valid JSON.`;

  const startTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug("Generating AI code review", { attempt, codeLength: code.length });
      logExternalApi("groq", "code_review", { attempt });
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: code,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1500,
        top_p: 0.65,
        stream: false,
        stop: null,
      });

      const aiResponse = chatCompletion.choices[0].message.content;
      
      try {
        // Clean the response - remove any non-JSON text
        const jsonStart = aiResponse.indexOf('{');
        const jsonEnd = aiResponse.lastIndexOf('}') + 1;
        const cleanJson = aiResponse.slice(jsonStart, jsonEnd);
        
        // Parse and validate the JSON response
        const parsedResponse = JSON.parse(cleanJson);
        
        // Ensure all required sections exist with proper types
        const validatedResponse = {
          suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions.map(s => ({
            ...s,
            lineNumber: typeof s.lineNumber === 'number' ? s.lineNumber : null
          })) : [],
          issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues.map(i => ({
            ...i,
            lineNumber: typeof i.lineNumber === 'number' ? i.lineNumber : null,
            severity: ['high', 'medium', 'low'].includes(i.severity) ? i.severity : 'medium'
          })) : [],
          improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements.map(i => ({
            ...i,
            lineNumber: typeof i.lineNumber === 'number' ? i.lineNumber : null
          })) : []
        };

        const duration = Date.now() - startTime;
        logger.info("AI code review generated successfully", { 
          suggestionsCount: validatedResponse.suggestions.length,
          issuesCount: validatedResponse.issues.length,
          improvementsCount: validatedResponse.improvements.length,
          duration
        });
        events.aiCodeReviewCompleted(duration);
        
        return validatedResponse;
      } catch (parseError) {
        logger.error("Error parsing AI code review response", { 
          attempt, 
          error: parseError.message 
        });
        throw new ExternalServiceError("Groq AI", "Invalid response format");
      }
    } catch (error) {
      logger.error("Error generating AI code review", { 
        attempt, 
        error: error.message 
      });
      
      if (attempt === retries) {
        logger.error("Max retries reached for AI code review");
        // Return graceful fallback instead of throwing
        return {
          suggestions: [],
          issues: [
            {
              title: "Error in Generating Review",
              description: "An error occurred while generating the AI response after multiple attempts. Please try again later.",
              severity: "high",
              code: null,
              lineNumber: null
            }
          ],
          improvements: []
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
