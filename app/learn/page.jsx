"use client";
import React, { useState, useEffect } from "react";

const LearnPage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=coding+tutorials&type=video&maxResults=6&key=YOUR_YOUTUBE_API_KEY`
        );
        const data = await response.json();
        setVideos(data.items || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Learn Coding</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {videos.length === 0 ? (
            <p className="text-gray-500">No videos available</p>
          ) : (
            videos.map((video) => (
              <div
                key={video.id.videoId}
                className="bg-white p-4 rounded-lg shadow"
              >
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${video.id.videoId}`}
                  title={video.snippet.title}
                  allowFullScreen
                  className="rounded"
                ></iframe>
                <p className="mt-2 font-semibold">{video.snippet.title}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
