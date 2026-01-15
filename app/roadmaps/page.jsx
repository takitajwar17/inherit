"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRoadmap, getUserRoadmaps, deleteRoadmap } from "@/lib/actions/roadmap";
import { getRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { FaYoutube } from "react-icons/fa";
import { FiExternalLink, FiChevronRight, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

// Lightning-fast fetch function
const fetchUserRoadmaps = async (userId) => {
  return await getUserRoadmaps(userId);
};

// Optimized roadmap processing with memoization
const useRoadmapsWithProgress = (roadmaps) => {
  return useMemo(() => {
    if (!roadmaps) return [];
    
    return roadmaps.filter(roadmap => roadmap && roadmap._id).map(roadmap => ({
      ...roadmap,
      progress: getRoadmapProgress(roadmap._id, roadmap.content?.steps?.length || 0).progress
    }));
  }, [roadmaps]);
};

export default function RoadmapsPage() {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
  });
  const [error, setError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  // Lightning-fast query with aggressive caching
  const { data: roadmaps, isLoading: isLoadingRoadmaps } = useQuery({
    queryKey: ['roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user?.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    cacheTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Optimized roadmap processing
  const roadmapsWithProgress = useRoadmapsWithProgress(roadmaps);

  // Lightning-fast mutation for creating roadmaps
  const createRoadmapMutation = useMutation({
    mutationFn: ({ title, prompt, userId }) => createRoadmap(title, prompt, userId),
    onSuccess: () => {
      // Instantly update cache
      queryClient.invalidateQueries(['roadmaps', user?.id]);
      setOpen(false);
      setFormData({ title: "", prompt: "" });
      setError("");
      toast.success("Roadmap created successfully! 🚀");
    },
    onError: (error) => {
      console.error("Error creating roadmap:", error);
      const errorMessage = error.message || 
        (error.response?.data?.message);
      
      if (errorMessage?.includes("INVALID_TOPIC")) {
        setError("Please enter a topic related to computer science or IT only.");
      } else {
        setError("An error occurred while creating the roadmap. Please try again.");
      }
    }
  });

  // Delete roadmap mutation
  const deleteRoadmapMutation = useMutation({
    mutationFn: ({ roadmapId, userId }) => deleteRoadmap(roadmapId, userId),
    onSuccess: () => {
      // Instantly update cache
      queryClient.invalidateQueries(['roadmaps', user?.id]);
      setDeleteConfirmOpen(false);
      setRoadmapToDelete(null);
      toast.success("Roadmap deleted successfully! 🗑️");
    },
    onError: (error) => {
      console.error("Error deleting roadmap:", error);
      toast.error(error.message || "Failed to delete roadmap. Please try again.");
      setDeleteConfirmOpen(false);
      setRoadmapToDelete(null);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    createRoadmapMutation.mutate({
      title: formData.title,
      prompt: formData.prompt,
      userId: user.id
    });
  };

  const handleDeleteClick = (e, roadmap) => {
    e.stopPropagation(); // Prevent navigation to roadmap detail
    setRoadmapToDelete(roadmap);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roadmapToDelete) {
      deleteRoadmapMutation.mutate({
        roadmapId: roadmapToDelete._id,
        userId: user.id
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-20 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Learning Roadmaps
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Create and manage your personalized learning paths
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                  <span className="relative flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create New Roadmap
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      Create a New Learning Roadmap
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Enter a computer science or IT-related topic to generate a
                      personalized learning roadmap.
                    </DialogDescription>
                  </DialogHeader>
                  {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Roadmap Title
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., My Python Learning Journey"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        What do you want to learn?
                      </label>
                      <Textarea
                        value={formData.prompt}
                        onChange={(e) =>
                          setFormData({ ...formData, prompt: e.target.value })
                        }
                        placeholder="e.g., I want to learn Python from scratch and become proficient in web development using Django"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createRoadmapMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {createRoadmapMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        "Create Roadmap"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingRoadmaps ? (
            // Show loading skeleton
            <>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-6">
                    <div className="h-6 w-3/4 bg-gray-200/20 rounded animate-pulse"></div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2 mb-6">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 animate-pulse"></div>
                          <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {(roadmapsWithProgress || []).map((roadmap) => {
                return (
                  <div
                    key={roadmap._id}
                    onClick={() => router.push(`/roadmaps/${roadmap._id}`)}
                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, roadmap)}
                      className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete roadmap"
                    >
                      <FiTrash2 className="w-4 h-4 text-gray-600 hover:text-red-600 transition-colors" />
                    </button>

                    <div className="bg-gradient-to-r from-[#101826] to-[#1c2c47] p-6">
                      <h2 className="text-lg font-semibold text-white pr-8">
                        {roadmap.title}
                      </h2>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6 line-clamp-2">
                        {roadmap.prompt}
                      </p>
                      <div className="space-y-3">
                        {roadmap.content?.steps?.slice(0, 3).map((step) => (
                          <div
                            key={step.step}
                            className="flex items-start space-x-3"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                              {step.step}
                            </span>
                            <p className="text-gray-700 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {step.topic}
                            </p>
                          </div>
                        )) || []}
                        {(roadmap.content?.steps?.length || 0) > 3 && (
                          <p className="text-sm text-gray-500 pl-9">
                            +{(roadmap.content?.steps?.length || 0) - 3} more steps
                          </p>
                        )}
                      </div>
                      <div className="mt-6 flex justify-end">
                        <div className="inline-flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform duration-200">
                          View Roadmap
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            Progress
                          </span>
                          <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                            {roadmap.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          {/* Animated background */}
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-gradient"
                            style={{
                              width: "200%",
                              transform: "translateX(-50%)",
                            }}
                          />
                          {/* Actual progress bar */}
                          <div
                            className="relative h-full transition-all duration-300 ease-out"
                            style={{
                              width: `${roadmap.progress}%`,
                              background: "rgba(255, 255, 255, 0.25)",
                              boxShadow:
                                "inset 0 0 10px rgba(255, 255, 255, 0.5)",
                            }}
                          >
                            {/* Shine effect */}
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                              style={{
                                transform: "skewX(-45deg) translateX(-100%)",
                                animation: "shine 2s infinite",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <style jsx>{`
                        @keyframes shine {
                          0% {
                            transform: skewX(-45deg) translateX(-200%);
                          }
                          100% {
                            transform: skewX(-45deg) translateX(300%);
                          }
                        }
                        @keyframes gradient {
                          0% {
                            transform: translateX(-50%);
                          }
                          100% {
                            transform: translateX(0%);
                          }
                        }
                        .animate-gradient {
                          animation: gradient 3s linear infinite;
                          background-size: 200% 100%;
                        }
                      `}</style>
                    </div>
                  </div>
                );
              })}
              {(!roadmaps || roadmaps.length === 0) && !isLoadingRoadmaps && (
                <div className="col-span-full">
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Roadmaps Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first learning roadmap to get started on your
                      journey!
                    </p>
                    <button
                      onClick={() => setOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Create New Roadmap
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Delete Roadmap?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{roadmapToDelete?.title}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRoadmapToDelete(null);
              }}
              disabled={deleteRoadmapMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteRoadmapMutation.isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteRoadmapMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
