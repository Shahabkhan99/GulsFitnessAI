import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is missing!");
      return NextResponse.json(
        { error: true, details: "GOOGLE_API_KEY is missing" },
        { status: 500 }
      );
    }

    const { text } = await generateText({
      model: google("models/gemini-2.0-flash-exp", { apiKey }),
      prompt,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: true, details: error.message },
      { status: 500 }
    );
  }
}
