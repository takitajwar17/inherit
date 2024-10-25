"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const JoinCourseModal = ({ isOpen, onClose, onJoin }) => {
  const [courseCode, setCourseCode] = useState("");
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseCode) {
      toast.error("Please enter a course code");
      return;
    }

    try {
      const response = await fetch("/api/join-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseCode }),
      });

      if (response.ok) {
        toast.success("Joined course successfully!");
        setCourseCode(""); // Clear the input field
        onClose(); // Close the modal
        router.push("/courses"); // Redirect to courses page
        window.location.reload(); // Refresh the page to show the new course
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to join course");
      }
    } catch (error) {
      console.error("Error joining course:", error);
      toast.error("Error joining Course. Please try again");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md relative">
        {/* Modal Content */}
        <div className="p-6">
          {/* Header */}
          <h2 className="text-xl font-bold mb-4">Join course</h2>

          {/* User Info Section */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">
              You're currently signed in as
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange text-white flex items-center justify-center font-medium">
                <img
                  src={user.profileImageUrl}
                  alt="profile image"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-gray-500">
                  {user.emailAddresses[0].emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="courseCode" className="block font-medium mb-2">
                  Course code
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Ask your teacher for the course code, then enter it here.
                </p>
                <input
                  id="courseCode"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Course code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="font-medium">To sign in with a course code</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Use an authorized account</li>
                  <li>
                    Use a course code with 7 letters or numbers, and no spaces
                    but may include symbols
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-opacity-90"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinCourseModal;
