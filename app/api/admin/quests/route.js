import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import { adminAuth } from "@/lib/middleware/adminAuth";

export const GET = adminAuth(async () => {
  try {
    await connect();
    const quests = await Quest.find({}).sort({ createdAt: -1 });
    return NextResponse.json(quests.map((quest) => quest.toObject()));
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const POST = adminAuth(async (req) => {
  try {
    await connect();
    const questData = await req.json();

    // Validate questions array
    if (!questData.questions) {
      questData.questions = [];
    }

    // Validate each question's structure
    questData.questions = questData.questions.map((question) => {
      if (question.type === "coding" && question.testCases) {
        question.testCases = question.testCases.map((testCase) => {
          if (!testCase.input || !testCase.expectedOutput) {
            throw new Error(
              "Test cases must have both input and expectedOutput fields"
            );
          }
          return {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
          };
        });
      }
      return question;
    });

    // Log the incoming data
    console.log("Received quest data:", JSON.stringify(questData, null, 2));

    const quest = await Quest.create({
      ...questData,
      createdBy: "admin",
    });

    // Log the created quest
    console.log("Created quest:", JSON.stringify(quest, null, 2));

    return NextResponse.json(quest.toObject());
  } catch (error) {
    console.error("Error creating quest:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
});
