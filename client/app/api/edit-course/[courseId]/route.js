import { NextResponse } from "next/server";
import Course from "@/lib/models/courseModel";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET(req, { params }) {
  try {
    await connect();
    const { courseId } = params;
    console.log(courseId);

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("error fetching course: ", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
