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
    if (!text) {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) throw new Error("HF_API_KEY missing in environment");

      const model = "mistralai/Mistral-7B-Instruct-v0.3";
      const url = `https://router.huggingface.co/hf-inference/${model}`;

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

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ HF API error:", errText);
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const data = await response.json();
      text = Array.isArray(data)
        ? data[0]?.generated_text || ""
        : data.generated_text || "";
      source = "huggingface";
    }

    if (!text) throw new Error("No AI output generated");

    cache.set(prompt, text);
    return NextResponse.json({ text, source });
  } catch (error: any) {
    console.error("❌ API crash:", error.message);
    return NextResponse.json(
      { error: true, message: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
