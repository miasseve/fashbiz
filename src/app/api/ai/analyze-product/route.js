import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import FabricOption from "@/models/FabricOption";
import { normalizeProductResponse } from "@/lib/normalize";
import {
  CATEGORIES,
  SUBCATEGORIES,
  NORMALIZED_FABRICS,
} from "@/lib/taxonomy";
import {
  retrieveSimilarProducts,
  buildEmbeddingText,
} from "@/lib/embeddings";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Required response schema for Structured Outputs ──
const PRODUCT_RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "product_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Merchant-facing clean title" },
        brand: { type: "string", description: "Brand name, controlled vocabulary if matched" },
        size: { type: "string", description: "Normalized size format (S, M, L, EU 38, etc.)" },
        category: {
          type: "string",
          enum: CATEGORIES,
          description: "Top-level category",
        },
        subcategory: { type: "string", description: "Store taxonomy subcategory" },
        color: {
          type: "object",
          description: "Dominant color of the product",
          properties: {
            name: { type: "string", description: "Color name (e.g. navy, cream, burgundy). Use 'multicolor' for patterns or multiple distinct colors." },
            hex: { type: "string", description: "Hex color code for the dominant color (e.g. #1A2B3C). Use #FFFFFF for multicolor." },
          },
          required: ["name", "hex"],
          additionalProperties: false,
        },
        fabric: {
          type: "array",
          items: { type: "string" },
          description: "Allowed material vocabulary",
        },
        description: { type: "string", description: "Short resale-ready copy" },
        condition_grade: {
          type: "string",
          enum: ["A", "B", "C"],
          description: "A = like new, B = good, C = fair",
        },
        condition_notes: { type: "string", description: "Visible wear or defects" },
        shopify_tags: {
          type: "array",
          items: { type: "string" },
          description: "REe + store tags for Shopify",
        },
        confidence_score: {
          type: "number",
          description: "0 to 1 confidence in the analysis",
        },
      },
      required: [
        "title",
        "brand",
        "size",
        "category",
        "subcategory",
        "color",
        "fabric",
        "description",
        "condition_grade",
        "condition_notes",
        "shopify_tags",
        "confidence_score",
      ],
      additionalProperties: false,
    },
  },
};

/**
 * POST /api/ai/analyze-product
 * Pipeline:
 *  1. Image upload (URL provided)
 *  2. Vision extraction call (GPT-4o-mini)
 *  3. Similarity search in approved REe products
 *  4. Second AI generation with retrieved examples + store rules
 *  5. Backend normalization and validation
 */
