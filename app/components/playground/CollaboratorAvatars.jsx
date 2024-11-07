import React from "react";
import { useUser } from "@clerk/nextjs";

const CollaboratorAvatars = ({ collaborators }) => {
  return (
    <div className="flex space-x-4">
      {collaborators.map((collaborator) => (
        <div key={collaborator.id} className="relative group">
          <img
            src={collaborator.profileImageUrl || "/default-avatar.png"}
            alt={collaborator.name}
            className="w-10 h-10 rounded-full border-2 border-gray-300"
          />
          <span className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100">
            {collaborator.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CollaboratorAvatars;
