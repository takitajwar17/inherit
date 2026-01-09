/**
 * Conversation Model
 * 
 * Stores conversation history for the AI companion.
 * Tracks messages, active agent, and learning context.
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  agent: {
    type: String,
    enum: ["learning", "task", "code", "roadmap", "general", "router"],
    default: null,
  },
  language: {
    type: String,
    enum: ["en", "bn"],
    default: "en",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    messages: [messageSchema],
    activeAgent: {
      type: String,
      enum: ["learning", "task", "code", "roadmap", "general"],
      default: "general",
    },
    context: {
      currentRoadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Roadmap",
        default: null,
      },
      currentQuest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest",
        default: null,
      },
      activeTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
      },
      lastTopic: {
        type: String,
        default: null,
      },
    },
    language: {
      type: String,
      enum: ["en", "bn"],
      default: "en",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
conversationSchema.index({ clerkId: 1, isActive: 1 });
conversationSchema.index({ clerkId: 1, updatedAt: -1 });

// Virtual for message count
conversationSchema.virtual("messageCount").get(function () {
  return this.messages.length;
});

// Method to add a message
conversationSchema.methods.addMessage = function (role, content, agent, language) {
  this.messages.push({
    role,
    content,
    agent,
    language: language || this.language,
    timestamp: new Date(),
  });
  return this.save();
};

// Method to get recent messages (for context)
conversationSchema.methods.getRecentMessages = function (limit = 10) {
  return this.messages.slice(-limit);
};

const Conversation =
  mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

export default Conversation;
