"use server";

import Course from "../models/courseModel";
import { connect } from "../mongodb/mongoose";

export const createCourse = async (title, details, courseCode, creator) => {
  try {
    await connect();
    console.log("Creating course: ", { title, details, courseCode, creator });

    const course = await Course.create({
      title: title,
      description: details,
      courseCode: courseCode,
      creator: creator, // Ensure creator is passed as a string
    });

    console.log("Course created:", course);
    return course.toObject(); // Convert Mongoose document to plain object
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
};

export const updateCourse = async (courseId,title,details,courseCode) =>{
  try{
    await connect();
    console.log("updating course");

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        title:title,
        description:details,
        courseCode:courseCode
      },
      {new: true}
    );

    if(!course){
      console.error("Course not found");
      throw new Error("Course not found");
    }

    console.log("Course updated:", course);
    return course.toObject(); 
  }catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};