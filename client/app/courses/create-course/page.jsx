"use client"; // Ensure this component is a client component
import { useAuth } from "@clerk/nextjs"; // Import useAuth to get the authenticated user
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Change import to next/navigation
import React, { useState } from "react";
import { LuDices } from "react-icons/lu";
import { toast } from "react-toastify";
import { createCourse } from "../../../lib/actions/course";

const CreateCoursePage = () => {
  const { userId } = useAuth(); // Get the authenticated user's ID
  const [schedule, setSchedule] = useState([{ day: "", time: "" }]);
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const router = useRouter(); // Initialize useRouter

  const addScheduleEntry = () => {
    const lastEntry = schedule[schedule.length - 1];
    if (lastEntry.day && lastEntry.time) {
      setSchedule([...schedule, { day: "", time: "" }]);
    } else {
      toast.error("You have an empty slot");
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const generateRandomCode = () => {
    const newCode = nanoid(7).toUpperCase();
    setCourseCode(newCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any field is missing
    if (
      !title ||
      !details ||
      !courseCode ||
      schedule.some((slot) => !slot.day || !slot.time)
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Log all the data
    console.log({
      title,
      details,
      courseCode,
      schedule,
      creator: userId, // Include creator
    });

    try {
      // Call the createCourse function to save the data
      const course = await createCourse(title, details, courseCode, userId); // Pass creator
      console.log("Course created:", course);
      toast.success("Course created successfully!");
      router.push("/courses"); // Redirect to /courses on success
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Error creating course. Please try again.");
    }
  };

  return (
    <div className="bg-white min-h-screen px-12 pt-6 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Create a New Course
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-6 rounded-lg shadow-lg"
      >
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 block w-full border border-gray-300 rounded-lg p-3 focus:border-orange"
          />
        </div>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700">
            Course Details
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-2 block w-full border border-gray-300 rounded-lg p-3 focus:border-orange"
            rows="4"
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700">
            Course Code
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="mt-2 block w-full border border-gray-300 rounded-lg p-3 focus:border-orange"
            />
            <button type="button" onClick={generateRandomCode} className="p-2">
              <LuDices size={24} color="black" />
            </button>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700">
            Schedule Slot
          </label>
          <div className="mt-2 space-y-4">
            {schedule.map((entry, index) => (
              <div key={index} className="flex space-x-4">
                <select
                  value={entry.day}
                  onChange={(e) =>
                    handleScheduleChange(index, "day", e.target.value)
                  }
                  className="block w-1/2 border border-gray-300 rounded-lg p-3 focus:border-orange"
                >
                  <option value="">Select Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <input
                  type="time"
                  value={entry.time}
                  onChange={(e) =>
                    handleScheduleChange(index, "time", e.target.value)
                  }
                  className="block w-1/2 border border-gray-300 rounded-lg p-3 focus:border-orange"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addScheduleEntry}
              className="text-red-400 font-semibold mt-4 hover:text-red-500 transition"
            >
              Add another slot
            </button>
          </div>
        </div>
        <div className="flex space-x-6">
          <button
            type="submit"
            className="bg-orange text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
          >
            Create
          </button>
          <button
            type="button"
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition"
          >
            <Link href="/courses">Cancel</Link>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;
