import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import { adminAuth } from "@/lib/middleware/adminAuth";
import logger from "@/lib/logger";
import { validateRequest, updateQuestSchema, isValidMongoId } from "@/lib/validation";

export const GET = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      return NextResponse.json(
        { error: "Invalid quest ID format" },
        { status: 400 }
      );
    }

    await connect();
    const quest = await Quest.findById(params.id);
    
    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quest);
  } catch (error) {
    logger.error("Error fetching quest", { id: params.id, error: error.message });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const PUT = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      return NextResponse.json(
        { error: "Invalid quest ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate request body with Zod schema (partial for updates)
    const validation = validateRequest(updateQuestSchema, body);
    if (!validation.success) {
      logger.warn("Quest update validation failed", { id: params.id, error: validation.error });
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    await connect();
    const quest = await Quest.findByIdAndUpdate(
      params.id,
      { ...validation.data },
      { new: true, runValidators: true }
    );

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    logger.info("Quest updated", { id: params.id, name: quest.name });
    return NextResponse.json(quest);
  } catch (error) {
    logger.error("Error updating quest", { id: params.id, error: error.message });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const DELETE = adminAuth(async (req, { params }) => {
  try {
    // Validate MongoDB ObjectId
    if (!isValidMongoId(params.id)) {
      return NextResponse.json(
        { error: "Invalid quest ID format" },
        { status: 400 }
      );
    }

    await connect();
    const quest = await Quest.findByIdAndDelete(params.id);
    
    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    logger.info("Quest deleted", { id: params.id, name: quest.name });
    return NextResponse.json({ message: "Quest deleted successfully" });
  } catch (error) {
    logger.error("Error deleting quest", { id: params.id, error: error.message });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});
