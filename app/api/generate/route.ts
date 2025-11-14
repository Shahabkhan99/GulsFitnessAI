import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const cache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Cache check
    if (cache.has(prompt)) {
      return NextResponse.json({
        text: cache.get(prompt),
        source: "cache",
      });
    }

    let text = "";
    let source = "";

    // 1️⃣ Gemini
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

    // 2️⃣ HuggingFace fallback
    if (!text) {
      const hfKey = process.env.HF_API_KEY;
      if (!hfKey) {
        throw new Error("HF_API_KEY is missing in Vercel env");
      }

      const model = "mistralai/Mistral-7B-Instruct-v0.3";
      const url = `https://router.husggyface.co/hf-inference/models/${model}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `HF error ${response.status}: ${await response.text()}`
        );
      }

      const data = await response.json();
      text = Array.isArray(data)
        ? data[0]?.generated_text || ""
        : data.generated_text || "";

      source = "huggingface";
    }

    if (!text) throw new Error("Both Gemini & HF failed");

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
