import { NextResponse } from 'next/server';

// This is the new Hugging Face API call
async function queryHuggingFace(prompt: string) {
  // --- THIS IS THE FIX ---
  // Both Mistral and Llama 3 are giving 410 "Gone" errors,
  // meaning they've been removed from the free tier.
  // We are switching to a reliable, free Google model.
  const API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large";
  // --- END OF FIX ---
  
  // We use HF_TOKEN for both the environment variable and the JS variable.
  const HF_TOKEN = process.env.HF_TOKEN; 
  
  if (!HF_TOKEN) {
    // This will be caught by the client and displayed
    throw new Error("HF_TOKEN environment variable is not set");
  }

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 500, // Limit the length of the response
      return_full_text: false, // Only return the AI's response
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HF_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Pass the error status from Hugging Face back to your component
    return new NextResponse(await response.text(), { status: response.status });
  }

  const data = await response.json();
  // The response is an array, so we take the first item.
  return NextResponse.json({ generated_text: data[0].generated_text });
}

// This is the POST function that your Homepage.tsx component will call
export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Call the secure function
    return await queryHuggingFace(prompt);

  } catch (error: any) {
    console.error("Error in API route:", error);
    // This will now pass the "HF_TOKEN is not set" error to the client
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
