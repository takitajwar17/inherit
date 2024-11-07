import React from "react";
import CodeEditor from "@/components/ui/CodeEditor";

const VideoPage = ({ params }) => {
  const { videoId } = params;

  return (
    <div className="flex">
      <div className="w-1/2 h-[calc(80vh-64px)]">
        {/* Embed YouTube Video */}
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="w-1/2">
        {/* Code Editor Section - to be implemented later */}
        <div className="h-full bg-gray-200">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
