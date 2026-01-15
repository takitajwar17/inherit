"use client";

/**
 * QuickAdd Component
 * 
 * Todoist-style quick add input with natural language parsing
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Hash, Flag, Sparkles } from "lucide-react";
import { useNaturalLanguage } from "../hooks/useNaturalLanguage";

export default function QuickAdd({ onAdd, isOpen, onClose }) {
  const [input, setInput] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const { parseTaskInput, getSuggestions } = useNaturalLanguage();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Parse input on change
  useEffect(() => {
    if (input) {
      const parsed = parseTaskInput(input);
      setParsedData(parsed);
      const sugg = getSuggestions(input);
      setSuggestions(sugg);
      setShowSuggestions(sugg.length > 0);
    } else {
      setParsedData(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, parseTaskInput, getSuggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const parsed = parseTaskInput(input);
    onAdd(parsed);
    setInput("");
    setParsedData(null);
    setSuggestions([]);
    onClose();
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(input + ' ' + suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const formatDate = (date) => {
    if (!date) return null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateObj = new Date(date);
    
    if (dateObj.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const priorityColors = {
    high: 'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-blue-400 bg-blue-500/20',
  };

  const categoryColors = {
    study: 'text-blue-400 bg-blue-500/20',
    assignment: 'text-yellow-400 bg-yellow-500/20',
    project: 'text-purple-400 bg-purple-500/20',
    revision: 'text-green-400 bg-green-500/20',
    exam: 'text-red-400 bg-red-500/20',
    other: 'text-gray-400 bg-gray-500/20',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-32" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-4"
      >
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Study React tomorrow 2pm #study @high"
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none"
                autoComplete="off"
              />
            </div>

            {/* Parsed Preview */}
            {parsedData && parsedData.title && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="text-gray-400">Parsed as:</span>
                <span className="text-white font-medium">{parsedData.title}</span>
                
                {parsedData.dueDate && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(parsedData.dueDate)}
                  </span>
                )}
                
                {parsedData.category && parsedData.category !== 'other' && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded ${categoryColors[parsedData.category]}`}>
                    <Hash className="w-3 h-3" />
                    {parsedData.category}
                  </span>
                )}
                
                {parsedData.priority && parsedData.priority !== 'medium' && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded ${priorityColors[parsedData.priority]}`}>
                    <Flag className="w-3 h-3" />
                    {parsedData.priority}
                  </span>
                )}
              </motion.div>
            )}
          </form>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-700 p-2"
              >
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3" />
                  <span>Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 flex items-center gap-1"
                    >
                      <span>{suggestion.icon}</span>
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                #category
              </span>
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                @priority
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                dates (today, tomorrow, Monday)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

