import Course from "@/lib/models/courseModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch owned courses
    const ownedCourses = await Course.find({ creator: userId });

    // Fetch enrolled courses
    const enrolledCourses = await Course.find({ enrolledStudents: userId });

    // Combine both owned and enrolled courses
    const courses = {
      owned: ownedCourses,
      enrolled: enrolledCourses,
    };

    // If the user has no courses at all, return a suitable message
    if (ownedCourses.length === 0 && enrolledCourses.length === 0) {
      return NextResponse.json({
        message: "No courses found where user is enrolled or owns any.",
      });
    }

    // Return the combined course details
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
