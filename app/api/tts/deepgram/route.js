import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text, language } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.warn("DEEPGRAM_API_KEY not set");
      return NextResponse.json({ error: "DEEPGRAM_API_KEY not set" }, { status: 500 });
    }

    // Deepgram Aura (TTS) models
    // aura-asteria-en: US English Female
    // aura-luna-en: US English Female
    // aura-orion-en: US English Male
    // aura-arcas-en: US English Male
    // aura-perseus-en: US English Male
    // aura-angus-en: Irish English Male
    // aura-orpheus-en: US English Male
    // aura-helios-en: UK English Male
    // aura-zeus-en: US English Male
    
    // For Bengali, we might want to check if there are other models, but for now we'll stick to English models 
    // or if Deepgram adds support later. 
    // Ideally we would use a model that supports the target language.
    const model = language === "bn" ? "aura-hera-en" : "aura-asteria-en";

    const dgRes = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text }),
    });

    if (!dgRes.ok) {
      const errText = await dgRes.text();
      console.error("Deepgram TTS error:", errText);
      return NextResponse.json(
        { error: "Deepgram TTS failed", details: errText },
        { status: 502 }
      );
    }

    const arrayBuffer = await dgRes.arrayBuffer();
    
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Deepgram route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
