/**
 * Attempt Details API
 * 
 * GET /api/attempts/[attemptId]
 * 
 * Retrieves details for a specific attempt.
 */

import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Attempt from '@/lib/models/attemptModel';
import logger, { logDatabase } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    await connect();
    
    logDatabase("findById", "Attempt", { attemptId: params.attemptId });
    const attempt = await Attempt.findById(params.attemptId)
      .populate('questId', 'name level timeLimit');

    if (!attempt) {
      logger.warn("Attempt not found", { attemptId: params.attemptId });
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    logger.debug("Attempt details retrieved", { 
      attemptId: params.attemptId, 
      status: attempt.status 
    });

    return NextResponse.json(attempt);
  } catch (error) {
    logger.error("Error fetching attempt", { 
      attemptId: params.attemptId, 
      error: error.message 
    });
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}
