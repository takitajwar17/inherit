// lib/models/questionModel.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    voters: {
      type: [
        {
          userId: {
            type: String,
            required: true,
          },
          vote: {
            type: Number,
            required: true,
          },
        },
      ],
      default: [], // Initialize voters as an empty array by default
    },
    answers: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
    author: {
      type: String, // or Schema.Types.ObjectId if referencing a User model
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true, // This adds `createdAt` and `updatedAt` fields
  }
);

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
