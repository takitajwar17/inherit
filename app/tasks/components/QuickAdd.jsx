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
    high: 'text-red-700 bg-red-50 border border-red-200',
    medium: 'text-yellow-700 bg-yellow-50 border border-yellow-200',
    low: 'text-blue-700 bg-blue-50 border border-blue-200',
  };

  const categoryColors = {
    study: 'text-blue-700 bg-blue-50 border border-blue-200',
    assignment: 'text-yellow-700 bg-yellow-50 border border-yellow-200',
    project: 'text-purple-700 bg-purple-50 border border-purple-200',
    revision: 'text-green-700 bg-green-50 border border-green-200',
    exam: 'text-red-700 bg-red-50 border border-red-200',
    other: 'text-gray-700 bg-gray-50 border border-gray-200',
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
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-primary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Study React tomorrow 2pm #study @high"
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-lg focus:outline-none"
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
                <span className="text-gray-600">Parsed as:</span>
                <span className="text-gray-900 font-medium">{parsedData.title}</span>
                
                {parsedData.dueDate && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                    <Calendar className="w-3 h-3" />
                    {formatDate(parsedData.dueDate)}
                  </span>
                )}
                
                {parsedData.category && parsedData.category !== 'other' && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${categoryColors[parsedData.category]}`}>
                    <Hash className="w-3 h-3" />
                    {parsedData.category}
                  </span>
                )}
                
                {parsedData.priority && parsedData.priority !== 'medium' && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityColors[parsedData.priority]}`}>
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
                className="border-t border-gray-200 p-2"
              >
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600">
                  <Sparkles className="w-3 h-3" />
                  <span>Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 flex items-center gap-1"
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
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
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
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

