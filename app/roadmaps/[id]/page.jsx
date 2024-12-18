"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaYoutube, FaCheckCircle, FaLock } from "react-icons/fa";
import { FiExternalLink, FiArrowLeft, FiClock, FiBookOpen } from "react-icons/fi";
import { getRoadmapById } from "@/lib/actions/roadmap";
import Progress from "@/components/Progress";

// Function to format duration from ISO 8601
const formatDuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  let formatted = "";
  if (hours) formatted += `${hours}h `;
  if (minutes) formatted += `${minutes}m `;
  if (seconds && !hours) formatted += `${seconds}s`;
  return formatted.trim();
};

const sanitizeUrl = (url) => {
  return url.replace(/[<>]/g, '').trim();
};

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const data = await getRoadmapById(params.id);
        setRoadmap(data);
        // Load completed steps from localStorage
        const saved = localStorage.getItem(`roadmap-${params.id}-progress`);
        if (saved) {
          setCompletedSteps(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRoadmap();
    }
  }, [params.id]);

  const toggleStepCompletion = (stepIndex) => {
    const newCompleted = new Set(completedSteps);
    if (completedSteps.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
    localStorage.setItem(`roadmap-${params.id}-progress`, JSON.stringify([...newCompleted]));
  };

  const progressPercentage = roadmap 
    ? Math.round((completedSteps.size / roadmap.content.steps.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-8">
                <div className="h-8 w-2/3 bg-white/20 rounded-lg mb-4"></div>
                <div className="h-4 w-1/2 bg-white/20 rounded-lg"></div>
              </div>
              <div className="p-6">
                <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Steps Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Roadmap Not Found</h1>
          <p className="text-gray-600 mb-6">The roadmap you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/roadmaps')}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-20 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/roadmaps')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="mr-2" />
              Back to Roadmaps
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Progress: {progressPercentage}%
              </div>
              <div className="w-32">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Steps Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-44">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Steps Overview</h2>
              <div className="space-y-2">
                {roadmap.content.steps.map((step, index) => (
                  <button
                    key={step.step}
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeStep === index
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        completedSteps.has(index) ? 'text-green-600' : ''
                      }`}>
                        Step {step.step}
                      </span>
                      {completedSteps.has(index) && (
                        <FaCheckCircle className="text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {step.topic}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Roadmap Header */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-8">
                <h1 className="text-3xl font-bold text-white mb-3">{roadmap.title}</h1>
                <p className="text-blue-100">{roadmap.prompt}</p>
              </div>
              <div className="p-6 bg-gradient-to-b from-gray-50/50">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiClock />
                    <span>{roadmap.content.steps.length} Steps</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaCheckCircle />
                    <span>{completedSteps.size} Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Step Content */}
            <div className="space-y-8">
              {roadmap.content.steps.map((step, index) => (
                <div
                  key={step.step}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
                    activeStep === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  style={{ opacity: activeStep === index ? 1 : 0.5 }}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Step {step.step}: {step.topic}
                      </h2>
                      <button
                        onClick={() => toggleStepCompletion(index)}
                        className={`p-2 rounded-full transition-colors ${
                          completedSteps.has(index)
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <FaCheckCircle className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="flex flex-wrap gap-4">
                      {step.documentation && (
                        <a
                          href={sanitizeUrl(step.documentation)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <FiExternalLink className="text-lg" />
                          <span>Read Documentation</span>
                        </a>
                      )}
                      
                      {step.videoId && (
                        <a
                          href={`/learn/${step.videoId}`}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <FaYoutube className="text-lg" />
                          <span>Watch Tutorial</span>
                          {step.videoDuration && (
                            <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded-full ml-2">
                              {formatDuration(step.videoDuration)}
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
