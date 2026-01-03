"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing roadmap step completion progress
 * Handles localStorage persistence and provides progress calculations
 * 
 * @param {string} roadmapId - The unique identifier for the roadmap
 * @param {number} totalSteps - Total number of steps in the roadmap
 * @param {Object} options - Optional configuration
 * @param {Function} options.onStepComplete - Callback when a step is marked complete
 * @param {Function} options.onAllComplete - Callback when all steps are completed
 * @returns {Object} Progress state and control functions
 */
export function useRoadmapProgress(roadmapId, totalSteps = 0, options = {}) {
  const { onStepComplete, onAllComplete } = options;
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    if (!roadmapId) return;

    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') return;

      const saved = localStorage.getItem(`roadmap-${roadmapId}-progress`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      }
    } catch (error) {
      console.error('Failed to load roadmap progress from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [roadmapId]);

  /**
   * Save progress to localStorage
   * @param {Set<number>} steps - Set of completed step indices
   */
  const saveProgress = useCallback((steps) => {
    if (!roadmapId) return;

    try {
      if (typeof window === 'undefined') return;

      localStorage.setItem(
        `roadmap-${roadmapId}-progress`,
        JSON.stringify([...steps])
      );
    } catch (error) {
      console.error('Failed to save roadmap progress to localStorage:', error);
    }
  }, [roadmapId]);

  /**
   * Toggle a step's completion status
   * @param {number} stepIndex - Index of the step to toggle
   * @returns {boolean} Whether the step is now completed
   */
  const toggleStep = useCallback((stepIndex) => {
    let isNowCompleted = false;

    setCompletedSteps((prev) => {
      const newSteps = new Set(prev);
      
      if (newSteps.has(stepIndex)) {
        // Uncompleting a step
        newSteps.delete(stepIndex);
        isNowCompleted = false;
      } else {
        // Completing a step
        newSteps.add(stepIndex);
        isNowCompleted = true;

        // Check if this completes all steps
        const willBeAllComplete = newSteps.size === totalSteps && totalSteps > 0;
        
        // Trigger callbacks (using setTimeout to avoid state update during render)
        setTimeout(() => {
          if (isNowCompleted && onStepComplete) {
            onStepComplete(stepIndex, willBeAllComplete);
          }
          if (willBeAllComplete && onAllComplete) {
            onAllComplete();
          }
        }, 0);
      }

      saveProgress(newSteps);
      return newSteps;
    });

    return isNowCompleted;
  }, [totalSteps, saveProgress, onStepComplete, onAllComplete]);

  /**
   * Mark a specific step as complete
   * @param {number} stepIndex - Index of the step to complete
   */
  const completeStep = useCallback((stepIndex) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepIndex)) return prev;
      
      const newSteps = new Set(prev);
      newSteps.add(stepIndex);
      saveProgress(newSteps);
      
      // Check if all complete
      const isAllComplete = newSteps.size === totalSteps && totalSteps > 0;
      
      setTimeout(() => {
        if (onStepComplete) {
          onStepComplete(stepIndex, isAllComplete);
        }
        if (isAllComplete && onAllComplete) {
          onAllComplete();
        }
      }, 0);
      
      return newSteps;
    });
  }, [totalSteps, saveProgress, onStepComplete, onAllComplete]);

  /**
   * Mark a specific step as incomplete
   * @param {number} stepIndex - Index of the step to uncomplete
   */
  const uncompleteStep = useCallback((stepIndex) => {
    setCompletedSteps((prev) => {
      if (!prev.has(stepIndex)) return prev;
      
      const newSteps = new Set(prev);
      newSteps.delete(stepIndex);
      saveProgress(newSteps);
      return newSteps;
    });
  }, [saveProgress]);

  /**
   * Reset all progress for this roadmap
   */
  const resetProgress = useCallback(() => {
    setCompletedSteps(new Set());
    saveProgress(new Set());
  }, [saveProgress]);

  /**
   * Check if a specific step is completed
   * @param {number} stepIndex - Index of the step to check
   * @returns {boolean} Whether the step is completed
   */
  const isStepCompleted = useCallback((stepIndex) => {
    return completedSteps.has(stepIndex);
  }, [completedSteps]);

  // Calculate progress percentage
  const progress = totalSteps > 0
    ? Math.round((completedSteps.size / totalSteps) * 100)
    : 0;

  // Check if all steps are completed
  const isComplete = completedSteps.size === totalSteps && totalSteps > 0;

  return {
    // State
    completedSteps,
    completedCount: completedSteps.size,
    progress,
    isComplete,
    isLoaded,
    
    // Actions
    toggleStep,
    completeStep,
    uncompleteStep,
    resetProgress,
    isStepCompleted,
  };
}

/**
 * Get roadmap progress from localStorage without React state
 * Useful for displaying progress in lists without full hook overhead
 * 
 * @param {string} roadmapId - The unique identifier for the roadmap
 * @param {number} totalSteps - Total number of steps in the roadmap
 * @returns {Object} Progress information
 */
export function getRoadmapProgress(roadmapId, totalSteps = 0) {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return { completedCount: 0, progress: 0, isComplete: false };
  }

  try {
    const saved = localStorage.getItem(`roadmap-${roadmapId}-progress`);
    if (!saved) {
      return { completedCount: 0, progress: 0, isComplete: false };
    }

    const completedSteps = JSON.parse(saved);
    const completedCount = Array.isArray(completedSteps) ? completedSteps.length : 0;
    const progress = totalSteps > 0 
      ? Math.round((completedCount / totalSteps) * 100) 
      : 0;
    const isComplete = completedCount === totalSteps && totalSteps > 0;

    return { completedCount, progress, isComplete };
  } catch (error) {
    console.error('Failed to get roadmap progress:', error);
    return { completedCount: 0, progress: 0, isComplete: false };
  }
}

export default useRoadmapProgress;

