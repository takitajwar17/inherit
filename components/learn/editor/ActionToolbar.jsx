"use client";

import { FaPlay, FaRobot, FaBug, FaCheck } from 'react-icons/fa';
import { FiTerminal, FiCode } from 'react-icons/fi';

const ActionToolbar = ({
  onRun,
  onReview,
  onTabChange,
  activeTab,
  isRunning,
  isReviewing,
  hasOutput,
  hasReview,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
      {/* Left side - Main actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            isRunning
              ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <FaPlay className="animate-pulse" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <FaPlay />
              <span>Run Code</span>
            </>
          )}
        </button>

        <button
          onClick={onReview}
          disabled={isReviewing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            isReviewing
              ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isReviewing ? (
            <>
              <FaRobot className="animate-pulse" />
              <span>Reviewing...</span>
            </>
          ) : (
            <>
              <FaRobot />
              <span>Get AI Review</span>
            </>
          )}
        </button>
      </div>

      {/* Right side - View toggles */}
      <div className="flex items-center rounded-lg bg-gray-900/50 p-1">
        <button
          onClick={() => onTabChange('editor')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'editor'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FiCode />
          <span>Editor</span>
        </button>

        <button
          onClick={() => onTabChange('output')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'output'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FiTerminal />
          <span>Output</span>
          {hasOutput && activeTab !== 'output' && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>

        <button
          onClick={() => onTabChange('review')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'review'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FaRobot />
          <span>Review</span>
          {hasReview && activeTab !== 'review' && (
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ActionToolbar;
