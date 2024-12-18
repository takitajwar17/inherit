"use client";

import { useState } from 'react';
import { FiEdit2, FiDownload, FiUpload, FiCopy, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { FaPlay, FaRobot, FaKeyboard } from 'react-icons/fa';

const EditorHeader = ({
  fileName,
  language,
  languages,
  onLanguageChange,
  onFileNameChange,
  onExport,
  onImport,
  onCopy,
  onClear,
  showKeyboardShortcuts,
  onRun,
  onReview,
  onTabChange,
  activeTab,
  isRunning,
  isReviewing,
  hasOutput,
  hasReview,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(fileName);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFileNameChange(editValue);
    setIsEditing(false);
  };

  const currentLanguage = languages?.find(lang => lang.id === language) || { id: language, name: language };

  return (
    <div className="border-b border-gray-700">
      {/* Top bar with file info and actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center space-x-4">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            </form>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{fileName}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center space-x-2 px-2 py-1 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <span>{currentLanguage.name}</span>
              <FiChevronDown className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showLanguageMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang.id);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      lang.id === language
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Copy code"
          >
            <FiCopy className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Download file"
          >
            <FiDownload className="w-4 h-4" />
          </button>
          <button
            onClick={onImport}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Upload file"
          >
            <FiUpload className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Clear code"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
          <button
            onClick={showKeyboardShortcuts}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Keyboard shortcuts"
          >
            <FaKeyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50">
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
            <span>Review</span>
            {hasReview && activeTab !== 'review' && (
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorHeader;
