import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ required for OpenAI SDK on Vercel

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // ✅ initialize model with your API key
    const model = openai("gpt-4o-mini", {
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text } = await generateText({
      model,
      prompt,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("🚨 OpenAI API Error:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Internal Server Error — unable to generate text.",
      },
      { status: 500 }
    );
  }
}
