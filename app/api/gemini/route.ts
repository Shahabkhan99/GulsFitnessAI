import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const { text } = await generateText({
      model: google("models/gemini-2.0-flash-exp"),
      prompt,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(error);
    // ADD THIS BLOCK TO SEND THE ERROR BACK TO THE FRONTEND
    return NextResponse.json(
      { error: "Failed to generate text", details: error.message },
      { status: 500 }
    );
  }
}
