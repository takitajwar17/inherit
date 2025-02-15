"use client";

import React from "react";
import { FiX, FiCopy, FiDownload, FiTrash2 } from "react-icons/fi";

const OutputPanel = ({
  output,
  isError,
  onClose,
  onClear,
  timestamp,
  executionTime,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(output.join("\n"));
  };

  const handleDownload = () => {
    const blob = new Blob([output.join("\n")], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <span
            className={`font-medium ${
              isError ? "text-red-400" : "text-green-400"
            }`}
          >
            {isError ? "Error Output" : "Output"}
          </span>
          {executionTime && (
            <span className="text-gray-400 text-sm">
              Executed in {executionTime}ms
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Copy Output"
          >
            <FiCopy />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Download Output"
          >
            <FiDownload />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Clear Output"
          >
            <FiTrash2 />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-auto font-mono text-sm p-4">
        {output.map((line, index) => (
          <div
            key={index}
            className={`${
              isError ? "text-red-400" : "text-gray-300"
            } whitespace-pre-wrap mb-1`}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-gray-400 text-sm">
        {timestamp && (
          <div className="flex items-center justify-between">
            <span>Last run: {new Date(timestamp).toLocaleString()}</span>
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Clear Output
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
