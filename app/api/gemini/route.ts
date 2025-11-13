import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

// Simple in-memory cache
const cache = new Map<string, string>();

export const runtime = "edge"; // ✅ Optional: for faster Vercel Edge functions

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt missing" }, { status: 400 });
    }

    // 🧠 Cache first
    if (cache.has(prompt)) {
      return NextResponse.json({
        text: cache.get(prompt),
        source: "cache",
      });
    }

    let text = "";
    let source = "";

    // 💎 Try Gemini first
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const geminiResp = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          prompt,
        });
        text = geminiResp.text;
        source = "gemini";
      } catch (err: any) {
        console.warn("Gemini failed:", err.message);
      }
    }

    // 🪶 Fallback: Hugging Face
    if (!text) {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) throw new Error("HF_API_KEY missing in Vercel environment");

      const model = "mistralai/Mistral-7B-Instruct-v0.3";
      const hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${hfKey}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
        }
      );

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        throw new Error(`Hugging Face API error: ${errorText}`);
      }

      const hfData = await hfResponse.json();
      text = Array.isArray(hfData)
        ? hfData[0]?.generated_text || ""
        : hfData.generated_text || "";

      source = "huggingface";
    }

    if (!text) throw new Error("No AI response generated");

    cache.set(prompt, text);

    return NextResponse.json({ text, source });
  } catch (error: any) {
    console.error("Error in /api/generate:", error.message);
    return NextResponse.json(
      { error: true, details: error.message },
      { status: 500 }
    );
  }
}
