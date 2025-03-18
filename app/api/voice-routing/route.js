import { NextResponse } from 'next/server';
const Groq = require('groq-sdk');

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Define the system prompt for Groq
    const systemPrompt = `You are a voice command routing assistant. 
    Based on the user's voice command, determine the most appropriate route to navigate to.
    Return ONLY a JSON object with this structure: { "route": "string" }.
    
    Available routes:
    - "/" for home
    - "/dashboard" for dashboard
    - "/learn" for learning resources
    - "/roadmaps" for roadmaps
    - "/dev-discuss" for discussions
    - "/quests" for quests
    - "/playground" for playground
    - "/faq" for help
    - "/dev-discuss/ask-questions" for asking questions
    
    If the command doesn't match any route, return { "route": null }.
    `;

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 100,
      response_format: {
        type: "json_object"
      },
      stream: false,
      stop: null,
    });

    const responseContent = chatCompletion.choices[0].message.content;
    let routeData;
    
    try {
      routeData = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing Groq response:', error);
      return NextResponse.json(
        { error: 'Failed to parse Groq response' },
        { status: 500 }
      );
    }

    return NextResponse.json(routeData);
  } catch (error) {
    console.error('Error processing voice command:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
}