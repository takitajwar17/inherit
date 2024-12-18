"use client";

import { useState } from "react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

const VideoPlayer = ({ videoId }) => {
  return (
    <div className="relative bg-gray-900 h-full">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Video Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
      />
    </div>
  );
};

export default VideoPlayer;
