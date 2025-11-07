// app/api/generate-text/route.ts
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";          // <-- Groq provider
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-text
 *
 * Expects a JSON body:
 *   { "prompt": "some text" }
 *
 * Returns:
 *   { "text": "generated text" }
 *
 * On error it returns a 500 with an error message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' in request body" },
        { status: 400 }
      );
    }

    const { text } = await generateText({
      model: groq("gemma-7b-it"),     // <-- change model name here
      prompt: body.prompt,
      // optional: tweak generation parameters
      // temperature: 0.7,
      // max_output_tokens: 500,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Text generation error:", error);

    // Return a friendly error to the client
    return NextResponse.json(
      {
        error: "Failed to generate text",
        details: error.message || error.toString(),
      },
      { status: 500 }
    );
  }
}
