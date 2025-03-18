import { NextResponse } from 'next/server';
import axios from 'axios';
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
    Based on the user's voice command, determine the most appropriate route to navigate to or action to take.
    
    Return ONLY a JSON object with one of these structures:
    1. For navigation: { "route": "string", "action": null }
    2. For learning about a topic: { "route": null, "action": "learn", "topic": "string" }
    
    Available routes:
    - "/" for home
    - "/dashboard" for dashboard
    - "/learn" for learning resources
    - "/roadmaps" for roadmaps
    - "/dev-discuss" for discussions
    - "/quests" for quests
    - "/playground" for playground
    - "/faq" for help
    - "/dev-discuss/ask-question" for asking questions
    - "/faq/contact" for contacting support
    
    For learning commands (e.g., "teach me about React", "show tutorial on JavaScript", "I want to learn Python"):
    - Set action to "learn"
    - Extract the topic from the command
    
    If the command doesn't match any route or action, return { "route": null, "action": null }.
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

    // Handle learning action by searching for a video on the topic
    if (routeData.action === 'learn' && routeData.topic) {
      try {
        // Call the video-search API
        const videoSearchResponse = await fetch(new URL('/api/video-search', request.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: routeData.topic }),
        });

        if (!videoSearchResponse.ok) {
          throw new Error(`Video search failed with status: ${videoSearchResponse.status}`);
        }

        const videoData = await videoSearchResponse.json();
        
        // Return route to the video page with the video ID
        return NextResponse.json({
          route: `/learn/${videoData.videoId}`,
          videoData: videoData
        });
      } catch (error) {
        console.error('Error searching for video:', error);
        return NextResponse.json(
          { error: 'Failed to find a video for this topic' },
          { status: 500 }
        );
      }
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