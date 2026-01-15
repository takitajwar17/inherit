"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaYoutube, FaCheckCircle, FaLock } from "react-icons/fa";
import {
  FiExternalLink,
  FiArrowLeft,
  FiClock,
  FiBookOpen,
  FiTrash2,
} from "react-icons/fi";
import { getRoadmapById, deleteRoadmap } from "@/lib/actions/roadmap";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import Progress from "@/components/Progress";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import dynamic from "next/dynamic";
import useSound from "use-sound";

const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

// Function to format duration from ISO 8601 or simple format (MM:SS or H:MM:SS)
const formatDuration = (duration) => {
  if (!duration) return "";

  // Check if it's already in simple format (e.g., "15:30" or "1:02:45")
  if (duration.includes(":")) {
    return duration; // Already formatted, return as-is
  }

  // ISO 8601 format (e.g., "PT1H30M15S")
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return duration; // Return original if no match

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  let formatted = "";
  if (hours) formatted += `${hours}h `;
  if (minutes) formatted += `${minutes}m `;
  if (seconds && !hours) formatted += `${seconds}s`;
  return formatted.trim() || duration;
};

const sanitizeUrl = (url) => {
  return url.replace(/[<>]/g, "").trim();
};

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Sound effects
  const [playComplete] = useSound("/sounds/complete.mp3", { volume: 0.5 });
  const [playSuccess] = useSound("/sounds/success.mp3", { volume: 0.75 });

  // Callback when a step is completed
  const handleStepComplete = useCallback(
    (stepIndex, isAllComplete) => {
      if (isAllComplete) {
        // Last step completed - show confetti and play success sound
        setShowConfetti(true);
        playSuccess();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Regular step completed - play sound and advance to next step
        playComplete();
        setActiveStep(stepIndex + 1);
      }
    },
    [playComplete, playSuccess]
  );

  // Use the custom hook for progress management
  const {
    completedSteps,
    progress: progressPercentage,
    toggleStep,
  } = useRoadmapProgress(params.id, roadmap?.content?.steps?.length || 0, {
    onStepComplete: handleStepComplete,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Fetch roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const data = await getRoadmapById(params.id);
        setRoadmap(data);
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

  // Handle delete
  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${roadmap?.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoadmap(params.id, user.id);
      toast.success("Roadmap deleted successfully! 🗑️");
      router.push("/roadmaps");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error(
        error.message || "Failed to delete roadmap. Please try again."
      );
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const scrollToContent = () => {
      const activeContent = document.getElementById(`step-${activeStep}`);
      if (activeContent) {
        const windowHeight = window.innerHeight;
        const elementTop = activeContent.getBoundingClientRect().top;
        const offset = elementTop - windowHeight / 2;

        window.scrollBy({
          top: offset,
          behavior: "smooth",
        });
      }
    };
    scrollToContent();
  }, [activeStep]);

  useEffect(() => {
    const activeStepElement = document.querySelector(`#nav-step-${activeStep}`);
    if (activeStepElement) {
      const container = document.querySelector(".steps-container");
      const containerHeight = container.offsetHeight;
      const stepHeight = activeStepElement.offsetHeight;
      const stepTop = activeStepElement.offsetTop;

      // Calculate the center position
      const targetScroll = stepTop - containerHeight / 2 + stepHeight / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [activeStep]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .steps-container {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;     /* Firefox */
        overflow-y: scroll;
      }
      .steps-container::-webkit-scrollbar {
        display: none;            /* Chrome, Safari and Opera */
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header Loading State */}
        <div className="sticky top-20 z-40 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Navigation Loading State */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-44">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Loading State */}
            <div className="lg:col-span-2">
              {/* Header Card Loading */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-8">
                  <div className="h-8 w-2/3 bg-white/20 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-1/2 bg-white/20 rounded animate-pulse"></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Loading */}
              <div className="space-y-8">
                {[1, 2].map((index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm p-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-12 w-40 bg-blue-50 rounded-xl animate-pulse"></div>
                      <div className="h-12 w-40 bg-red-50 rounded-xl animate-pulse"></div>
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

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Roadmap Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The roadmap you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/roadmaps")}
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
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={400}
        />
      )}
      {/* Sticky Header */}
      <div className="sticky top-20 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/roadmaps")}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete roadmap"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-b-2 border-red-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Delete
                    </span>
                  </>
                )}
              </button>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Steps Overview
              </h2>
              <div
                className="steps-container overflow-hidden"
                style={{ height: "400px", position: "relative" }}
              >
                <div className="space-y-2">
                  {roadmap.content.steps.map((step, index) => (
                    <button
                      key={step.step}
                      id={`nav-step-${index}`}
                      onClick={() => setActiveStep(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        activeStep === index
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            completedSteps.has(index) ? "text-green-600" : ""
                          }`}
                        >
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
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Roadmap Header */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-8">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {roadmap.title}
                </h1>
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
                  id={`step-${index}`}
                  onClick={() => setActiveStep(index)}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
                    activeStep === index
                      ? "ring-2 ring-blue-500 ring-opacity-50"
                      : "cursor-pointer"
                  }`}
                  style={{ opacity: activeStep === index ? 1 : 0.5 }}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Step {step.step}: {step.topic}
                      </h2>
                      <button
                        onClick={(e) => {
                          if (activeStep === index) {
                            e.stopPropagation();
                            toggleStep(index);
                          }
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          completedSteps.has(index)
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        } ${
                          activeStep === index
                            ? "hover:bg-green-200"
                            : "pointer-events-none"
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
                          href={
                            activeStep === index
                              ? sanitizeUrl(step.documentation)
                              : undefined
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (activeStep !== index) {
                              e.preventDefault();
                            } else {
                              e.stopPropagation();
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-700 ${
                            activeStep === index
                              ? "hover:bg-blue-100"
                              : "pointer-events-none"
                          } transition-colors`}
                        >
                          <FiExternalLink className="text-lg" />
                          <span>Read Documentation</span>
                        </a>
                      )}

                      {step.videoId && (
                        <a
                          href={
                            activeStep === index
                              ? `/learn/${step.videoId}`
                              : undefined
                          }
                          onClick={(e) => {
                            if (activeStep !== index) {
                              e.preventDefault();
                            } else {
                              e.stopPropagation();
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-700 ${
                            activeStep === index
                              ? "hover:bg-red-100"
                              : "pointer-events-none"
                          } transition-colors`}
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
