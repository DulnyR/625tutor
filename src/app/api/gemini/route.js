import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// IMPORTANT: Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or your preferred model

    // Construct a more context-aware prompt if context is provided
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Context: Studying for Leaving Cert ${context.level || ''} Level ${context.subject || ''} (${context.year || ''}), specifically related to ${context.paper ? `Paper ${context.paper}` : ''} ${context.question ? `Question ${context.question}` : ''}. \n\nStudent's question: ${prompt}\n\nAnswer:`;
      console.log("Using context:", context); // For debugging
      console.log("Full prompt:", fullPrompt); // For debugging
    } else {
      fullPrompt = `Student's question: ${prompt}\n\nAnswer:`;
    }


    console.log("Sending prompt to Gemini:", fullPrompt); // Log the prompt being sent

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Received response from Gemini:", text); // Log the response

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Check for specific Gemini API error details if available
    if (error.response && error.response.data) {
        console.error("Gemini API Error Details:", error.response.data);
        return NextResponse.json({ error: `Gemini API Error: ${error.response.data.error?.message || 'Unknown error'}` }, { status: 500 });
    }
     // Check if error is related to API key configuration
     if (error.message && error.message.includes('API key not valid')) {
        console.error("Gemini API Key Error:", error.message);
        return NextResponse.json({ error: "Invalid or missing Gemini API Key configuration on the server." }, { status: 500 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}