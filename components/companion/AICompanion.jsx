"use client";

/**
 * AI Companion Chat Widget
 *
 * Floating chat interface for the multi-agent AI companion.
 * Supports text and voice input in Bengali and English.
 * Only available for authenticated users.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

// Agent icons mapping
const agentIcons = {
  learning: "📚",
  task: "📋",
  code: "💻",
  roadmap: "🗺️",
  general: "💬",
};

// Public routes where companion should be hidden
const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up"];

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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Don't render companion on public routes or when not authenticated
  if (!isLoaded) {
    return null; // Loading auth state
  }

  if (!isSignedIn) {
    return null; // Not authenticated
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return null; // On public route
  }

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

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

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

      // Cancel any ongoing speech
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

      // Handle HTTP errors
      if (!response.ok) {
        const errorMsg = data.error?.message || "Request failed";
        throw new Error(errorMsg);
      }

      // Validate response structure
      if (!data.success) {
        const errorMsg = data.error?.message || "Unknown error";
        throw new Error(errorMsg);
      }

      if (!data.data || typeof data.data.response !== "string") {
        throw new Error("Invalid response format from server");
      }

      const assistantMessage = {
        role: "assistant",
        content: data.data.response,
        agent: data.data.agent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.data.conversationId);

      // Speak response if voice enabled
      if (voiceEnabled) {
        speakText(data.data.response);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      // Check if authentication error
      if (error.message && error.message.includes("Authentication required")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              language === "bn"
                ? "দুঃখিত, AI সহকারী ব্যবহার করতে আপনাকে লগইন করতে হবে। অনুগ্রহ করে লগইন করুন।"
                : "Sorry, you need to be logged in to use the AI companion. Please sign in to continue.",
            timestamp: new Date().toISOString(),
            error: true,
          },
        ]);
        setIsLoading(false);
        return;
      }
      
      // Determine error message
      let errorContent;
      if (error.message.includes("GOOGLE_API_KEY")) {
        errorContent =
          language === "bn"
            ? "API কনফিগারেশন সমস্যা। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
            : "API configuration error. Please contact the administrator.";
      } else if (error.message.includes("RATE_LIMIT")) {
        errorContent =
          language === "bn"
            ? "অনেক বেশি অনুরোধ। অনুগ্রহ করে একটু পরে চেষ্টা করুন।"
            : "Too many requests. Please try again in a moment.";
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
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh] bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">
                  {language === "bn" ? "এআই সহকারী" : "AI Companion"}
                </span>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {language === "bn"
                      ? "হ্যালো! আমি আপনার এআই লার্নিং সহকারী। কিভাবে সাহায্য করতে পারি?"
                      : "Hello! I'm your AI learning companion. How can I help you today?"}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <span>{msg.agent ? agentIcons[msg.agent] : "🤖"}</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : msg.error
                        ? "bg-red-900/50 text-red-200 rounded-bl-sm"
                        : "bg-gray-800 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.agent && (
                      <span className="text-xs opacity-60 mt-1 block">
                        via {msg.agent} agent
                      </span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
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
