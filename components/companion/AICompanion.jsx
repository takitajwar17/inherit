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
import { usePathname } from "next/navigation";
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
 * Voice Mode Component - ChatGPT-style full-screen voice interface
 */
function VoiceMode({ isOpen, onClose, language, onSendMessage, isLoading }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [status, setStatus] = useState("idle"); // idle, listening, processing, speaking

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const autoSendTimeoutRef = useRef(null);
  const finalizedTextRef = useRef(""); // Track finalized text separately

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === "bn" ? "bn-BD" : "en-US";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Add to finalized text (won't change)
            finalizedTextRef.current += text + " ";
          } else {
            // Interim results (may change)
            interimTranscript += text;
          }
        }

        // Display finalized + current interim
        setTranscript((finalizedTextRef.current + interimTranscript).trim());

        // Auto-send after 2 seconds of silence (only when we have finalized text)
        if (finalizedTextRef.current.trim()) {
          if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
          }
          autoSendTimeoutRef.current = setTimeout(() => {
            handleSend();
          }, 2000);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
          setStatus("idle");
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still in listening mode
        if (isListening && status === "listening") {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Already started
          }
        }
      };
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Auto-start listening when voice mode opens
    startListening();

    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, [isOpen, language]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        finalizedTextRef.current = ""; // Reset finalized text
        recognitionRef.current.start();
        setIsListening(true);
        setStatus("listening");
        setTranscript("");
        setAiResponse("");
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!transcript.trim()) return;

    stopListening();
    setStatus("processing");

    const messageToSend = transcript.trim();
    setTranscript("");

    try {
      // Send message and get response
      const response = await onSendMessage(messageToSend);

      if (response) {
        setAiResponse(response);
        speakResponse(response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("idle");
      startListening();
    }
  };

  const speakResponse = (text) => {
    if (!synthRef.current) return;

    setStatus("speaking");
    setIsSpeaking(true);
    synthRef.current.cancel();

    // Clean text for speech - remove markdown and emojis
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
      .replace(/\*(.*?)\*/g, "$1") // Italic
      .replace(/`(.*?)`/g, "$1") // Inline code
      .replace(/```[\s\S]*?```/g, "") // Code blocks
      .replace(/#{1,6}\s/g, "") // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/[-*+]\s/g, "") // List markers
      .replace(/\n+/g, ". ") // Newlines to pauses
      // Remove all emojis
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
        ""
      )
      .replace(/\s+/g, " ") // Multiple spaces to single
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set language and try to find the best voice
    const targetLang = language === "bn" ? "bn" : "en";
    utterance.lang = language === "bn" ? "bn-BD" : "en-US";

    // Try to find a suitable voice
    const voices = synthRef.current.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.startsWith(targetLang)) ||
      voices.find((v) => v.lang.includes(targetLang)) ||
      voices.find((v) =>
        language === "bn" ? v.lang.includes("hi") : v.lang.includes("en")
      ); // Hindi as fallback for Bengali

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus("listening");
      // Resume listening after speaking
      startListening();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      setStatus("idle");
    };

    synthRef.current.speak(utterance);
  };

  // Stop speech but keep response visible
  const stopSpeech = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setStatus("idle");
  };

  const handleClose = () => {
    stopListening();
    synthRef.current?.cancel();
    setStatus("idle");
    setTranscript("");
    setAiResponse("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 via-gray-900 to-black flex flex-col items-center justify-center"
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md border border-white/10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Language indicator */}
      <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm flex items-center gap-2 backdrop-blur-md">
        <Languages className="w-4 h-4 text-primary" />
        {language === "bn" ? "বাংলা" : "English"}
      </div>

      {/* Main animated circle */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings */}
        <motion.div
          animate={{
            scale:
              status === "listening"
                ? [1, 1.2, 1]
                : status === "speaking"
                ? [1, 1.3, 1]
                : 1,
            opacity: status === "idle" ? 0.3 : 0.6,
          }}
          transition={{
            duration: status === "speaking" ? 0.5 : 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl"
        />

        <motion.div
          animate={{
            scale:
              status === "listening"
                ? [1, 1.15, 1]
                : status === "speaking"
                ? [1, 1.25, 1]
                : 1,
            opacity: status === "idle" ? 0.4 : 0.7,
          }}
          transition={{
            duration: status === "speaking" ? 0.4 : 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          className="absolute w-52 h-52 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl"
        />

        {/* Main circle */}
        <motion.div
          animate={{
            scale:
              status === "listening"
                ? [1, 1.05, 1]
                : status === "speaking"
                ? [1, 1.1, 1]
                : 1,
          }}
          transition={{
            duration: status === "speaking" ? 0.3 : 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border border-white/10 backdrop-blur-md ${
            status === "listening"
              ? "bg-gradient-to-br from-primary to-secondary shadow-[0_0_60px_rgba(139,92,246,0.5)]"
              : status === "speaking"
              ? "bg-gradient-to-br from-fuchsia-500 to-primary shadow-[0_0_60px_rgba(236,72,153,0.5)]"
              : status === "processing"
              ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_0_60px_rgba(245,158,11,0.5)]"
              : "bg-gradient-to-br from-muted/50 to-muted/80 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          }`}
          onClick={() => {
            if (status === "listening") {
              handleSend();
            } else if (status === "idle") {
              startListening();
            }
          }}
        >
          {/* Inner wave animation for speaking */}
          {status === "speaking" && (
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [12, 32, 12],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-2 bg-white/80 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Microphone icon */}
          {status !== "speaking" && (
            <motion.div
              animate={{
                scale: status === "listening" ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              {status === "processing" ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 text-center"
      >
        <p className="text-2xl font-medium text-white mb-2">
          {status === "listening" &&
            (language === "bn" ? "শুনছি..." : "Listening...")}
          {status === "speaking" &&
            (language === "bn" ? "বলছি..." : "Speaking...")}
          {status === "processing" &&
            (language === "bn" ? "ভাবছি..." : "Thinking...")}
          {status === "idle" &&
            (language === "bn" ? "শুরু করতে ট্যাপ করুন" : "Tap to start")}
        </p>
        <p className="text-gray-400 text-sm">
          {status === "listening" &&
            (language === "bn"
              ? "আপনার প্রশ্ন জিজ্ঞাসা করুন"
              : "Ask me anything")}
          {status === "speaking" &&
            (language === "bn" ? "উত্তর দিচ্ছি" : "Responding to you")}
          {status === "processing" &&
            (language === "bn" ? "অপেক্ষা করুন" : "Please wait")}
        </p>
      </motion.div>

      {/* Transcript display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 max-w-lg mx-auto px-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-md">
            <p className="text-white text-center font-medium">{transcript}</p>
          </div>
        </motion.div>
      )}

      {/* AI Response display with Markdown */}
      {aiResponse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 max-w-2xl mx-auto px-6 max-h-[40vh] overflow-y-auto"
        >
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl px-6 py-4 backdrop-blur-md border border-white/10">
            <MarkdownMessage content={aiResponse} className="text-sm" />
          </div>
          {/* Stop Speech Button */}
          {status === "speaking" && (
            <button
              onClick={stopSpeech}
              className="mt-3 mx-auto flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-white text-sm transition-colors"
            >
              <VolumeX className="w-4 h-4" />
              {language === "bn" ? "স্পিচ বন্ধ করুন" : "Stop speaking"}
            </button>
          )}
        </motion.div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-8 text-center text-gray-500 text-sm">
        {language === "bn"
          ? "কথা বলুন অথবা বন্ধ করতে X চাপুন"
          : "Speak naturally or tap X to close"}
      </div>
    </motion.div>
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
function RoadmapPreview({ roadmap }) {
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
        <a
          href={`/roadmaps/${roadmap.id}`}
          className="mt-2 w-full py-1.5 text-xs bg-violet-600 hover:bg-violet-700 rounded transition-colors text-white block text-center"
        >
          View Full Roadmap
        </a>
      )}
    </motion.div>
  );
}

export default function AICompanion() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();

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
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);

  // Think state
  const [thinkState, setThinkState] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const conversationModeRef = useRef(false);
  const autoSendTimeoutRef = useRef(null);
  const lastTranscriptRef = useRef("");

  // Don't render on public routes or when not authenticated
  if (!isLoaded) return null;
  if (!isSignedIn) return null;
  if (PUBLIC_ROUTES.includes(pathname)) return null;

  // Initialize speech recognition with continuous mode support
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results in input
        if (interimTranscript) {
          setInput(lastTranscriptRef.current + interimTranscript);
        }

        // When we get a final result
        if (finalTranscript) {
          lastTranscriptRef.current += finalTranscript + " ";
          setInput(lastTranscriptRef.current.trim());

          // Clear any existing timeout
          if (autoSendTimeoutRef.current) {
            clearTimeout(autoSendTimeoutRef.current);
          }

          // Auto-send after 1.5 seconds of silence (in conversation mode)
          if (conversationModeRef.current) {
            autoSendTimeoutRef.current = setTimeout(() => {
              const messageToSend = lastTranscriptRef.current.trim();
              if (messageToSend) {
                // Trigger send
                lastTranscriptRef.current = "";
                setInput("");
                // Stop listening while processing
                recognitionRef.current?.stop();
                setIsListening(false);
                // Send the message by simulating form submit
                document.getElementById("companion-send-btn")?.click();
              }
            }, 1500);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart in conversation mode (unless we're processing)
        if (conversationModeRef.current && !isLoading && !isSpeaking) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Already started, ignore
          }
        } else {
          setIsListening(false);
        }
      };
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Cleanup
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, [isLoading, isSpeaking]);

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

  // Toggle voice input (single or conversation mode)
  const toggleVoiceInput = useCallback(
    (startConversationMode = false) => {
      if (!recognitionRef.current) {
        alert(
          language === "bn"
            ? "আপনার ব্রাউজার ভয়েস ইনপুট সমর্থন করে না"
            : "Your browser doesn't support voice input"
        );
        return;
      }

      if (isListening) {
        // Stop listening
        conversationModeRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
        lastTranscriptRef.current = "";
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current);
        }
      } else {
        // Start listening
        conversationModeRef.current = startConversationMode;
        recognitionRef.current.lang = language === "bn" ? "bn-BD" : "en-US";
        lastTranscriptRef.current = "";
        try {
          recognitionRef.current.start();
          setIsListening(true);
          // Enable voice output in conversation mode
          if (startConversationMode) {
            setVoiceEnabled(true);
          }
        } catch (e) {
          console.error("Failed to start speech recognition:", e);
        }
      }
    },
    [isListening, language]
  );

  // Speak response and restart listening in conversation mode
  const speakText = useCallback(
    (text) => {
      if (!synthRef.current || !voiceEnabled) return;
      synthRef.current.cancel();

      // Strip markdown for speech
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
        .replace(/\*(.*?)\*/g, "$1") // Italic
        .replace(/`(.*?)`/g, "$1") // Code
        .replace(/#{1,6}\s/g, "") // Headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
        .replace(/\n/g, ". "); // Newlines

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === "bn" ? "bn-BD" : "en-US";
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Restart listening in conversation mode
        if (conversationModeRef.current && recognitionRef.current) {
          try {
            lastTranscriptRef.current = "";
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            // Already started
          }
        }
      };
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
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        let currentEventType = null;

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("event:")) {
            currentEventType = trimmedLine.slice(6).trim();
          } else if (trimmedLine.startsWith("data:") && currentEventType) {
            try {
              const data = JSON.parse(trimmedLine.slice(5).trim());

              switch (currentEventType) {
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
            currentEventType = null; // Reset after processing
          } else if (trimmedLine === "") {
            currentEventType = null; // Empty line resets event
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

  // Send message for voice mode (returns response content)
  const sendMessageForVoice = async (userMessage) => {
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.data.conversationId);

      return data.data.response;
    } catch (error) {
      console.error("Voice mode error:", error);
      const errorMsg =
        language === "bn"
          ? "দুঃখিত, একটি সমস্যা হয়েছে।"
          : "Sorry, something went wrong.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
          error: true,
          timestamp: new Date().toISOString(),
        },
      ]);

      return errorMsg;
    }
  };

  return (
    <>
      {/* Voice Mode Full Screen Interface */}
      <AnimatePresence>
        {voiceModeOpen && (
          <VoiceMode
            isOpen={voiceModeOpen}
            onClose={() => setVoiceModeOpen(false)}
            language={language}
            onSendMessage={sendMessageForVoice}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${
          isOpen || voiceModeOpen ? "hidden" : ""
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
            className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl border border-white/10 shadow-2xl shadow-primary/20 ${
              isExpanded
                ? "inset-4 rounded-3xl bg-black/80"
                : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh] rounded-2xl bg-black/60"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/90 to-secondary/90 px-4 py-3 flex items-center justify-between backdrop-blur-md">
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
                {/* Voice Mode Button */}
                <button
                  onClick={() => {
                    setVoiceModeOpen(true);
                    setIsOpen(false);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors group"
                  title={language === "bn" ? "ভয়েস মোড" : "Voice Mode"}
                >
                  <Mic className="w-4 h-4 text-white group-hover:text-cyan-300 transition-colors" />
                </button>
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
                        className={`max-w-[85%] rounded-2xl p-4 shadow-lg backdrop-blur-md border ${
                          msg.role === "user"
                            ? "bg-primary/20 border-primary/30 text-white rounded-br-none ml-auto"
                            : msg.error
                            ? "bg-red-900/50 border-red-700/30 text-red-200 rounded-bl-none"
                            : "bg-white/5 border-white/10 text-gray-100 rounded-bl-none"
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
                      {msg.roadmap && <RoadmapPreview roadmap={msg.roadmap} />}
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
              className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md"
            >
              {/* Conversation mode indicator */}
              {conversationModeRef.current && isListening && (
                <div className="flex items-center justify-center gap-2 mb-2 text-xs text-violet-400">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  <span>
                    Conversation mode - speak naturally, I'm listening...
                  </span>
                </div>
              )}
              <div className="flex gap-2 items-center">
                {/* Single tap: one-shot voice, Long press: conversation mode */}
                <button
                  type="button"
                  onClick={() => toggleVoiceInput(false)}
                  onDoubleClick={() => toggleVoiceInput(true)}
                  className={`p-2 rounded-full transition-colors relative ${
                    isListening
                      ? conversationModeRef.current
                        ? "bg-violet-500 text-white animate-pulse"
                        : "bg-red-500 text-white animate-pulse"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                  title={
                    isListening
                      ? "Stop listening"
                      : "Click: Voice input | Double-click: Conversation mode"
                  }
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                  {/* Conversation mode indicator dot */}
                  {conversationModeRef.current && isListening && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-300 rounded-full border-2 border-gray-900" />
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? language === "bn"
                        ? "শুনছি..."
                        : "Listening..."
                      : language === "bn"
                      ? "আপনার প্রশ্ন লিখুন..."
                      : "Type your message..."
                  }
                  className="flex-1 bg-white/10 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 placeholder-gray-400"
                  disabled={isLoading}
                />

                <button
                  id="companion-send-btn"
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
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
