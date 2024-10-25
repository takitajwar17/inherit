// CourseCard.js
import { BsThreeDotsVertical } from "react-icons/bs";

const CourseCard = ({
  course,
  index,
  menuOpen,
  setMenuOpen,
  menuRef,
  handleEdit,
  handleArchive,
  handleDelete,
  handleUnenroll, // Handler for unenroll action
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex-1">
          {course.title}
        </h3>
        <div className="relative" ref={menuRef}>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setMenuOpen(index === menuOpen ? null : index)}
          >
            <BsThreeDotsVertical />
          </button>
          {menuOpen === index && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg">
              <ul className="text-left">
                {course.courseType === "owned" && (
                  <>
                    <li
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleEdit(course._id)}
                    >
                      Edit
                    </li>
                    <li
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        handleArchive(course._id, course.courseType)
                      }
                    >
                      Archive
                    </li>
                    <li
                      className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        handleDelete(course._id, course.courseType)
                      }
                    >
                      Delete
                    </li>
                  </>
                )}
                {course.courseType === "enrolled" && (
                  <li
                    className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                    onClick={() =>
                      handleUnenroll(course._id, course.courseType)
                    }
                  >
                    Unenroll
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-500 mb-4">{course.description}</p>
      <button className="bg-orange hover:bg-opacity-80 text-white py-2 px-4 rounded-lg">
        View Course
      </button>
    </div>
  );
};

export default CourseCard;
