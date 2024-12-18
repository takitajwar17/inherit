import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb/mongoose';
import Quest from '@/lib/models/questModel';

export async function GET() {
  try {
    await connect();

    // Only fetch active quests for public access
    const quests = await Quest.find({ isActive: true })
      .select('name level timeLimit questions startTime endTime')
      .sort({ startTime: 1 });

    return NextResponse.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
