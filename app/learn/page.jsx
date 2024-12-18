"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IoSearch } from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_IDS = [
  "UC8butISFwT-Wl7EV0hUK0BQ", // freeCodeCamp
  "UC59K-uG2A5ogwIrHw4bmlEg", // Telusko
];

const LearnPage = () => {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const formatDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let formattedDuration = '';
    
    if (hours) {
      formattedDuration += `${hours}:`;
      formattedDuration += `${minutes.padStart(2, '0')}:`;
    } else if (minutes) {
      formattedDuration += `${minutes}:`;
    } else {
      formattedDuration += '0:';
    }
    
    formattedDuration += seconds.padStart(2, '0');
    
    return formattedDuration;
  };

  const getVideoDetails = async (videoIds) => {
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: 'contentDetails',
          id: videoIds.join(','),
          key: API_KEY,
        },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching video details:', error);
      return [];
    }
  };

  const fetchVideos = async () => {
    try {
      const promises = CHANNEL_IDS.map((channelId) =>
        axios.get(`https://www.googleapis.com/youtube/v3/search`, {
          params: {
            part: "snippet",
            channelId: channelId,
            maxResults: 6,
            order: "date",
            key: API_KEY,
          },
        })
      );
      const results = await Promise.all(promises);
      const allVideos = results.flatMap((result) => result.data.items);
      
      // Get video durations
      const videoIds = allVideos.map(video => video.id.videoId);
      const videoDetails = await getVideoDetails(videoIds);
      
      // Merge duration information with video data
      const videosWithDuration = allVideos.map(video => {
        const details = videoDetails.find(detail => detail.id === video.id.videoId);
        return {
          ...video,
          contentDetails: details?.contentDetails || null,
        };
      });
      
      setVideos(videosWithDuration);
    } catch (error) {
      console.error("Error fetching videos", error);
    }
  };

  const fetchVideosBySearch = async () => {
    try {
      const promises = CHANNEL_IDS.map((channelId) =>
        axios.get(`https://www.googleapis.com/youtube/v3/search`, {
          params: {
            part: "snippet",
            channelId: channelId,
            maxResults: 12,
            order: "relevance",
            q: searchTerm,
            key: API_KEY,
          },
        })
      );
      const results = await Promise.all(promises);
      const allVideos = results.flatMap((result) => result.data.items);
      
      // Get video durations
      const videoIds = allVideos.map(video => video.id.videoId);
      const videoDetails = await getVideoDetails(videoIds);
      
      // Merge duration information with video data
      const videosWithDuration = allVideos.map(video => {
        const details = videoDetails.find(detail => detail.id === video.id.videoId);
        return {
          ...video,
          contentDetails: details?.contentDetails || null,
        };
      });
      
      setVideos(videosWithDuration);
    } catch (error) {
      console.error("Error fetching videos by search", error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
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
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        fetchVideosBySearch();
                      }
                    }}
                    placeholder="Search for coding tutorials..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                  <button 
                    onClick={() => searchTerm.trim() && fetchVideosBySearch()} 
                    className={`absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${!searchTerm.trim() && 'opacity-50 cursor-not-allowed'}`}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/roadmaps')}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-8 py-4 border-2 border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
              <div className="relative flex flex-col items-start">
                <span className="text-sm font-semibold text-blue-100 mb-0.5">Getting Lost in Videos? 🤔</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.length === 0 ? (
            // Loading Skeleton
            <>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
                >
                  {/* Thumbnail Skeleton */}
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 bg-gray-200 animate-pulse">
                      <div className="absolute bottom-2 right-2 w-12 h-5 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="flex flex-col flex-grow p-5">
                    {/* Title Skeleton */}
                    <div className="space-y-2 mb-2">
                      <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    
                    {/* Footer Skeleton */}
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            videos.map((video) => (
              <div
                key={video.id.videoId}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full"
                onClick={() => router.push(`/learn/${video.id.videoId}`)}
              >
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
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
                    <p className="text-sm text-gray-600">{video.snippet.channelTitle}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(video.snippet.publishedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default LearnPage;