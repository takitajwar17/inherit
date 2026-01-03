import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import logger, { logDatabase } from '@/lib/logger';

/**
 * Public Quests API
 * 
 * GET /api/quests
 * 
 * Retrieves all active quests for public access.
 */
export async function GET() {
  try {
    await connect();
    logDatabase("find", "Quest", { filter: "isActive" });

    // Only fetch active quests for public access
    const quests = await Quest.find({ isActive: true })
      .select('name level timeLimit questions startTime endTime')
      .sort({ startTime: 1 });

    logger.debug("Public quests fetched", { count: quests.length });
    return NextResponse.json(quests);
  } catch (error) {
    logger.error("Error fetching quests", { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
