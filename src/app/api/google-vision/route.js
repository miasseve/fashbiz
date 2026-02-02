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
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze the image and return a valid JSON object with the following fields:

            - "title"
            - "brand"
            - "size"
            - "subcategory" (specific product type like "dress shirt", "biker jacket", "hoodie")
            - "description"
            - "color": { "name": string, "hex": string }
            - "tags": array of 3-4 lowercase strings suitable for Shopify product tags

            Tag rules:
            - Tags must be generic, reusable, and collection-friendly
            - Include product type (e.g. "shirt", "jacket")
            - Include gender when clearly inferable ("men", "women", "kids", otherwise "unisex")
            - Include color name as a tag
            - Include category-style tags when obvious (e.g. "casual", "winter", "formal")
            - Do NOT invent brands
            - Do NOT include size as a tag
            - Do NOT include duplicates

            Color rules:
            - If multiple distinct colors or patterns exist, return:
              { "name": "multicolor", "hex": "#FFFFFF" }
            - Otherwise return the dominant color name and hex

            Respond with ONLY raw JSON.
            No markdown, no explanations.`,
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
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ errorMessage: error.message }, { status: 500 });
  }
}
