"use server"

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Generating AI review...`);
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

        console.log("AI Review Generated Successfully:", validatedResponse);
        return validatedResponse;
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error(`Attempt ${attempt} - Error generating AI answer:`, error.message);
      if (attempt === retries) {
        console.error("Max retries reached. Failed to generate AI answer.");
        return {
          suggestions: [],
          issues: [
            {
              title: "Error Generating Review",
              description: "An error occurred while generating the AI response after multiple attempts.",
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
