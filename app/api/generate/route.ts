import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const cache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt missing" }, { status: 400 });
    }

    // Cache
    if (cache.has(prompt)) {
      return NextResponse.json({
        text: cache.get(prompt),
        source: "cache",
      });
    }

    let text = "";
    let source = "";

    // 1️⃣ Try Gemini
    try {
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        const resp = await generateText({
          model: google("models/gemini-2.0-flash-exp"),
          prompt,
        });

        text = resp.text;
        source = "gemini";
      }
    } catch (err: any) {
      console.warn("Gemini failed:", err.message);
    }

    // 2️⃣ Fallback: HuggingFace
    if (!text) {
      const HF_KEY = process.env.HF_API_KEY;
      if (!HF_KEY) throw new Error("HF_API_KEY missing");

    const model = "google/gemma-2-9b-it";
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;

      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
          },
        }),
      });

      if (!r.ok) {
        throw new Error(`HF error ${r.status}: ${await r.text()}`);
      }

      const data = await r.json();

      text = Array.isArray(data)
        ? data[0]?.generated_text || ""
        : data.generated_text || "";

      source = "huggingface";
    }

    if (!text) throw new Error("No AI output generated");

    cache.set(prompt, text);

    return NextResponse.json({ text, source });
  } catch (err: any) {
    console.error("API error:", err.message);
    return NextResponse.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}

