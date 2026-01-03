"use client";

import { useState } from "react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { FeatureErrorBoundary } from "@/components/error";

const VideoPlayer = ({ videoId }) => {
  return (
    <FeatureErrorBoundary feature="Video Player" variant="card">
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
    </FeatureErrorBoundary>
  );
};

export default VideoPlayer;
