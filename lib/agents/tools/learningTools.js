/**
 * Learning Tools
 * 
 * LangChain tools for learning assistance.
 * Used by LearningCompanionAgent to help with concept explanations and learning paths.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import logger from "@/lib/logger";

/**
 * Tool: Explain a programming concept
 */
export const explainConceptTool = new DynamicStructuredTool({
  name: "explain_concept",
  description: "Explain a programming or CS concept in simple, beginner-friendly terms with examples and analogies. Use when user asks to explain, understand, or learn a concept.",
  schema: z.object({
    concept: z.string().describe("The concept to explain (e.g., 'recursion', 'async/await', 'OOP')"),
    level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner").describe("User's knowledge level"),
    includeExample: z.boolean().default(true).describe("Include code example"),
    includeAnalogy: z.boolean().default(true).describe("Use real-world analogy"),
  }),
  func: async ({ concept, level, includeExample, includeAnalogy }) => {
    try {
      // This would integrate with your knowledge base or generate structured explanations
      const explanation = {
        concept,
        level,
        definition: `${concept} is a fundamental programming concept that...`,
        keyPoints: [
          `Core principle of ${concept}`,
          "How it works under the hood",
          "When to use it",
          "Common pitfalls to avoid",
        ],
        analogy: includeAnalogy 
          ? `Think of ${concept} like a real-world scenario: ...` 
          : null,
        codeExample: includeExample
          ? {
              language: "javascript",
              code: `// Example demonstrating ${concept}\n// Add actual code here`,
              explanation: "This code shows...",
            }
          : null,
        nextSteps: [
          "Practice with simple examples",
          "Build a small project using this concept",
          `Learn about advanced ${concept} patterns`,
        ],
      };

      logger.info("Concept explained via tool", { concept, level });

      return JSON.stringify({
        success: true,
        explanation,
        message: `Explained ${concept} at ${level} level`,
      });
    } catch (error) {
      logger.error("Explain concept tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to explain concept: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Create a learning path
 */
export const createLearningPathTool = new DynamicStructuredTool({
  name: "create_learning_path",
  description: "Generate a personalized step-by-step learning path for mastering a technology or skill. Use when user wants to learn something new or needs a study roadmap.",
  schema: z.object({
    topic: z.string().describe("The topic to create a learning path for (e.g., 'React', 'Python', 'Web Development')"),
    currentLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner").describe("User's current knowledge level"),
    timeframe: z.string().optional().describe("Desired completion timeframe (e.g., '3 months', '6 weeks')"),
    goals: z.array(z.string()).optional().describe("Specific learning goals or outcomes"),
    hoursPerWeek: z.number().default(5).describe("Hours available per week for learning"),
  }),
  func: async ({ topic, currentLevel, timeframe, goals, hoursPerWeek }) => {
    try {
      // Generate structured learning path
      const path = {
        topic,
        level: currentLevel,
        estimatedDuration: timeframe || `${Math.ceil(20 / hoursPerWeek)} weeks`,
        hoursPerWeek,
        goals: goals || [`Master ${topic}`, "Build real-world projects", "Get job-ready"],
        phases: [
          {
            phase: 1,
            title: "Fundamentals",
            duration: "2-3 weeks",
            description: `Learn the core basics of ${topic}`,
            topics: [
              `Introduction to ${topic}`,
              "Core concepts and terminology",
              "Setting up development environment",
              "Your first simple project",
            ],
            resources: [
              "Official documentation (reading)",
              "Interactive tutorial (practice)",
              "Video series (watching)",
            ],
            milestone: `Build a simple ${topic} project`,
          },
          {
            phase: 2,
            title: "Intermediate Skills",
            duration: "3-4 weeks",
            description: "Dive deeper into practical applications",
            topics: [
              "Advanced patterns and best practices",
              "Working with real-world scenarios",
              "Common challenges and solutions",
              "Testing and debugging",
            ],
            resources: [
              "Advanced course or book",
              "Open source projects (reading code)",
              "Coding challenges",
            ],
            milestone: "Build a medium-complexity application",
          },
          {
            phase: 3,
            title: "Advanced & Production",
            duration: "3-4 weeks",
            description: "Production-ready skills and optimization",
            topics: [
              "Performance optimization",
              "Security best practices",
              "Deployment and DevOps basics",
              "Advanced architecture patterns",
            ],
            resources: [
              "Production-focused tutorials",
              "Real-world case studies",
              "Community projects",
            ],
            milestone: `Deploy a production ${topic} application`,
          },
        ],
        practiceProjects: [
          `Beginner: Simple ${topic} calculator/tool`,
          `Intermediate: Multi-feature ${topic} application`,
          `Advanced: Full-stack project with ${topic}`,
        ],
        assessmentQuestions: [
          `What are the core principles of ${topic}?`,
          `How would you solve [common problem] using ${topic}?`,
          `Explain best practices for ${topic} in production`,
        ],
      };

      logger.info("Learning path created via tool", { topic, currentLevel });

      return JSON.stringify({
        success: true,
        learningPath: path,
        message: `Created personalized ${topic} learning path for ${currentLevel} level`,
      });
    } catch (error) {
      logger.error("Create learning path tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to create learning path: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Generate practice exercises
 */
export const generatePracticeTool = new DynamicStructuredTool({
  name: "generate_practice",
  description: "Generate practice exercises and coding challenges for a specific topic. Use when user wants to practice or test their understanding.",
  schema: z.object({
    topic: z.string().describe("Topic for practice exercises"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium").describe("Exercise difficulty level"),
    count: z.number().default(3).describe("Number of exercises to generate"),
    includeHints: z.boolean().default(true).describe("Include hints for each exercise"),
  }),
  func: async ({ topic, difficulty, count, includeHints }) => {
    try {
      const exercises = [];
      
      for (let i = 1; i <= count; i++) {
        exercises.push({
          id: i,
          title: `${topic} Exercise ${i}`,
          difficulty,
          question: `Solve this ${difficulty} level problem related to ${topic}...`,
          requirements: [
            "Implement the required functionality",
            "Follow best practices",
            "Add error handling",
          ],
          starterCode: `// Starter code for ${topic} exercise\n// Your solution here`,
          testCases: [
            { input: "test1", expected: "output1" },
            { input: "test2", expected: "output2" },
          ],
          hints: includeHints ? [
            "Start by understanding the problem",
            "Break it down into smaller steps",
            `Think about how ${topic} works`,
          ] : [],
          learningObjectives: [
            `Apply ${topic} concepts`,
            "Problem-solving skills",
            "Code organization",
          ],
          estimatedTime: difficulty === "easy" ? "15 min" : difficulty === "medium" ? "30 min" : "45 min",
        });
      }

      logger.info("Practice exercises generated via tool", {
        topic,
        difficulty,
        count,
      });

      return JSON.stringify({
        success: true,
        exercises,
        message: `Generated ${count} ${difficulty} practice exercise${count !== 1 ? 's' : ''} for ${topic}`,
      });
    } catch (error) {
      logger.error("Generate practice tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to generate exercises: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Break down complex topic
 */
export const breakDownTopicTool = new DynamicStructuredTool({
  name: "break_down_topic",
  description: "Break down a complex topic into smaller, manageable subtopics with learning sequence. Use when user finds a topic overwhelming or too complex.",
  schema: z.object({
    topic: z.string().describe("The complex topic to break down"),
    depth: z.number().default(3).describe("How many levels deep to break down (1-5)"),
  }),
  func: async ({ topic, depth }) => {
    try {
      const breakdown = {
        mainTopic: topic,
        complexity: "high",
        subtopics: [
          {
            id: 1,
            title: `Core Fundamentals of ${topic}`,
            description: "Essential building blocks you need first",
            prerequisite: "None",
            estimatedTime: "1-2 weeks",
            difficulty: "beginner",
            children: depth > 1 ? [
              `Basic ${topic} concepts`,
              `${topic} terminology`,
              "Simple examples",
            ] : [],
          },
          {
            id: 2,
            title: `Intermediate ${topic}`,
            description: "Building on the fundamentals",
            prerequisite: "Core Fundamentals",
            estimatedTime: "2-3 weeks",
            difficulty: "intermediate",
            children: depth > 1 ? [
              "Common patterns",
              "Real-world applications",
              "Best practices",
            ] : [],
          },
          {
            id: 3,
            title: `Advanced ${topic}`,
            description: "Deep dive into complex scenarios",
            prerequisite: "Intermediate",
            estimatedTime: "3-4 weeks",
            difficulty: "advanced",
            children: depth > 1 ? [
              "Performance optimization",
              "Advanced patterns",
              "Production considerations",
            ] : [],
          },
        ],
        learningSequence: [
          "Start with basics - don't skip fundamentals",
          "Practice each concept before moving on",
          "Build projects at each level",
          "Review and reinforce regularly",
        ],
        recommendedApproach: "Learn one subtopic at a time, master it through practice, then move to the next.",
      };

      logger.info("Topic broken down via tool", { topic, depth });

      return JSON.stringify({
        success: true,
        breakdown,
        message: `Broke down ${topic} into ${breakdown.subtopics.length} manageable parts`,
      });
    } catch (error) {
      logger.error("Break down topic tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to break down topic: ${error.message}`,
      });
    }
  },
});

/**
 * Tool: Suggest learning resources
 */
export const suggestResourcesTool = new DynamicStructuredTool({
  name: "suggest_resources",
  description: "Recommend curated learning resources (docs, tutorials, courses, videos) for a topic. Use when user asks for resources, materials, or where to learn.",
  schema: z.object({
    topic: z.string().describe("Topic to find resources for"),
    resourceTypes: z.array(z.enum(["documentation", "video", "interactive", "book", "course", "practice"])).optional().describe("Types of resources to include"),
    level: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all").describe("Resource difficulty level"),
  }),
  func: async ({ topic, resourceTypes, level }) => {
    try {
      const allTypes = resourceTypes || ["documentation", "video", "interactive", "course", "practice"];
      
      const resources = {
        topic,
        level,
        categories: [],
      };

      if (allTypes.includes("documentation")) {
        resources.categories.push({
          type: "documentation",
          title: "Official Documentation",
          items: [
            {
              name: `${topic} Official Docs`,
              url: "#",
              description: "Comprehensive official documentation",
              difficulty: "all",
              free: true,
            },
          ],
        });
      }

      if (allTypes.includes("video")) {
        resources.categories.push({
          type: "video",
          title: "Video Tutorials",
          items: [
            {
              name: `${topic} Complete Course`,
              platform: "YouTube",
              description: "Step-by-step video series",
              duration: "10 hours",
              difficulty: level === "all" ? "beginner" : level,
              free: true,
            },
          ],
        });
      }

      if (allTypes.includes("interactive")) {
        resources.categories.push({
          type: "interactive",
          title: "Interactive Learning",
          items: [
            {
              name: `${topic} Interactive Tutorial`,
              platform: "freeCodeCamp / Codecademy",
              description: "Learn by doing with instant feedback",
              difficulty: "beginner",
              free: true,
            },
          ],
        });
      }

      if (allTypes.includes("practice")) {
        resources.categories.push({
          type: "practice",
          title: "Practice & Challenges",
          items: [
            {
              name: `${topic} Coding Challenges`,
              platform: "LeetCode / HackerRank",
              description: "Practice problems to reinforce learning",
              difficulty: "all",
              free: true,
            },
          ],
        });
      }

      logger.info("Resources suggested via tool", { topic, level, types: allTypes.length });

      return JSON.stringify({
        success: true,
        resources,
        message: `Found ${resources.categories.reduce((acc, cat) => acc + cat.items.length, 0)} learning resources for ${topic}`,
      });
    } catch (error) {
      logger.error("Suggest resources tool error", { error: error.message });
      return JSON.stringify({
        success: false,
        message: `Failed to suggest resources: ${error.message}`,
      });
    }
  },
});

// Export all learning tools
export const learningTools = [
  explainConceptTool,
  createLearningPathTool,
  generatePracticeTool,
  breakDownTopicTool,
  suggestResourcesTool,
];

export default learningTools;
