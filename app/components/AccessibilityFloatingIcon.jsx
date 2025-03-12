'use client';  // Ensure this is present for client-side rendering

import React, { useState } from 'react';
import { FaMicrophone, FaAccessibleIcon } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const AccessibilityFloatingIcon = () => {
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();

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

        const routes = {
          'home': '/',
          'dashboard': '/dashboard',
          'learn': '/learn',
          'roadmaps': '/roadmaps',
          'road maps': '/roadmaps',
          'discuss':'/dev-discuss',
          'dev discuss': '/dev-discuss',
          'quest':'/quests',
          'quests':'/quests',
          'playground': '/playground',
          'play ground':'/playground',
          'help':'/faq',
          'ask-questions':'dev-discuss/ask-questions',
          'ask':'dev-discuss/ask-questions',
          
          
        };

        if (routes[transcript]) {
          router.push(routes[transcript]);
        }
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={voiceCommandRouting}
        className={`
          p-3 rounded-full shadow-lg 
          ${isListening 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
          } 
          transition-colors duration-300 
          flex items-center justify-center 
          w-12 h-12  // Ensure visibility
        `}
        aria-label="Accessibility Voice Commands"
      >
        {isListening ? <FaMicrophone size={24} /> : <FaAccessibleIcon size={24} />}
      </button>
    </div>
  );
};

export default AccessibilityFloatingIcon;