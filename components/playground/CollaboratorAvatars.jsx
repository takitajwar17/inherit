"use client";

import React from 'react';

const CollaboratorAvatars = ({ collaborators }) => {
  if (!collaborators || collaborators.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {collaborators.slice(0, 3).map((collaborator, index) => (
        <div
          key={collaborator.userId}
          className="relative group"
        >
          <img
            className="w-8 h-8 rounded-full border-2 border-white"
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.userId}`}
            alt={`User ${collaborator.userId}`}
          />
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
            User {collaborator.userId}
          </div>
        </div>
      ))}
      {collaborators.length > 3 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
          +{collaborators.length - 3}
        </div>
      )}
    </div>
  );
};

export default CollaboratorAvatars;
