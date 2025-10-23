import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { NextResponse } from "next/server";



export async function POST(req:Request) {
  try {
    const {prompt} = await req.json()
  const { text } = await generateText({
    model: google("models/gemini-2.0-flash-exp"),
    prompt
    })
    
    return NextResponse.json({text})
  } catch (error) {
    console.error(error);
  }
}