export async function POST(req) {
  try {
    const session = await auth();
    // Allow unauthenticated requests for demo/try mode — the pipeline
    // works without a storeId (similarity search uses global dataset only).

    const { imageUrl, imageUrls, storeId } = await req.json();

    // Support both single imageUrl (legacy) and imageUrls array (multi-image)
    let validatedUrls = [];

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const url of imageUrls) {
        if (typeof url !== "string") continue;
        try {
          const parsed = new URL(url);
          if (["http:", "https:"].includes(parsed.protocol)) {
            validatedUrls.push(url);
          }
        } catch {
          // skip invalid URLs
        }
      }
    } else if (imageUrl && typeof imageUrl === "string") {
      try {
        const parsed = new URL(imageUrl);
        if (["http:", "https:"].includes(parsed.protocol)) {
          validatedUrls.push(imageUrl);
        }
      } catch {
        // invalid
      }
    }

    if (validatedUrls.length === 0) {
      return NextResponse.json(
        { errorMessage: "No valid image URL provided" },
        { status: 400 }
      );
    }

    // Cap at 4 images to control API cost
    validatedUrls = validatedUrls.slice(0, 4);

    await dbConnect();

    // Fetch active fabric options for the prompt
    const fabrics = await FabricOption.find({ active: true }).sort({ name: 1 });
    const fabricNames = fabrics.map((f) => f.name);

    // ─── Step 1 & 2: Vision extraction call (multi-image) ───
    // Build image content blocks for all uploaded images
    const imageContentBlocks = validatedUrls.map((url, i) => ({
      type: "image_url",
      image_url: { url },
    }));

    const multiImageNote =
      validatedUrls.length > 1
        ? `\nYou are given ${validatedUrls.length} images of the SAME product from different angles.
          Combine information from ALL images:
          - Use front/main image for color, style, and title
          - Use label/tag images for brand, size, and fabric if visible
          - Use detail/close-up images for condition assessment
          - If images show conflicting info, prefer what is most clearly visible`
        : "";

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a fashion resale product analyst for REe, a secondhand fashion platform.
          Analyze the product image(s) and extract structured information.
          ${multiImageNote}
          Categories available: ${JSON.stringify(CATEGORIES)}
          Subcategories by category: ${JSON.stringify(SUBCATEGORIES)}
          Allowed fabrics from store: ${JSON.stringify(fabricNames)}
          Standard fabrics: ${JSON.stringify(NORMALIZED_FABRICS)}
          Condition grades: A = like new, B = good with minor wear, C = fair with visible wear

          Rules:
          - Pick the BEST matching category and subcategory from the provided lists
          - Fabric: pick from the store fabric list first, then standard fabrics
          - Color: analyze the dominant color visually and return both a descriptive name and its exact hex code
            - Return { "name": "navy", "hex": "#1B2A6B" } for a single dominant color
            - If multiple distinct colors or patterns exist, return { "name": "multicolor", "hex": "#FFFFFF" }
            - Be specific — prefer "cream" over "white", "burgundy" over "red", "olive" over "green" where accurate
          - Size: extract from labels if visible, otherwise estimate; use format S/M/L/XL or EU/IT/US sizes
          - Condition: assess from visible wear, stains, pilling, damage in the image
          - Tags: include product type, gender (men/women/unisex), color, style (casual/formal/vintage)
          - confidence_score: rate 0-1 based on image clarity and label visibility. Multiple clear images should increase confidence.
          - Description: write a short (1-2 sentence) resale-ready product description
          - Do NOT invent brands — if no brand visible, use "Unbranded"`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: validatedUrls.length > 1
                ? `Analyze these ${validatedUrls.length} images of the same fashion product for resale listing. Combine details from all angles.`
                : "Analyze this fashion product image for resale listing.",
            },
            ...imageContentBlocks,
          ],
        },
      ],
      response_format: PRODUCT_RESPONSE_SCHEMA,
      temperature: 0.2,
      max_tokens: 800,
    });

    let visionResult;
    try {
      visionResult = JSON.parse(
        visionResponse.choices[0]?.message?.content?.trim()
      );
    } catch {
      return NextResponse.json(
        { errorMessage: "Failed to parse vision response" },
        { status: 500 }
      );
    }

    // ─── Step 3: Similarity search in approved products ───
    let similarExamples = [];
    try {
      const queryText = buildEmbeddingText({
        title: visionResult.title,
        brand: visionResult.brand,
        category: visionResult.category,
        subcategory: visionResult.subcategory,
        color: visionResult.color,
        fabric: visionResult.fabric,
        description: visionResult.description,
        condition_notes: visionResult.condition_notes,
      });

      similarExamples = await retrieveSimilarProducts(
        queryText,
        storeId,
        visionResult.category,
        5
      );
    } catch (err) {
      // Similarity search is non-blocking — log and continue
      console.error("Similarity search failed (non-blocking):", err.message);
    }

    // ─── Step 4: Second AI generation with examples (if available) ───
    let finalAiResult = visionResult;

    if (similarExamples.length > 0) {
      const examplesText = similarExamples
        .map((ex, i) => {
          const p = ex.product;
          return `Example ${i + 1}${ex.sameStore ? " (same store)" : ""}:
  Title: ${p.title}
  Brand: ${p.brand}
  Category: ${p.category} > ${p.subcategory}
  Color: ${Array.isArray(p.color) ? p.color.join(", ") : p.color}
  Fabric: ${Array.isArray(p.fabric) ? p.fabric.join(", ") : p.fabric}
  Condition: ${p.condition_grade} — ${p.condition_notes || "none"}
  Tags: ${p.shopify_tags?.join(", ") || "none"}`;
        })
        .join("\n\n");

      const refinementResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are refining a product listing for REe, a secondhand fashion platform.
You have an initial analysis and similar approved listings from the store.
Use the examples to align your output with the store's style and conventions.

INITIAL ANALYSIS:
${JSON.stringify(visionResult, null, 2)}

SIMILAR APPROVED LISTINGS:
${examplesText}

Rules:
- Keep the same schema structure
- Align title style, tag conventions, and description tone with the examples
- If examples use specific brand casing or tag patterns, follow them
- Do not change factual information (color, size) unless the examples clearly show a pattern
- Maintain or improve the confidence score based on example alignment

Categories: ${JSON.stringify(CATEGORIES)}
Condition grades: A/B/C`,
          },
          {
            role: "user",
            content:
              "Refine the product listing based on the similar approved examples. Return the full product object.",
          },
        ],
        response_format: PRODUCT_RESPONSE_SCHEMA,
        temperature: 0.15,
        max_tokens: 600,
      });

      try {
        finalAiResult = JSON.parse(
          refinementResponse.choices[0]?.message?.content?.trim()
        );
      } catch {
        // If refinement fails, keep the original vision result
        console.error("Refinement parse failed, using vision result");
      }
    }

    // ─── Step 5: Backend normalization and validation ───
    const normalized = normalizeProductResponse(finalAiResult);

    return NextResponse.json(
      {
        message: "Product analyzed successfully",
        // Final normalized result
        ...normalized,
        // Metadata for the frontend
        _meta: {
          similarExamplesUsed: similarExamples.length,
          refinedWithExamples: similarExamples.length > 0,
          imagesAnalyzed: validatedUrls.length,
          rawAiOutput: visionResult,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI analyze-product error:", error);
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 }
    );
  }
}
