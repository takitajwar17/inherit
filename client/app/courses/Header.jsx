"use client";
import { BsPlus } from "react-icons/bs";
import Link from "next/link";

const Header = ({
  plusMenuOpen,
  setPlusMenuOpen,
  plusMenuRef,
  setJoinModalOpen,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold mb-2">Courses</h1>
      <div className="relative" ref={plusMenuRef}>
        <button
          className="text-orange hover:bg-orange-700 font-bold text-4xl p-2 rounded-full"
          onClick={() => setPlusMenuOpen(!plusMenuOpen)}
        >
          <BsPlus size={36} />
        </button>
        {plusMenuOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
            <ul className="text-left">
              <li className="w-full rounded-lg px-2 py-2 text-center text-gray-700 hover:bg-gray-100 cursor-pointer">
                <button
                  onClick={() => {
                    setJoinModalOpen(true);
                    setPlusMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Join Course
                </button>
              </li>
              <li className="w-full rounded-lg px-2 py-2 text-center text-gray-700 hover:bg-gray-100 cursor-pointer">
                <Link href="/courses/create-course">Create Course</Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
