"use client";

/**
 * AI Companion Chat Widget
 *
 * Floating chat interface for the multi-agent AI companion.
 * Supports text and voice input in Bengali and English.
 * Features streaming responses, markdown rendering, and full-screen mode.
 * Only available for authenticated users.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Loader2,
  Bot,
  User,
  Sparkles,
  Brain,
  Route,
  BookOpen,
  Code,
  ListTodo,
  Map,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Agent configuration with icons and colors
const agentConfig = {
  learning: {
    icon: BookOpen,
    emoji: "📚",
    label: "Learning",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  task: {
    icon: ListTodo,
    emoji: "📋",
    label: "Task Manager",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  code: {
    icon: Code,
    emoji: "💻",
    label: "Code Assistant",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  roadmap: {
    icon: Map,
    emoji: "🗺️",
    label: "Roadmap Navigator",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  general: {
    icon: Bot,
    emoji: "💬",
    label: "General",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
  router: {
    icon: Route,
    emoji: "🔀",
    label: "Routing",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
};

// Public routes where companion should be hidden
const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up"];

/**
 * Markdown Message Component
 * Renders AI responses with proper markdown formatting
 */
function MarkdownMessage({ content, className = "" }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-invert prose-sm max-w-none ${className}`}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-white mt-3 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-white mt-2 mb-1">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-200 mt-2 mb-1">
            {children}
          </h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm text-gray-100 mb-2 last:mb-0">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-gray-100 mb-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-gray-100 mb-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-gray-100">{children}</li>,
        // Code
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="bg-gray-700/50 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-gray-800/80 border border-gray-700 rounded-lg p-3 overflow-x-auto my-2">
              <code className="text-xs font-mono text-gray-100">
                {children}
              </code>
            </pre>
          );
        },
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline"
          >
            {children}
          </a>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-violet-500 pl-3 my-2 text-gray-300 italic">
            {children}
          </blockquote>
        ),
        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic text-gray-200">{children}</em>
        ),
        // Horizontal rule
        hr: () => <hr className="border-gray-700 my-3" />,
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border border-gray-700 rounded">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-gray-800 px-2 py-1 text-left text-gray-200 font-semibold border-b border-gray-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1 text-gray-300 border-b border-gray-700/50">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/**
 * Think State Indicator Component
 */
function ThinkStateIndicator({ status, agent }) {
  const config = agentConfig[agent] || agentConfig.general;
  const AgentIcon = config.icon;

  const statusMessages = {
    processing: "Processing...",
    context_loaded: "Context loaded",
    routing: "Finding best agent...",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 rounded-lg border border-gray-700"
    >
      <div className={`p-1.5 rounded-full ${config.bgColor}`}>
        {status === "routing" ? (
          <Brain className={`w-4 h-4 ${config.color} animate-pulse`} />
        ) : (
          <AgentIcon className={`w-4 h-4 ${config.color}`} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">
          {status === "routing" ? "Analyzing..." : config.label}
        </span>
        <span className="text-xs text-gray-500">
          {statusMessages[status] || "Thinking..."}
        </span>
      </div>
      <Loader2 className="w-3 h-3 text-violet-400 animate-spin ml-auto" />
    </motion.div>
  );
}

/**
 * Roadmap Preview Component
 */
function RoadmapPreview({ roadmap, onNavigate }) {
  if (!roadmap) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-violet-500/30"
    >
      <div className="flex items-center gap-2 mb-2">
        <Map className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-white">{roadmap.title}</span>
      </div>
      <div className="space-y-1">
        {roadmap.phases?.slice(0, 3).map((phase, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs text-gray-400"
          >
            <span className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
              {i + 1}
            </span>
            <span>{phase.name}</span>
            <span className="text-gray-600">• {phase.duration}</span>
          </div>
        ))}
        {roadmap.phases?.length > 3 && (
          <span className="text-xs text-gray-500">
            +{roadmap.phases.length - 3} more phases
          </span>
        )}
      </div>
      {roadmap.id && (
        <button
          onClick={() => onNavigate(`/roadmaps/${roadmap.id}`)}
          className="mt-2 w-full py-1.5 text-xs bg-violet-600 hover:bg-violet-700 rounded transition-colors text-white"
        >
          View Full Roadmap
        </button>
      )}
    </motion.div>
  );
}

export default function AICompanion() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Think state
  const [thinkState, setThinkState] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Don't render on public routes or when not authenticated
  if (!isLoaded) return null;
  if (!isSignedIn) return null;
  if (PUBLIC_ROUTES.includes(pathname)) return null;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Keyboard shortcuts (Escape to minimize/close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExpanded]);

  // Handle navigation action from agent
  const handleNavigation = useCallback(
    (route) => {
      router.push(route);
      // Keep chat open but show navigation message
    },
    [router]
  );

  // Handle actions from tool calls
  const handleAction = useCallback(
    (action) => {
      if (action.action === "navigate" && action.route) {
        handleNavigation(action.route);
      }
    },
    [handleNavigation]
  );

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      alert(
        language === "bn"
          ? "আপনার ব্রাউজার ভয়েস ইনপুট সমর্থন করে না"
          : "Your browser doesn't support voice input"
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language === "bn" ? "bn-BD" : "en-US";
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, language]);

  // Speak response
  const speakText = useCallback(
    (text) => {
      if (!synthRef.current || !voiceEnabled) return;
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "bn" ? "bn-BD" : "en-US";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [language, voiceEnabled]
  );

  // Send message with streaming
  const sendMessageStreaming = async (userMessage) => {
    setThinkState({ status: "processing", agent: "router" });
    setStreamingContent("");
    let fullContent = "";
    let currentAgent = null;
    let actions = [];
    let roadmapData = null;

    try {
      const response = await fetch("/api/companion?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to streaming endpoint");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];

            if (dataLine?.startsWith("data: ")) {
              try {
                const data = JSON.parse(dataLine.slice(6));

                switch (eventType) {
                  case "status":
                    setThinkState({
                      status: data.type,
                      agent: currentAgent || "router",
                    });
                    break;

                  case "agent_start":
                    currentAgent = data.agent;
                    setActiveAgent(data.agent);
                    setThinkState({ status: "thinking", agent: data.agent });
                    break;

                  case "content_delta":
                    fullContent += data.content;
                    setStreamingContent(fullContent);
                    break;

                  case "tool_call":
                    actions.push(data);
                    if (data.action === "render_roadmap" && data.roadmap) {
                      roadmapData = data.roadmap;
                    }
                    if (data.action === "navigate") {
                      handleAction(data);
                    }
                    break;

                  case "done":
                    setConversationId(data.conversationId);
                    setThinkState(null);
                    break;

                  case "error":
                    throw new Error(data.message);
                }
              } catch (e) {
                // JSON parse error, skip
              }
            }
          }
        }
      }

      // Add final message
      const assistantMessage = {
        role: "assistant",
        content: fullContent,
        agent: currentAgent,
        timestamp: new Date().toISOString(),
        roadmap: roadmapData,
        actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      if (voiceEnabled && fullContent) {
        speakText(fullContent);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    } finally {
      setThinkState(null);
      setActiveAgent(null);
    }
  };

  // Send message standard (fallback)
  const sendMessageStandard = async (userMessage) => {
    const response = await fetch("/api/companion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        conversationId,
        language,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || "Request failed");
    }

    const assistantMessage = {
      role: "assistant",
      content: data.data.response,
      agent: data.data.agent,
      timestamp: new Date().toISOString(),
      actions: data.data.actions,
    };

    // Handle actions
    if (data.data.actions) {
      for (const action of data.data.actions) {
        if (action.action === "render_roadmap" && action.roadmap) {
          assistantMessage.roadmap = action.roadmap;
        }
        if (action.action === "navigate") {
          handleAction(action);
        }
      }
    }

    setMessages((prev) => [...prev, assistantMessage]);
    setConversationId(data.data.conversationId);

    if (voiceEnabled) {
      speakText(data.data.response);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      if (useStreaming) {
        await sendMessageStreaming(userMessage);
      } else {
        await sendMessageStandard(userMessage);
      }
    } catch (error) {
      console.error("Chat error:", error);

      let errorContent;
      if (error.message?.includes("Authentication")) {
        errorContent =
          language === "bn"
            ? "দুঃখিত, AI সহকারী ব্যবহার করতে আপনাকে লগইন করতে হবে।"
            : "Sorry, you need to be logged in to use the AI companion.";
      } else {
        errorContent =
          language === "bn"
            ? `ত্রুটি: ${error.message}`
            : `Error: ${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorContent,
          error: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsLoading(false);
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "bn" : "en"));
  };

  // Get agent display info
  const getAgentDisplay = (agent) => {
    const config = agentConfig[agent] || agentConfig.general;
    return config;
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${
          isOpen ? "hidden" : ""
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-50 bg-gray-900 shadow-2xl flex flex-col overflow-hidden border border-gray-700 transition-all duration-300 ${
              isExpanded
                ? "inset-4 rounded-2xl"
                : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh] rounded-2xl"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">
                  {language === "bn" ? "এআই সহকারী" : "AI Companion"}
                </span>
                {activeAgent && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {getAgentDisplay(activeAgent).emoji}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  title={
                    isExpanded ? "Minimize (Esc)" : "Expand to full screen"
                  }
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setUseStreaming(!useStreaming)}
                  className={`p-1.5 rounded-full transition-colors ${
                    useStreaming ? "bg-white/20" : "hover:bg-white/20"
                  }`}
                  title={
                    useStreaming ? "Streaming enabled" : "Streaming disabled"
                  }
                >
                  <Zap
                    className={`w-4 h-4 ${
                      useStreaming ? "text-yellow-300" : "text-white/60"
                    }`}
                  />
                </button>
                <button
                  onClick={toggleLanguage}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  title={
                    language === "en"
                      ? "Switch to Bengali"
                      : "Switch to English"
                  }
                >
                  <Languages className="w-4 h-4 text-white" />
                  <span className="text-xs text-white ml-1">
                    {language.toUpperCase()}
                  </span>
                </button>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  title={voiceEnabled ? "Disable voice" : "Enable voice"}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Think State Indicator */}
            <AnimatePresence>
              {thinkState && (
                <div className="px-4 py-2 border-b border-gray-700">
                  <ThinkStateIndicator
                    status={thinkState.status}
                    agent={thinkState.agent}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !streamingContent && (
                <div className="text-center text-gray-400 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {language === "bn"
                      ? "হ্যালো! আমি আপনার এআই লার্নিং সহকারী। কিভাবে সাহায্য করতে পারি?"
                      : "Hello! I'm your AI learning companion. How can I help you today?"}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      "Show my progress",
                      "Create a roadmap",
                      "Go to tasks",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const agentDisplay = msg.agent
                  ? getAgentDisplay(msg.agent)
                  : null;
                const AgentIcon = agentDisplay?.icon || Bot;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          agentDisplay?.bgColor || "bg-violet-600/20"
                        }`}
                      >
                        <AgentIcon
                          className={`w-4 h-4 ${
                            agentDisplay?.color || "text-violet-400"
                          }`}
                        />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-violet-600 text-white rounded-br-sm"
                            : msg.error
                            ? "bg-red-900/50 text-red-200 rounded-bl-sm"
                            : "bg-gray-800 text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        ) : (
                          <MarkdownMessage content={msg.content} />
                        )}
                        {msg.agent && (
                          <span className="text-xs opacity-60 mt-1 block">
                            via {agentDisplay?.label || msg.agent}
                          </span>
                        )}
                      </div>

                      {/* Roadmap Preview */}
                      {msg.roadmap && (
                        <RoadmapPreview
                          roadmap={msg.roadmap}
                          onNavigate={handleNavigation}
                        />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Streaming content */}
              {streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activeAgent
                        ? getAgentDisplay(activeAgent).bgColor
                        : "bg-violet-600/20"
                    }`}
                  >
                    {activeAgent ? (
                      React.createElement(getAgentDisplay(activeAgent).icon, {
                        className: `w-4 h-4 ${
                          getAgentDisplay(activeAgent).color
                        }`,
                      })
                    ) : (
                      <Bot className="w-4 h-4 text-violet-400" />
                    )}
                  </div>
                  <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                    <MarkdownMessage content={streamingContent} />
                    <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* Loading indicator (non-streaming) */}
              {isLoading && !useStreaming && !streamingContent && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  </div>
                  <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-gray-700"
            >
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-full transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "আপনার প্রশ্ন লিখুন..."
                      : "Type your message..."
                  }
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
