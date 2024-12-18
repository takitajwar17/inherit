"use client";

import { useState, useRef } from 'react';
import { FiEdit2, FiDownload, FiUpload, FiCopy, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa';

const EditorHeader = ({
  fileName,
  language,
  languages,
  onLanguageChange,
  onFileNameChange,
  onCopy,
  onClear,
  onRun,
  isRunning,
  code,
  onCodeChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(fileName);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFileNameChange(editValue);
    setIsEditing(false);
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Update the file name to match the imported file
        const newFileName = file.name;
        onFileNameChange(newFileName);
        // Update the code content
        onCodeChange(content);
      };
      reader.readAsText(file);
    }
  };

  const currentLanguage = languages?.find(lang => lang.id === language) || { id: language, name: language };

  return (
    <div className="border-b border-gray-700">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImport}
        accept=".txt,.js,.py,.java,.cpp,.cs,.php"
      />
      
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
              <span className="text-sm text-white font-medium">{fileName}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-md"
                title="Edit filename"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
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
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            title="Download file"
          >
            <FiDownload className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
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
        </div>
      </div>
    </div>
  );
};

export default EditorHeader;
