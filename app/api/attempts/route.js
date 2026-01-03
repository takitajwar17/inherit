/**
 * Quest Attempts API
 * 
 * POST /api/attempts
 * 
 * Creates a new attempt for a quest.
 */

import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import Attempt from '@/lib/models/attemptModel';
import { auth } from '@clerk/nextjs';
import logger, { logDatabase, events } from '@/lib/logger';
import { validateRequest, createAttemptSchema } from '@/lib/validation';

export async function POST(request) {
  try {
    await connect();
    
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(createAttemptSchema, body);
    if (!validation.success) {
      logger.warn("Attempt creation validation failed", { error: validation.error });
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { questId } = validation.data;
    logDatabase("findById", "Quest", { questId, operation: "create_attempt" });

    // Check if quest exists and is still active
    const quest = await Quest.findById(questId);
    if (!quest) {
      logger.warn("Quest not found for attempt creation", { questId });
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const endTime = new Date(quest.endTime);
    if (now >= endTime) {
      logger.warn("Attempt on ended quest", { questId, endTime });
      return NextResponse.json(
        { error: 'This quest has ended' },
        { status: 400 }
      );
    }

    // Check for existing attempts
    const existingAttempt = await Attempt.findOne({
      userId,
      questId,
      status: { $in: ['in-progress', 'completed'] }
    });

    if (existingAttempt) {
      logger.warn("Duplicate quest attempt", { userId, questId });
      return NextResponse.json(
        { error: 'You have already attempted this quest' },
        { status: 400 }
      );
    }

    // Create new attempt
    const attempt = new Attempt({
      userId,
      questId,
      startTime: now,
      endTime: endTime,
      status: 'in-progress',
      totalPoints: 0,
      maxPoints: quest.questions.reduce((total, q) => total + q.points, 0),
      answers: []
    });

    await attempt.save();
    
    logger.info("Quest attempt created", { 
      userId, 
      questId, 
      attemptId: attempt._id 
    });
    events.questAttempted(userId, questId);

    return NextResponse.json(attempt);
  } catch (error) {
    logger.error("Error creating attempt", { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}
