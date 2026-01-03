"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IoSearch } from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";

// Helper function to parse YouTube duration and convert to minutes
const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 60 + minutes + seconds / 60;
};

// Filter function to remove shorts and videos < 20 minutes
const filterQualityVideos = (videos) => {
  return videos.filter(video => {
    const duration = video.contentDetails?.duration;
    const durationMinutes = parseDurationToMinutes(duration);
    
    // Filter out shorts and videos less than 20 minutes
    return durationMinutes >= 20;
  });
};

// Lightning-fast fetch function for default videos (no search)
const fetchDefaultVideos = async () => {
  const apiKey = getRandomApiKey();
  
  const videoPromises = CHANNEL_IDS.map(async (channelId) => {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: apiKey,
        channelId,
        part: "snippet",
        order: "date",
        maxResults: 50, // Increased to account for filtering
        type: "video",
        videoDuration: "long", // Only get long videos (>20 minutes)
      },
    });
    
    const videoIds = response.data.items.map((item) => item.id.videoId).join(",");
    const videoDetailsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        key: apiKey,
        id: videoIds,
        part: "snippet,statistics,contentDetails",
      },
    });
    
    // Filter videos by duration
    const qualityVideos = filterQualityVideos(videoDetailsResponse.data.items);
    return qualityVideos;
  });

  const results = await Promise.all(videoPromises);
  const allVideos = results.flat();
  
  // Sort by publish date and limit to reasonable amount
  return allVideos
    .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
    .slice(0, 24); // Limit to 24 quality videos
};

// Separate search API function
const searchVideos = async (searchQuery) => {
  const apiKey = getRandomApiKey();
  
  const videoPromises = CHANNEL_IDS.map(async (channelId) => {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: apiKey,
        channelId,
        part: "snippet",
        q: searchQuery, // Search query
        order: "relevance", // Order by relevance for search
        maxResults: 25,
        type: "video",
        videoDuration: "long", // Only get long videos (>20 minutes)
      },
    });
    
    const videoIds = response.data.items.map((item) => item.id.videoId).join(",");
    if (videoIds) {
      const videoDetailsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          key: apiKey,
          id: videoIds,
          part: "snippet,statistics,contentDetails",
        },
      });
      
      // Filter videos by duration
      const qualityVideos = filterQualityVideos(videoDetailsResponse.data.items);
      return qualityVideos;
    }
    return [];
  });

  const results = await Promise.all(videoPromises);
  const allVideos = results.flat();
  
  // Sort by relevance and duration
  return allVideos.slice(0, 24); // Limit to 24 quality videos
};

const CHANNEL_IDS = [
  "UC8butISFwT-Wl7EV0hUK0BQ", // freeCodeCamp
  "UC59K-uG2A5ogwIrHw4bmlEg", // Telusko
];

const getRandomApiKey = () => {
  const apiKeys = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.split(",");
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
};


const LearnPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // Track actual search query
  const [isSearchMode, setIsSearchMode] = useState(false);
  const router = useRouter();

  // Default videos query (when not searching)
  const { data: defaultVideos, isLoading: isLoadingDefault } = useQuery({
    queryKey: ['youtube-videos-default'],
    queryFn: fetchDefaultVideos,
    staleTime: 600000, // 10 minutes
    cacheTime: 1800000, // 30 minutes  
    refetchOnWindowFocus: false,
    enabled: !isSearchMode, // Only fetch when not in search mode
  });

  // Search videos query (when searching)
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['youtube-search', activeSearchQuery],
    queryFn: () => searchVideos(activeSearchQuery),
    staleTime: 300000, // 5 minutes (shorter for search results)
    cacheTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
    enabled: isSearchMode && activeSearchQuery.length > 0, // Only fetch when actively searching
  });

  // Handle search execution
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setActiveSearchQuery(searchTerm.trim());
      setIsSearchMode(true);
    } else {
      setIsSearchMode(false);
      setActiveSearchQuery("");
    }
  };

  // Clear search and go back to default videos
  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchQuery("");
    setIsSearchMode(false);
  };

  // Determine which videos to show and loading state
  const displayedVideos = isSearchMode ? searchResults : defaultVideos;
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingDefault;

  const formatDuration = (duration) => {
    if (!duration) return "0:00";

    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";

    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "");
    const seconds = (match[3] || "").replace("S", "");

    let formattedDuration = "";

    if (hours) {
      formattedDuration += `${hours}:`;
      formattedDuration += `${minutes.padStart(2, "0")}:`;
    } else if (minutes) {
      formattedDuration += `${minutes}:`;
    } else {
      formattedDuration += "0:";
    }

    formattedDuration += seconds.padStart(2, "0");

    return formattedDuration;
  };


  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      .animate-shimmer {
        animation: shimmer 2.5s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-20 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Learn</h1>
            <p className="text-base text-gray-600 mt-1">Watch tutorials and practice coding in real-time</p>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-500">
                    <IoSearch size={20} />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search for coding tutorials..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/roadmaps")}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-8 py-4 border-2 border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
              <div className="relative flex flex-col items-start">
                <span className="text-sm font-semibold text-blue-100 mb-0.5">
                  Getting Lost in Videos? 🤔
                </span>
                <span className="flex items-center gap-2 text-white font-bold">
                  Get Your AI Learning Path
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </div>
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/30 transition-all duration-300"></div>
            </button>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Header */}
        {isSearchMode && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results for "{activeSearchQuery}"
              </h2>
              <p className="text-sm text-gray-600">
                {displayedVideos?.length || 0} videos found
              </p>
            </div>
            <button
              onClick={clearSearch}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
                >
                  <div className="relative" style={{ paddingBottom: "56.25%" }}>
                    <div className="absolute inset-0 bg-gray-200 animate-pulse">
                      <div className="absolute bottom-2 right-2 w-12 h-5 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <div className="space-y-2 mb-2">
                      <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : displayedVideos && displayedVideos.length > 0 ? (
            displayedVideos.map((video) => (
              <div
                key={video.id.videoId}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full"
                onClick={() => router.push(`/learn/${video.id.videoId}`)}
              >
                <div className="relative" style={{ paddingBottom: "56.25%" }}>
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {video.contentDetails && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                      {formatDuration(video.contentDetails.duration)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-grow p-5">
                  <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {video.snippet.title}
                  </h3>
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {video.snippet.channelTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(
                        new Date(video.snippet.publishedAt),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isSearchMode ? 'No videos found' : 'No videos available'}
              </h3>
              <p className="text-gray-500 mb-4">
                {isSearchMode 
                  ? `No videos found for "${activeSearchQuery}". Try a different search term.`
                  : 'Unable to load videos at the moment. Please try again later.'
                }
              </p>
              {isSearchMode && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse All Videos
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LearnPage;
