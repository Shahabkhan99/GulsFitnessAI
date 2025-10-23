import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs" // ✅ important for OpenAI SDK

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // fast, cost-effective
      prompt,
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
