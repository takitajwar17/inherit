"use client";

/**
 * TaskDetail Component
 * 
 * Expanded task view with subtasks, notes, and activity
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Flag,
  Hash,
  Clock,
  Check,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  Activity,
} from "lucide-react";

const priorityConfig = {
  high: { color: "text-red-400", bg: "bg-red-500/20", label: "High Priority" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Medium Priority" },
  low: { color: "text-blue-400", bg: "bg-blue-500/20", label: "Low Priority" },
};

const categoryConfig = {
  study: { color: "text-blue-400", label: "Study" },
  assignment: { color: "text-yellow-400", label: "Assignment" },
  project: { color: "text-purple-400", label: "Project" },
  revision: { color: "text-green-400", label: "Revision" },
  exam: { color: "text-red-400", label: "Exam" },
  other: { color: "text-gray-400", label: "Other" },
};

export default function TaskDetail({ task, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");
  const [notes, setNotes] = useState(task.notes || "");
  const [activeTab, setActiveTab] = useState("details"); // 'details', 'activity'

  const handleSave = () => {
    onUpdate({
      ...editedTask,
      subtasks,
      notes,
    });
    setIsEditing(false);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const newSubtaskObj = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
    };
    
    setSubtasks([...subtasks, newSubtaskObj]);
    setNewSubtask("");
  };

  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    ));
  };

  const deleteSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const formatDate = (date) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCompletionPercentage = () => {
    if (subtasks.length === 0) return task.status === "completed" ? 100 : 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => onUpdate({ ...task, status: task.status === "completed" ? "pending" : "completed" })}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.status === "completed"
                  ? "bg-green-500 border-green-500"
                  : "border-gray-400 hover:border-violet-500"
              }`}
            >
              {task.status === "completed" && <Check className="w-4 h-4 text-white" />}
            </button>
            
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="flex-1 bg-gray-700 text-white text-xl font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
            ) : (
              <h2 className={`text-xl font-bold flex-1 ${
                task.status === "completed" ? "text-gray-500 line-through" : "text-white"
              }`}>
                {task.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-white font-medium"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit3 className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this task?")) {
                      onDelete(task._id);
                      onClose();
                    }
                  }}
                  className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {subtasks.length > 0 && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getCompletionPercentage()}%` }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-violet-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "activity"
                ? "border-violet-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Activity
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "details" ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Due Date</div>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                          className="bg-gray-700 text-white text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      ) : (
                        <div className="text-sm text-white">{formatDate(task.dueDate)}</div>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="flex items-start gap-3">
                    <Flag className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Priority</div>
                      {isEditing ? (
                        <select
                          value={editedTask.priority}
                          onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                          className="bg-gray-700 text-white text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      ) : (
                        <div className={`text-sm ${priorityConfig[task.priority]?.color}`}>
                          {priorityConfig[task.priority]?.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Category</div>
                      {isEditing ? (
                        <select
                          value={editedTask.category}
                          onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
                          className="bg-gray-700 text-white text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {Object.entries(categoryConfig).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`text-sm ${categoryConfig[task.category]?.color}`}>
                          {categoryConfig[task.category]?.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Created</div>
                      <div className="text-sm text-white">
                        {new Date(task.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Description</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editedTask.description || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      placeholder="Add a description..."
                      className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-none"
                    />
                  ) : (
                    <div className="text-sm text-gray-300 bg-gray-900 rounded-lg p-3">
                      {task.description || "No description"}
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">
                        Subtasks ({subtasks.filter(st => st.completed).length}/{subtasks.length})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 group"
                      >
                        <button
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            subtask.completed
                              ? "bg-green-500 border-green-500"
                              : "border-gray-400 hover:border-violet-500"
                          }`}
                        >
                          {subtask.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            subtask.completed
                              ? "text-gray-500 line-through"
                              : "text-white"
                          }`}
                        >
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}

                    {/* Add Subtask */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                        placeholder="Add a subtask..."
                        className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={addSubtask}
                        className="p-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Notes</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-none"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">Activity Log</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-2"></div>
                    <div>
                      <div className="text-white">Task created</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {task.status === "completed" && (
                    <div className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <div className="text-white">Task completed</div>
                        <div className="text-gray-500 text-xs">
                          {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

