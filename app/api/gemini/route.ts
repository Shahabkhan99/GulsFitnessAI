import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // --- Try Google Gemini first ---
    if (process.env.GOOGLE_API_KEY) {
      try {
        const { text } = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          prompt,
        });
        return NextResponse.json({ text, source: "gemini" });
      } catch (geminiError: any) {
        console.error("Gemini API failed:", geminiError.message);
        // Fall through to free alternative
      }
    } else {
      console.warn("GOOGLE_API_KEY missing. Using fallback AI.");
    }

    // --- Fallback: Free Hugging Face model ---
    const hfModel = "tiiuae/falcon-7b-instruct"; // Free model
    const hfApiUrl = `https://api-inference.huggingface.co/models/${hfModel}`;
    const hfApiKey = process.env.HF_API_KEY; // Optional if you have a free HF key

    const hfResponse = await fetch(hfApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(hfApiKey ? { Authorization: `Bearer ${hfApiKey}` } : {}),
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      throw new Error(`Hugging Face API error: ${errText}`);
    }

    const hfData = await hfResponse.json();
    const text = Array.isArray(hfData) ? hfData[0]?.generated_text || "" : hfData.generated_text || "";

    return NextResponse.json({ text, source: "huggingface" });
  } catch (error: any) {
    console.error("All AI attempts failed:", error.message);
    return NextResponse.json(
      { error: true, details: error.message },
      { status: 500 }
    );
  }
}
