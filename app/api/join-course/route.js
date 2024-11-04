// api/courses/enroll/route.js
import Course from "@/lib/models/courseModel";
import { connect } from "@/lib/mongodb/mongoose";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connect();
    const { userId } = auth(); // This retrieves the authenticated user's ID

    if (!userId) {
      console.log("Authentication failed: No user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the JSON body from the request
    const requestBody = await request.json();
    console.log("Received body:", requestBody);

    const { courseCode } = requestBody;

    // Check if courseCode is provided
    if (!courseCode) {
      console.log("Missing field in the request body", { courseCode });
      return NextResponse.json(
        { error: "Course code is required" },
        { status: 400 }
      );
    }

    // Find the course by the given courseCode
    const course = await Course.findOne({ courseCode: courseCode });

    if (!course) {
      console.log("No course found with the provided courseCode", {
        courseCode,
      });
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if the user trying to enroll is the creator of the course
    if (course.creator === userId) {
      console.log("Creator trying to enroll as student", {
        userId,
        courseCode,
      });
      return NextResponse.json(
        {
          error:
            "Course creators cannot enroll as students in their own courses",
        },
        { status: 403 }
      );
    }

    // Enroll the user as a student if they are not the creator
    const updatedCourse = await Course.findOneAndUpdate(
      { courseCode: courseCode },
      { $addToSet: { enrolledStudents: userId } }, // Use $addToSet to prevent duplicate entries
      { new: true }
    );

    console.log("Student enrolled successfully", {
      courseCode,
      clerkId: userId,
    });
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
