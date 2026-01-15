/**
 * Task Model
 * 
 * Stores user tasks for the task management system.
 * Supports categorization, prioritization, and linking to learning resources.
 */

import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 2000,
      default: "",
    },
    category: {
      type: String,
      enum: ["study", "assignment", "project", "revision", "exam", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    reminderTime: {
      type: Date,
      default: null,
    },
    // Link to learning resources
    linkedRoadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      default: null,
    },
    linkedQuest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quest",
      default: null,
    },
    // AI metadata
    aiSuggested: {
      type: Boolean,
      default: false,
    },
    aiReasoning: {
      type: String,
      default: null,
    },
    // Completion tracking
    completedAt: {
      type: Date,
      default: null,
    },
    // Tags for organization
    tags: [{
      type: String,
      trim: true,
    }],
    // Subtasks
    subtasks: [{
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
    }],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
taskSchema.index({ clerkId: 1, status: 1 });
taskSchema.index({ clerkId: 1, dueDate: 1 });
taskSchema.index({ clerkId: 1, priority: 1, status: 1 });
taskSchema.index({ clerkId: 1, category: 1 });
taskSchema.index({ clerkId: 1, order: 1 });

// Virtual for checking if overdue
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "completed") return false;
  return new Date() > this.dueDate;
});

// Method to mark as complete
taskSchema.methods.complete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

// Method to toggle subtask
taskSchema.methods.toggleSubtask = function (subtaskIndex) {
  if (this.subtasks[subtaskIndex]) {
    this.subtasks[subtaskIndex].completed = !this.subtasks[subtaskIndex].completed;
    this.subtasks[subtaskIndex].completedAt = this.subtasks[subtaskIndex].completed 
      ? new Date() 
      : null;
  }
  return this.save();
};

// Static method to get tasks due today
taskSchema.statics.getDueToday = function (clerkId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    clerkId,
    status: { $ne: "completed" },
    dueDate: { $gte: today, $lt: tomorrow },
  }).sort({ priority: -1 });
};

// Static method to get upcoming tasks
taskSchema.statics.getUpcoming = function (clerkId, days = 7) {
  const today = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return this.find({
    clerkId,
    status: { $ne: "completed" },
    dueDate: { $gte: today, $lte: future },
  }).sort({ dueDate: 1 });
};

// Force model recompilation to ensure schema updates are applied in dev
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Task;
}

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
