import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Attempt from '@/lib/models/attemptModel';
import Quest from '@/lib/models/questModel';
import { auth } from '@clerk/nextjs';

export async function POST(request, { params }) {
  try {
    await connect();

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { answers, isAutoSubmit } = await request.json();

    // Find the attempt and verify ownership
    const attempt = await Attempt.findById(params.attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (attempt.status === 'completed') {
      return NextResponse.json(
        { error: 'Attempt already completed' },
        { status: 400 }
      );
    }

    // Get quest to check end time
    const quest = await Quest.findById(attempt.questId);
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const endTime = new Date(quest.endTime);
    if (now > endTime && !isAutoSubmit) {
      return NextResponse.json(
        { error: 'Quest has ended' },
        { status: 400 }
      );
    }

    // Update attempt with answers and mark as completed
    attempt.answers = answers;
    attempt.status = 'completed';
    attempt.totalPoints = 0; // Calculate points based on answers

    // Basic scoring - 1 point per correct answer
    for (const answer of answers) {
      const question = quest.questions.find(q => q._id.toString() === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        attempt.totalPoints += 1;
      }
    }

    await attempt.save();
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}
