"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const QuestPageLoader = () => {
  const loadingPhrases = [
    "Loading available quests...",
    "Retrieving challenge data...",
    "Preparing assessment content...",
    "Loading quest objectives...",
    "Initializing challenge platform..."
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
        />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-medium text-gray-700"
        >
          {loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const QuestAttemptLoader = () => {
  const loadingPhrases = [
    "Initializing assessment environment...",
    "Loading question bank...",
    "Preparing evaluation system...",
    "Setting up challenge parameters...",
    "Configuring assessment tools..."
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 mx-auto mb-6 text-4xl"
        >
          🎯
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl font-medium text-gray-700"
        >
          {loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const QuestResultsLoader = () => {
  const loadingPhrases = [
    "Processing assessment results...",
    "Analyzing performance metrics...",
    "Generating performance report...",
    "Compiling evaluation data...",
    "Finalizing assessment scores..."
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 mx-auto mb-6 text-4xl"
        >
          📊
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-medium text-gray-700"
        >
          {loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const SubmissionLoader = ({ message }) => {
  const defaultMessage = "Processing submission...";
  const [displayMessage, setDisplayMessage] = useState(message || defaultMessage);
  const messages = [
    "Evaluating responses...",
    "Processing assessment data...",
    "Analyzing submission...",
    "Computing results...",
    "Finalizing evaluation..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 -translate-x-full"
          animate={{
            translateX: ["100%", "-100%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)"
          }}
        />
        
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="text-4xl mb-4 mx-auto"
        >
          📋
        </motion.div>

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-lg font-medium text-gray-800"
        >
          {displayMessage}
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex justify-center space-x-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
