import { NextResponse } from "next/server";
import OpenAI from "openai";
import dbConnect from "@/lib/db";
import FabricOption from "@/models/FabricOption";

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

    // Fetch active fabric options from DB for AI prediction
    await dbConnect();
    const fabrics = await FabricOption.find({ active: true }).sort({ name: 1 });
    const fabricNames = fabrics.map((f) => f.name);

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
            - "fabric": string (predicted fabric type)
            - "tags": array of 3-4 lowercase strings suitable for Shopify product tags

            Fabric rules:
            - Analyze the texture, sheen, drape, and visual appearance of the garment to predict the fabric
            - You MUST pick exactly one value from the following list: ${JSON.stringify(fabricNames)}
            - If you cannot determine the fabric with confidence, pick the most likely option based on the product type (e.g. jeans → "Denim", suit → "Wool", t-shirt → "Cotton")

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
      max_tokens: 250,
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
