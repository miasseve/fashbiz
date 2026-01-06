import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PointRule from "@/models/PointRule";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function mapSubcategoryToCategory(subcategory = "") {
  const map = {
    hoodie: "JACKET",
    jacket: "JACKET",
    "biker jacket": "JACKET",
    "leather jacket": "JACKET",
    "denim jacket": "JACKET",
    blazer: "BLAZER",
    coat: "COAT",
    dress: "MAXI_DRESS",
    "maxi dress": "MAXI_DRESS",
    jumpsuit: "JUMPSUIT",
    "co-ord": "SET",
    "co ord": "SET",
    set: "SET",
    shoes: "SHOES",
    sneakers: "SHOES",
    boots: "BOOTS",
    bag: "BAGS",
    handbag: "BAGS",
    accessories: "ACCESSORIES",
  };

  const key = subcategory.toLowerCase();
  return map[key] || "ACCESSORIES"; // safe fallback
}

function mapBrandType(brand = "") {
  if (!brand || brand.trim().toLowerCase() === "unknown") return "ANY";

  const fastFashionBrands = [
    "zara",
    "hm",
    "h&m",
    "bershka",
    "pull&bear",
    "pull and bear",
    "stradivarius",
    "shein",
  ];

  const lessFastFashionBrands = [
    "cos",
    "inwear",
    "arket",
    "acne studios",
    "ganni",
    "filippa k",
    "weekday",
    "massimo dutti",
    "lv",
    "gucci",
    "louis vuitton",
    "prada",
    "chanel",
    "dior",
    "burberry",
  ];

  const brandLower = brand.toLowerCase();

  if (fastFashionBrands.some((b) => brandLower.includes(b))) {
    return "FAST_FASHION";
  }

  if (lessFastFashionBrands.some((b) => brandLower.includes(b))) {
    return "LESS_FAST_FASHION";
  }

  // non-premium brands FAST_FASHION by default
  return "FAST_FASHION";
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrls, brand, subcategory, description } = await req.json();
    const FashionType = mapBrandType(brand);
    const Category = mapSubcategoryToCategory(subcategory);
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    await dbConnect();

    // Fetch store-specific rules
    const rules = await PointRule.find({
      storeUserId: session.user.id,
      isActive: true,
    }).lean();

    if (!rules.length) {
      return NextResponse.json(
        { error: "No point rules found" },
        { status: 400 }
      );
    }

    // Ask AI to PREDICT POINTS
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `
                You are an AI that assigns reward points for second-hand fashion items.
                QUALITY CHECK (FIRST):
                - Evaluate ONLY the provided images.
                - If ANY visible image shows stains,damage, holes, tears, discoloration, or heavy wear → points = 0.
                - Do NOT assume missing angles are damaged.

                Rules:
                - You MUST follow the provided point rules
                - If min/max exists, choose a reasonable value within the range
                - If FashionType is unknown, use FashionType "ANY"
                - If unsure, choose fixedPoints 
                - Respond ONLY with valid JSON
                {
                  "points": <number>,
                  "reason": "<brief explanation of why these points were assigned>",
                  "category": "<the category used>",
                  "fashionType": "<the fashion type used>",
                  "brand": "<the brand name>"
                }
                Point Rules:
                ${JSON.stringify(rules, null, 2)}
                `,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
                    Analyze the product and assign points.
                    Brand: ${brand || "Unknown"}
                    Fashion Type: ${FashionType}
                    Category: ${Category}
                    Description: ${description || "N/A"}
                    IMPORTANT: 
                    1. First check for stains, holes, damage .
                    2. If ANY quality issues are found in any image, explain them clearly and set points to 0
                    3. Only assign points if the item appears clean, undamaged, and in good condition
                    4. Provide a clear reason for your decision`,
            },
            ...imageUrls.map((url) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        },
      ],
    });

    const raw = aiResponse.choices[0].message.content.trim();
    // Remove markdown code fences if present
    const cleanedRaw = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanedRaw);

    return NextResponse.json({
      success: true,
      data: {
        points: parsed.points,
        reason: parsed.reason,
        category: parsed.category || Category,
        fashionType: parsed.fashionType || FashionType,
        brand: parsed.brand || brand || "Unknown",
      },
    });
  } catch (error) {
    console.error("AI points error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
