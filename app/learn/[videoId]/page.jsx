"use client";

import { useState, useEffect, useCallback } from "react";
import VideoPlayer from "@/components/learn/VideoPlayer";
import CodeWorkspace from "@/components/learn/CodeWorkspace";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const VideoPage = ({ params }) => {
  const { videoId } = params;
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const container = document.getElementById("split-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit the split position between 30% and 70%
      setSplitPosition(Math.min(Math.max(newPosition, 30), 70));
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100">
      {/* Split View Container */}
      <div
        id="split-container"
        className="flex-1 flex overflow-hidden relative"
        style={{ cursor: isDragging ? "col-resize" : "auto" }}
      >
        {/* Video Panel */}
        <div
          className="h-full overflow-hidden"
          style={{ width: `${splitPosition}%` }}
        >
          <div className="h-full p-4">
            <VideoPlayer videoId={videoId} />
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-blue-500/10" />
        </div>

        {/* Code Panel */}
        <div
          className="h-full overflow-hidden"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <div className="h-full">
            <CodeWorkspace />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
