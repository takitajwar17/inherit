// CourseSection.js
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CourseCard from "./CourseCard";
import Header from "./Header";
import JoinCourseModal from "./JoinCourseModal";
import LoadingSkeleton from "./LoadingSkeleton";
import TabsAndSearch from "./TabsAndSearch";

const CourseSection = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Latest", "Owned", "Enrolled", "Archived"];
  const [courses, setCourses] = useState({ owned: [], enrolled: [] });
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRefs = useRef([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Fetch courses effect
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses/all-courses");
        if (response.ok) {
          const data = await response.json();
          const ownedCourses = data.owned.map((course) => ({
            ...course,
            courseType: "owned",
          }));
          const enrolledCourses = data.enrolled.map((course) => ({
            ...course,
            courseType: "enrolled",
          }));
          setCourses({ owned: ownedCourses, enrolled: enrolledCourses });
        } else {
          console.error("Failed to fetch courses");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Click outside effect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRefs.current.some((ref) => ref && ref.contains(event.target))) {
        return;
      }
      setMenuOpen(null);

      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setPlusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRefs]);

  const handleEdit = (id) => {
    router.push(`/courses/edit-course/${id}`);
  };

  const handleArchive = (id, courseType) => {
    // Handle archive logic here
    console.log(`Archiving course with ID: ${id}`);
  };

  const handleDelete = (id, courseType) => {
    // Handle delete logic here
    console.log(`Deleting course with ID: ${id}`);
  };

  const handleUnenroll = (id, courseType) => {
    // Placeholder for unenroll logic
    console.log(`Unenrolling from course with ID: ${id}`);
  };

  const handleJoinCourse = async (courseCode) => {
    try {
      console.log("Joining course with code:", courseCode);
      setJoinModalOpen(false);
    } catch (error) {
      console.error("Error joining course:", error);
    }
  };

  let displayedCourses = [];
  if (activeTab === "All") {
    displayedCourses = [...courses.owned, ...courses.enrolled];
  } else if (activeTab === "Owned") {
    displayedCourses = courses.owned;
  } else if (activeTab === "Enrolled") {
    displayedCourses = courses.enrolled;
  } else if (activeTab === "Latest") {
    displayedCourses = [...courses.owned, ...courses.enrolled].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else if (activeTab === "Archived") {
    displayedCourses = [...courses.owned, ...courses.enrolled].filter(
      (course) => course.archived
    );
  }

  if (loading) {
    return <LoadingSkeleton tabs={tabs} />;
  }

  return (
    <div className="bg-white min-h-screen px-12 pt-4 text-gray-800">
      <Header
        plusMenuOpen={plusMenuOpen}
        setPlusMenuOpen={setPlusMenuOpen}
        plusMenuRef={plusMenuRef}
        setJoinModalOpen={setJoinModalOpen}
      />
      <hr className="mb-4" />
      <TabsAndSearch
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedCourses.map((course, index) => (
          <CourseCard
            key={course._id}
            course={course}
            index={index}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            menuRef={(el) => (menuRefs.current[index] = el)}
            handleEdit={handleEdit}
            handleArchive={handleArchive}
            handleDelete={handleDelete}
            handleUnenroll={handleUnenroll} // Pass the unenroll handler
          />
        ))}
      </div>
      <JoinCourseModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoin={handleJoinCourse}
      />
    </div>
  );
};

export default CourseSection;
