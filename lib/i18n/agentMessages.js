/**
 * Centralized i18n Messages for AI Agents
 * 
 * Provides bilingual (English/Bengali) messages for all agents.
 * Eliminates duplicate error messages across agent files.
 * 
 * @module lib/i18n/agentMessages
 */

/**
 * Get a translated message by key and language
 * @param {string} key - Message key (e.g., 'errors.general')
 * @param {string} language - Language code ('en' or 'bn')
 * @param {Object} variables - Optional variables to interpolate
 * @returns {string} Translated message
 */
export function getMessage(key, language = 'en', variables = {}) {
  const keys = key.split('.');
  let message = MESSAGES;
  
  for (const k of keys) {
    message = message?.[k];
    if (!message) {
      console.warn(`Missing i18n message for key: ${key}`);
      return key;
    }
  }
  
  const text = message[language] || message.en;
  
  // Simple variable interpolation
  return Object.entries(variables).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`{${key}}`, 'g'), value);
  }, text);
}

/**
 * Message catalog organized by category
 */
export const MESSAGES = {
  // Greeting messages
  greetings: {
    welcome: {
      en: "Hello {name}! I'm your AI learning companion. How can I help you today?",
      bn: "হ্যালো {name}! আমি আপনার এআই লার্নিং সহকারী। আজ আমি কিভাবে সাহায্য করতে পারি?"
    },
    warmWelcome: {
      en: "Hi {name}! Ready to learn something new?",
      bn: "হাই {name}! নতুন কিছু শিখতে প্রস্তুত?"
    },
    general: {
      en: "Hello! I'm here to help. What can I assist you with?",
      bn: "হ্যালো! আমি আপনাকে সাহায্য করতে এখানে আছি। কিভাবে সাহায্য করতে পারি?"
    }
  },

  // Error messages
  errors: {
    general: {
      en: "Sorry, I encountered an issue. Please try again.",
      bn: "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
    },
    processing: {
      en: "I'm sorry, I couldn't process that request. Please try again.",
      bn: "দুঃখিত, আমি সেই অনুরোধটি প্রক্রিয়া করতে পারিনি। আবার চেষ্টা করুন।"
    },
    modelError: {
      en: "I'm having trouble connecting to my AI service. Please try again in a moment.",
      bn: "আমার এআই সেবার সাথে সংযোগে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।"
    },
    connection: {
      en: "Connection error. Please check your internet and try again.",
      bn: "সংযোগ ত্রুটি। আপনার ইন্টারনেট চেক করুন এবং আবার চেষ্টা করুন।"
    }
  },

  // Gratitude responses
  gratitude: {
    thankYou: {
      en: "You're welcome! Happy to help anytime.",
      bn: "আপনাকে স্বাগতম! যেকোনো সময় সাহায্য করতে খুশি।"
    },
    thankYouMotivation: {
      en: "You're welcome! Keep up the great learning!",
      bn: "আপনাকে স্বাগতম! দুর্দান্ত শেখা চালিয়ে যান!"
    }
  },

  // Help messages
  help: {
    confused: {
      en: "No worries! I'm here to help. Could you tell me more about what you need?",
      bn: "চিন্তা করবেন না! আমি সাহায্য করতে এখানে আছি। আপনার কী প্রয়োজন তা আরও বলতে পারেন?"
    },
    navigation: {
      en: "I can help you navigate the platform. What would you like to explore?",
      bn: "আমি আপনাকে প্ল্যাটফর্মটি নেভিগেট করতে সাহায্য করতে পারি। আপনি কী অন্বেষণ করতে চান?"
    }
  },

  // Support and motivation
  support: {
    stressed: {
      en: "I understand learning can be challenging. Take a deep breath - you've got this! Let's break it down together.",
      bn: "আমি বুঝি শেখা চ্যালেঞ্জিং হতে পারে। একটি গভীর শ্বাস নিন - আপনি এটি পারবেন! চলুন একসাথে ভেঙে ফেলি।"
    },
    encouragement: {
      en: "You're doing great! Keep going, every step counts.",
      bn: "আপনি দুর্দান্ত করছেন! চালিয়ে যান, প্রতিটি পদক্ষেপ গুরুত্বপূর্ণ।"
    },
    tired: {
      en: "It's okay to take breaks! Learning is a marathon, not a sprint. Come back when you're refreshed.",
      bn: "বিরতি নেওয়া ঠিক আছে! শেখা একটি ম্যারাথন, স্প্রিন্ট নয়। রিফ্রেশ হয়ে ফিরে আসুন।"
    }
  },

  // Learning-specific messages
  learning: {
    conceptExplained: {
      en: "I hope that helps clarify {concept}! Would you like to explore more?",
      bn: "{concept} পরিষ্কার করতে সাহায্য করেছে আশা করি! আরও অন্বেষণ করতে চান?"
    },
    needMoreInfo: {
      en: "Could you provide more details about what you'd like to learn?",
      bn: "আপনি কী শিখতে চান সে সম্পর্কে আরও বিস্তারিত জানাতে পারেন?"
    }
  },

  // Task management messages
  tasks: {
    created: {
      en: "Task created successfully! I've added it to your list.",
      bn: "টাস্ক সফলভাবে তৈরি হয়েছে! আমি এটি আপনার তালিকায় যোগ করেছি।"
    },
    completed: {
      en: "Great job completing that task! 🎉",
      bn: "সেই টাস্কটি সম্পূর্ণ করার জন্য দুর্দান্ত কাজ! 🎉"
    },
    noTasks: {
      en: "You don't have any tasks at the moment. Would you like to create one?",
      bn: "এই মুহূর্তে আপনার কোনো টাস্ক নেই। একটি তৈরি করতে চান?"
    }
  },

  // Code assistance messages
  code: {
    debugHelp: {
      en: "Let me help you debug that code. I'll analyze it step by step.",
      bn: "আমাকে সেই কোড ডিবাগ করতে সাহায্য করতে দিন। আমি ধাপে ধাপে বিশ্লেষণ করব।"
    },
    reviewComplete: {
      en: "Code review complete! Here are my suggestions:",
      bn: "কোড রিভিউ সম্পূর্ণ! এখানে আমার পরামর্শ:"
    },
    needCode: {
      en: "Please share the code you'd like me to help with.",
      bn: "আপনি যে কোডটিতে সাহায্য চান তা শেয়ার করুন।"
    }
  },

  // Roadmap messages
  roadmap: {
    progress: {
      en: "You're making great progress on your learning journey!",
      bn: "আপনি আপনার শেখার যাত্রায় দুর্দান্ত অগ্রগতি করছেন!"
    },
    nextTopic: {
      en: "Ready for the next topic? Let's continue!",
      bn: "পরবর্তী বিষয়ের জন্য প্রস্তুত? চলুন চালিয়ে যাই!"
    }
  },

  // System messages
  system: {
    processing: {
      en: "Processing your request...",
      bn: "আপনার অনুরোধ প্রক্রিয়া করা হচ্ছে..."
    },
    thinking: {
      en: "Let me think about that...",
      bn: "আমাকে সেটা নিয়ে ভাবতে দিন..."
    }
  }
};

/**
 * Quick access helper functions for common messages
 */
export const m = {
  greeting: (lang = 'en') => getMessage('greetings.welcome', lang),
  error: (lang = 'en') => getMessage('errors.general', lang),
  thankYou: (lang = 'en') => getMessage('gratitude.thankYou', lang),
  help: (lang = 'en') => getMessage('help.confused', lang),
  support: (lang = 'en') => getMessage('support.encouragement', lang),
};

export default { getMessage, MESSAGES, m };
