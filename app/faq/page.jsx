"use client";

import { useState, useEffect } from "react";
import { FiChevronDown, FiSearch, FiMessageSquare, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    category: "Dashboard",
    questions: [
      {
        question: "What information can I find on my dashboard?",
        answer: "Your dashboard displays key metrics including active quests, completed quests, roadmap progress, and your learning streak. It also shows your recent activities across quests and roadmaps."
      },
      {
        question: "How is my learning streak calculated?",
        answer: "Your learning streak is calculated based on your consecutive days of activity in quests. The streak increases each day you complete quest-related activities."
      },
      {
        question: "How does the dashboard help track my progress?",
        answer: "The dashboard provides visual progress indicators for your roadmaps, active quests, and completed quests. It also displays a timeline of your recent activities to help you stay on track with your learning goals."
      },
      {
        question: "What are the different metrics shown on my dashboard?",
        answer: "The dashboard shows: 1) Number of active quests you're currently participating in, 2) Total completed quests, 3) Overall roadmap progress as a percentage, 4) Current learning streak, and 5) Recent activity feed showing your latest interactions across the platform."
      }
    ]
  },
  {
    category: "Learn",
    questions: [
      {
        question: "What makes the Learn section unique?",
        answer: "The Learn section combines curated video tutorials with an integrated coding environment, allowing you to learn and practice simultaneously. It features content from top programming channels like freeCodeCamp and Telusko."
      },
      {
        question: "How does the video learning interface work?",
        answer: "The video learning interface features a split-screen view where you can watch the video and code simultaneously. You can adjust the split screen ratio between 30% and 70% by dragging the divider."
      },
      {
        question: "Can I practice coding while watching videos?",
        answer: "Yes, each video comes with an integrated code workspace where you can practice coding alongside the video tutorial. The workspace supports multiple programming languages and real-time code execution."
      },
      {
        question: "How do I find relevant learning content?",
        answer: "You can search for specific topics using the search bar, and videos are organized by programming concepts and difficulty levels. Each video displays its duration, publish date, and a brief description to help you choose appropriate content."
      }
    ]
  },
  {
    category: "Roadmaps",
    questions: [
      {
        question: "What is the purpose of Roadmaps?",
        answer: "Roadmaps serve as structured learning paths that guide you through mastering specific technologies or concepts. They break down complex topics into manageable steps and track your progress along the way."
      },
      {
        question: "How do I use Roadmaps effectively?",
        answer: "Start by selecting or creating a roadmap aligned with your learning goals. Follow the steps sequentially, marking them complete as you progress. Each step may contain resources, tutorials, or exercises to help you master the concept."
      },
      {
        question: "How is roadmap progress tracked?",
        answer: "Progress is tracked per step and automatically saved. You can mark steps as complete, and your progress is displayed as a percentage. The system remembers your progress even when you return later."
      },
      {
        question: "What's the difference between custom and preset roadmaps?",
        answer: "Preset roadmaps are curated learning paths designed by experts for specific technologies or skills. Custom roadmaps allow you to create your own learning path by defining steps and resources based on your specific needs."
      }
    ]
  },
  {
    category: "Quests",
    questions: [
      {
        question: "What is the purpose of Quests?",
        answer: "Quests are time-bound learning challenges designed to keep you motivated and engaged. They provide specific objectives to accomplish within a set timeframe, helping you maintain consistent learning habits."
      },
      {
        question: "What types of questions are in Quests?",
        answer: "Quests contain two types of questions: 1) Short questions that test your theoretical knowledge, and 2) Coding questions that require you to write and execute code to solve practical problems."
      },
      {
        question: "How are Quests organized?",
        answer: "Quests are organized by their timing: upcoming quests that haven't started yet, active quests that you can currently participate in, and past quests that have been completed or expired."
      },
      {
        question: "How do Quests contribute to my learning?",
        answer: "Quests help maintain learning momentum by providing regular challenges. Completing quests contributes to your learning streak, appears in your progress metrics, and helps reinforce concepts through practical application."
      }
    ]
  },
  {
    category: "Dev Discuss",
    questions: [
      {
        question: "What is the purpose of Dev Discuss?",
        answer: "Dev Discuss is a community-driven forum where you can ask technical questions, share knowledge, and learn from other developers' experiences. It's designed to foster collaborative learning and problem-solving."
      },
      {
        question: "What makes Dev Discuss different from other forums?",
        answer: "Dev Discuss integrates with your learning journey by connecting questions to relevant roadmaps and quests. It also offers AI-generated responses as an option, combining community knowledge with AI assistance."
      },
      {
        question: "How do I get the most out of Dev Discuss?",
        answer: "Use descriptive titles, add relevant tags, and provide detailed context in your questions. Engage with others' questions, upvote helpful answers, and share your own knowledge. The more you participate, the more valuable the community becomes."
      },
      {
        question: "How does the AI response feature work?",
        answer: "When asking a question, you can opt to receive an AI-generated response alongside community answers. This feature helps you get immediate guidance while waiting for community responses."
      }
    ]
  },
  {
    category: "Playground",
    questions: [
      {
        question: "What is the purpose of the Playground?",
        answer: "The Playground is a collaborative coding environment designed for real-time code experimentation, pair programming, and interactive learning. It's perfect for working on coding challenges, getting help from others, or teaching coding concepts."
      },
      {
        question: "How can I use the Playground effectively?",
        answer: "Use the Playground for live coding sessions, debugging with peers, or practicing code from learning materials. Share your room ID to collaborate with others, and utilize the multi-language support for different programming needs."
      },
      {
        question: "What makes the Playground collaborative?",
        answer: "The Playground enables multiple users to code together in real-time. You can see others' cursors, chat while coding, and instantly see changes made by collaborators. This makes it ideal for pair programming and teaching sessions."
      },
      {
        question: "How does code execution work in the Playground?",
        answer: "Code can be executed directly in the Playground environment. The system supports multiple programming languages, provides real-time syntax highlighting, and shows execution output instantly. You can also save and share your code sessions."
      },
      {
        question: "Can I integrate Playground with other platform features?",
        answer: "Yes, the Playground works seamlessly with other features. Use it to solve quest challenges, work through roadmap exercises, or collaborate on questions from Dev Discuss. You can also use it alongside the Learn section's video tutorials."
      }
    ]
  }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);

  const filteredQuestions = searchQuery
    ? faqs
        .flatMap(category => 
          category.questions.map(q => ({ ...q, category: category.category }))
        )
        .filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Reset open question when category changes
  useEffect(() => {
    setOpenQuestionIndex(null);
  }, [activeCategory]);

  // Custom Disclosure component that manages open/close state
  const CustomDisclosure = ({ question, answer, index }) => {
    const isOpen = openQuestionIndex === index;

    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200">
        <button
          onClick={() => setOpenQuestionIndex(isOpen ? null : index)}
          className="w-full px-8 py-6 text-left flex justify-between items-center"
        >
          <span className="font-medium text-gray-900 pr-8">{question}</span>
          <FiChevronDown
            className={`${
              isOpen ? "transform rotate-180" : ""
            } w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200`}
          />
        </button>
        {isOpen && (
          <div className="px-8 py-6 text-gray-600 border-t border-gray-100 bg-gray-50">
            {answer}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              How can we help you today?
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Find instant answers or get in touch with our support team
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className={`relative transition-all duration-200 ${
                isSearchFocused ? 'transform -translate-y-1 shadow-lg' : 'shadow-md'
              }`}>
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full px-6 py-4 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="absolute -bottom-1 left-0 right-0 text-sm text-gray-500 px-4 py-2">
                  {filteredQuestions.length} results found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {searchQuery ? (
          // Search Results
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              Search Results
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {filteredQuestions.length}
              </span>
            </h2>
            {filteredQuestions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredQuestions.map((faq, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 mb-3">
                        {faq.category}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">{faq.question}</h3>
                      <p className="text-gray-600 line-clamp-3">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any matches for "{searchQuery}"
                </p>
                <button
                  onClick={() => window.location.href = '/faq/contact'}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contact Support
                </button>
              </div>
            )}
          </div>
        ) : (
          // Regular FAQ View
          <div>
            {/* Category Navigation */}
            <nav className="mb-12" aria-label="FAQ Categories">
              <div className="border-b border-gray-200">
                <div className="flex space-x-12 overflow-x-auto">
                  {faqs.map((category) => (
                    <button
                      key={category.category}
                      onClick={() => setActiveCategory(category.category)}
                      className={`py-4 px-1 border-b-2 font-medium whitespace-nowrap transition-colors duration-200 ${
                        activeCategory === category.category
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {category.category}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* FAQ Content */}
            <div className="space-y-4">
              {faqs
                .find((category) => category.category === activeCategory)
                ?.questions.map((faq, index) => (
                  <CustomDisclosure
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    index={index}
                  />
                ))}
            </div>

            {/* Contact Section */}
            <div className="mt-16">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Still have questions?</h3>
                  <p className="text-blue-100">Our support team is just a click away</p>
                </div>
                <button
                  onClick={() => window.location.href = '/faq/contact'}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
