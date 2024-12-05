import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';
import Attempt from '@/lib/models/attemptModel';

export async function POST(request, { params }) {
  try {
    await connect();
    const { answers, isAutoSubmit } = await request.json();

    // Find attempt and validate
    const attempt = await Attempt.findById(params.attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'Attempt is already completed' },
        { status: 400 }
      );
    }

    // Get quest details
    const quest = await Quest.findById(attempt.questId);
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Process answers and calculate points
    let totalPoints = 0;
    const processedAnswers = answers.map(({ questionId, answer }) => {
      const question = quest.questions.id(questionId);
      if (!question) return null;

      let isCorrect = false;
      let points = 0;

      // For now, implement basic answer checking
      // In the future, you might want to implement more sophisticated checking,
      // especially for coding questions
      if (question.type === 'short') {
        // Case-insensitive exact match for short answers
        isCorrect = answer.toLowerCase().trim() === question.answer?.toLowerCase().trim();
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'coding') {
        // For coding questions, you might want to implement test case validation
        // For now, just store the answer
        isCorrect = null; // Requires manual review
        points = 0;
      }

      totalPoints += points;

      return {
        questionId,
        answer,
        isCorrect,
        points,
        submittedAt: new Date()
      };
    }).filter(Boolean);

    // Update attempt
    attempt.answers = processedAnswers;
    attempt.totalPoints = totalPoints;
    attempt.status = 'completed';
    attempt.endTime = new Date();
    await attempt.save();

    return NextResponse.json({
      status: 'completed',
      totalPoints,
      message: isAutoSubmit ? 'Time expired - answers auto-submitted' : 'Answers submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}
