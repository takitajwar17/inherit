import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import Attempt from '@/lib/models/attemptModel';

export async function POST(request) {
  try {
    await connect();
    const { questId, userId } = await request.json();

    // Validate quest exists and is active
    const quest = await Quest.findById(questId);
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startTime = new Date(quest.startTime);
    const endTime = new Date(quest.endTime);

    console.log('Time check:', {
      now: now.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isActive: now >= startTime && now <= endTime
    });

    // Check if quest is currently active
    if (now < startTime || now > endTime) {
      return NextResponse.json(
        { error: 'Quest is not currently active' },
        { status: 400 }
      );
    }

    // Check if user already has an attempt for this quest
    const existingAttempt = await Attempt.findOne({
      userId,
      questId,
      status: { $in: ['in-progress', 'completed'] }
    });

    console.log('Attempt check:', {
      userId,
      questId,
      existingAttempt: existingAttempt ? {
        id: existingAttempt._id,
        status: existingAttempt.status
      } : null
    });

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'You already have an attempt for this quest' },
        { status: 400 }
      );
    }

    // Create new attempt
    const attempt = await Attempt.create({
      userId,
      questId,
      startTime: now,
      endTime: new Date(now.getTime() + quest.timeLimit * 60000), // Add time limit in minutes
    });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}
