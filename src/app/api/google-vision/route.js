import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { errorMessage: "No image URL provided" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: 'Analyze the image and return a **valid JSON** with fields: "title", "brand" and "description". Do not include markdown, code blocks, or explanations — only raw JSON.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and describe it" },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 200, 
    });

    let rawText = response.choices[0]?.message?.content?.trim();

    rawText = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
 
      let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      parsed = { description: rawText };
    }

    return NextResponse.json(
      {
        message: "Image processed successfully",
        ...parsed,
      },
      { status: 200 }
    );
  } catch (error) {
 
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 } 
    );
  }
}
