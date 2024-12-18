"use client";

import { useState, useEffect } from 'react';
import { FiGitBranch, FiClock } from 'react-icons/fi';

const EditorFooter = ({ language, position, wordCount, lastSaved }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSaved = (date) => {
    if (!date) return 'Never';
    const diff = new Date() - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between px-4 h-6 bg-gray-900 text-gray-400 text-xs border-t border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FiGitBranch className="w-3 h-3 text-gray-500" />
          <span>main</span>
        </div>
        <div>
          Ln {position.line}, Col {position.column}
        </div>
        <div>{wordCount} words</div>
        <div>{language}</div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FiClock className="w-3 h-3 text-gray-500" />
          <span>Last saved: {formatLastSaved(lastSaved)}</span>
        </div>
        <div>{formatTime(time)}</div>
      </div>
    </div>
  );
};

export default EditorFooter;
