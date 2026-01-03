import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Quest from "@/lib/models/questModel";
import logger, { logDatabase } from "@/lib/logger";

/**
 * Single Quest API
 * 
 * GET /api/quests/[questId]
 * 
 * Retrieves details for a specific quest.
 */
export async function GET(request, { params }) {
  try {
    await connect();
    logDatabase("findById", "Quest", { questId: params.questId });
    
    const quest = await Quest.findById(params.questId).select(
      "name level timeLimit questions startTime endTime"
    );

    if (!quest) {
      logger.warn("Quest not found", { questId: params.questId });
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // Log quest details for debugging
    logger.debug("Quest details retrieved", {
      questId: quest._id,
      startTime: quest.startTime,
      endTime: quest.endTime,
      timeLimit: quest.timeLimit,
    });

    return NextResponse.json(quest);
  } catch (error) {
    logger.error("Error fetching quest", { 
      questId: params.questId, 
      error: error.message 
    });
    return NextResponse.json(
      { error: "Failed to fetch quest" },
      { status: 500 }
    );
  }
}
