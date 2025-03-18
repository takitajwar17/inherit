'use client';  // Ensure this is present for client-side rendering

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaAccessibleIcon, FaKeyboard, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const AccessibilityFloatingIcon = () => {
  const [isListening, setIsListening] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textInputRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  const processVoiceCommand = async (transcript) => {
    try {
      const response = await fetch('/api/voice-routing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.route) {
        router.push(data.route);
      } else {
        console.log('No matching route found for command:', transcript);
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
    }
  };

  const voiceCommandRouting = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Recognized speech:', transcript);
        
        processVoiceCommand(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Voice recognition ended');
      };

      recognition.start();
    } else {
      console.warn('Web Speech API is not supported in this browser');
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textCommand.trim()) {
      processVoiceCommand(textCommand.trim());
      setTextCommand('');
      setShowTextInput(false);
      setIsExpanded(false);
    }
  };

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Reset states when opening menu
      setIsListening(false);
      setShowTextInput(false);
    }
  };
  
  const handleVoiceOption = () => {
    voiceCommandRouting();
    setShowTextInput(false);
  };
  
  const handleTextOption = () => {
    setShowTextInput(true);
    setIsListening(false);
    
    // Focus the text input
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
        setShowTextInput(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);
  
  // Close menu after successful voice recognition
  useEffect(() => {
    if (!isListening && isExpanded) {
      // Small delay to allow for processing
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isListening, isExpanded]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end" ref={menuRef}>
      {/* Text input form */}
      {showTextInput && (
        <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 animate-fade-in">
          <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
            <input
              ref={textInputRef}
              type="text"
              value={textCommand}
              onChange={(e) => setTextCommand(e.target.value)}
              placeholder="Type your command..."
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200"
              aria-label="Type accessibility command"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center justify-center shadow-md"
              aria-label="Submit text command"
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      )}
      
      {/* Option buttons that appear when main button is clicked */}
      {isExpanded && !showTextInput && (
        <div className="mb-2 flex space-x-2 animate-fade-in">
          <button
            onClick={handleVoiceOption}
            className={`
              p-3 rounded-full shadow-lg 
              ${isListening 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
              } 
              transition-all duration-300 
              flex items-center justify-center 
              w-12 h-12
              transform hover:scale-105
            `}
            aria-label="Voice Commands"
          >
            <FaMicrophone size={20} />
          </button>
          
          <button
            onClick={handleTextOption}
            className={`
              p-3 rounded-full shadow-lg 
              bg-purple-500 text-white hover:bg-purple-600
              transition-all duration-300 
              flex items-center justify-center 
              w-12 h-12
              transform hover:scale-105
            `}
            aria-label="Text Commands"
          >
            <FaKeyboard size={20} />
          </button>
        </div>
      )}
      
      {/* Main accessibility button */}
      <button 
        onClick={toggleMenu}
        className={`
          p-3 rounded-full shadow-lg 
          ${isExpanded 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
          } 
          transition-all duration-300 
          flex items-center justify-center 
          w-14 h-14
          transform ${isExpanded ? 'rotate-45' : ''} hover:scale-105
          ${isListening ? 'animate-pulse' : ''}
        `}
        aria-label={isExpanded ? "Close accessibility menu" : "Open accessibility menu"}
      >
        {isExpanded ? <FaTimes size={24} /> : <FaAccessibleIcon size={24} />}
      </button>
    </div>
  );
};

export default AccessibilityFloatingIcon;