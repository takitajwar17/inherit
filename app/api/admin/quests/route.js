/**
 * Admin Quests Management API
 * 
 * GET /api/admin/quests - List all quests
 * POST /api/admin/quests - Create a new quest
 * 
 * Protected by admin authentication.
 */

import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import { adminAuth } from "@/lib/middleware/adminAuth";
import logger, { logDatabase, events } from "@/lib/logger";
import { validateRequest, createQuestSchema } from "@/lib/validation";

export const GET = adminAuth(async () => {
  try {
    await connect();
    logDatabase("find", "Quest", { operation: "admin_list_all" });
    
    const quests = await Quest.find({}).sort({ createdAt: -1 });
    
    logger.debug("Admin fetched all quests", { count: quests.length });
    return NextResponse.json(quests.map((quest) => quest.toObject()));
  } catch (error) {
    logger.error("Error fetching quests (admin)", { error: error.message });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const POST = adminAuth(async (req) => {
  try {
    await connect();
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = validateRequest(createQuestSchema, body);
    if (!validation.success) {
      logger.warn("Quest creation validation failed", { error: validation.error });
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const questData = validation.data;

    // Log the incoming data
    logger.info("Creating new quest", { 
      questName: questData.name, 
      questionCount: questData.questions.length 
    });
    logger.debug("Quest data received", { questData });

    const quest = await Quest.create({
      ...questData,
      createdBy: "admin",
    });

    // Log the created quest
    logger.info("Quest created successfully", { 
      questId: quest._id, 
      questName: quest.name 
    });
    events.questCreated(quest._id, quest.name);

    return NextResponse.json(quest.toObject());
  } catch (error) {
    logger.error("Error creating quest", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
});
