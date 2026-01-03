/**
 * User Quest Attempt API
 * 
 * GET /api/attempts/user/[questId]
 * 
 * Retrieves the most recent attempt for a user on a specific quest.
 */

import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Attempt from '@/lib/models/attemptModel';
import { auth } from '@clerk/nextjs';
import logger, { logDatabase } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    await connect();
    
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logDatabase("findOne", "Attempt", { userId, questId: params.questId });

    // Find the most recent attempt for this user and quest
    const attempt = await Attempt.findOne({
      userId,
      questId: params.questId,
      status: { $in: ['in-progress', 'completed'] }
    }).sort({ createdAt: -1 });

    if (!attempt) {
      logger.debug("No attempt found for user quest", { userId, questId: params.questId });
      return NextResponse.json(null);
    }

    logger.debug("User attempt retrieved", { 
      userId, 
      questId: params.questId, 
      attemptStatus: attempt.status 
    });

    return NextResponse.json(attempt);
  } catch (error) {
    logger.error("Error fetching user attempt", { 
      questId: params.questId, 
      error: error.message 
    });
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}
