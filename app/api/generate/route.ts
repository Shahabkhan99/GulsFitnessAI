import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

const cache = new Map<string, string>();

// ✅ Important: Use Node runtime so env vars work in Vercel
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
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

    // 1️⃣ Gemini attempt
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const geminiResp = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          prompt,
        });
        text = geminiResp.text;
        source = "gemini";
      } catch (err: any) {
        console.warn("⚠️ Gemini failed:", err.message);
      }
    }

    // 2️⃣ Hugging Face fallback
const model = "mistralai/Mistral-7B-Instruct-v0.3";
const url = `https://router.huggingface.co/inference/${model}`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${hfKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 400,
      temperature: 0.7,
      return_full_text: false,
    },
  }),
});


