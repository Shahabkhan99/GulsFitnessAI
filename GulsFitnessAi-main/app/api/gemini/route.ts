import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

// Ensure you have your GOOGLE_API_KEY set in your .env file

export async function POST(req: Request) {
  try {
    // Get the prompt from the request body
    const { prompt }: { prompt: string } = await req.json();

    // 1. Add input validation
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 } // 400 Bad Request
      );
    }

    // 2. Call the generation model
    const { text } = await generateText({
      // 3. Updated model to a standard, current one
      // You can change this back if you have specific access to 'gemini-2.0-flash-exp'
      model: google("models/gemini-1.5-flash"), 
      prompt: prompt,
    });

    // 4. Return the successful response
    return NextResponse.json({ text });

  } catch (error) {
    // 5. CRITICAL: Return an error response to the client
    // Your original code only logged the error but never sent a 
    // response, which would cause the request to time out.
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 } // 500 Internal Server Error
    );
  }
}
