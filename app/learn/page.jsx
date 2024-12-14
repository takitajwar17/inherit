"use client";
import React, { useState, useEffect } from "react";

const LearnPage = () => {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("coding tutorials"); // Default search query
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null); // Track the token for the next page

  // Fetch videos based on the query
  const fetchVideos = async (pageToken = "") => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=6&pageToken=${pageToken}&key=YOUR_YOUTUBE_API_KEY`
      );
      const data = await response.json();
      setVideos(data.items || []);
      setNextPageToken(data.nextPageToken || null); // Set next page token if available
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(); // Fetch videos on first load
  }, [query]); // Re-fetch when the query changes

  // Handle next page click
  const handleNextPage = () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken); // Fetch videos for the next page
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Learn Coding</h1>

        {/* Search bar */}
        <div className="mt-4 flex space-x-4">
          <input
            type="text"
            className="p-2 border rounded-md w-full"
            placeholder="Search for coding tutorials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => fetchVideos()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Search
          </button>
        </div>

        {/* Loading state */}
        {loading && <p className="mt-4 text-gray-500">Loading videos...</p>}

        {/* Displaying videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {videos.length === 0 ? (
            <p className="text-gray-500">No videos found for "{query}"</p>
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

        {/* Pagination */}
        {nextPageToken && (
          <div className="mt-6 text-center">
            <button
              onClick={handleNextPage}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Load More Videos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnPage;
