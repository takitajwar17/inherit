"use client";

import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiAlertTriangle, FiInfo, FiZap } from 'react-icons/fi';

const ReviewSection = ({ title, items, icon: Icon }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full px-4 py-2 text-sm font-medium text-left bg-gray-800 rounded-lg hover:bg-gray-700"
      >
        <Icon className="w-4 h-4 mr-2" />
        <span>{title}</span>
        {items.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded-full">
            {items.length}
          </span>
        )}
        {isExpanded ? (
          <FiChevronDown className="ml-auto" />
        ) : (
          <FiChevronRight className="ml-auto" />
        )}
      </button>

      {isExpanded && items.length > 0 && (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium">{item.title}</h3>
                {item.severity && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      item.severity === 'high'
                        ? 'bg-red-900/50 text-red-300'
                        : item.severity === 'medium'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-blue-900/50 text-blue-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400">{item.description}</p>
              {item.code && (
                <div className="mt-3">
                  <div className="relative">
                    <pre className="p-3 bg-gray-900 rounded-lg overflow-x-auto text-sm">
                      <code>{item.code}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AIReviewPanel = ({ review }) => {
  console.log('AIReviewPanel: Received review', review);

  if (!review || typeof review !== 'object') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No review available.</p>
        </div>
      </div>
    );
  }

  const { issues = [], suggestions = [], improvements = [] } = review;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-none px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100">AI Code Review</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <ReviewSection
            title="Issues"
            items={issues}
            icon={FiAlertTriangle}
          />
          <ReviewSection
            title="Suggestions"
            items={suggestions}
            icon={FiInfo}
          />
          <ReviewSection
            title="Improvements"
            items={improvements}
            icon={FiZap}
          />
        </div>
      </div>
    </div>
  );
};

export default AIReviewPanel;
