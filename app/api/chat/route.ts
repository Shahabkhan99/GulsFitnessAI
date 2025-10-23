// app/api/chat/route.ts
import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({ text: response.choices[0].message.content })
  } catch (error) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
