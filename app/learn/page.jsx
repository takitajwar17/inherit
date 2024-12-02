"use client";
import React, { useState } from "react";

const LearnPage = () => {
  const [videos, setVideos] = useState([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Learn Coding</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {videos.length === 0 ? (
            <p className="text-gray-500">No videos available</p>
          ) : (
            videos.map((video, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <p>{video.title}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
