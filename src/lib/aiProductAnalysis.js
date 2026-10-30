import OpenAI from "openai";
import dbConnect from "@/lib/db";
import FabricOption from "@/models/FabricOption";
import { normalizeProductResponse } from "@/lib/normalize";
import { CATEGORIES, SUBCATEGORIES, NORMALIZED_FABRICS } from "@/lib/taxonomy";
import { retrieveSimilarProducts, buildEmbeddingText } from "@/lib/embeddings";
import { getStoreCollectionsForUser } from "@/lib/storeCollections";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Required response schema for Structured Outputs ──
//
// Built fresh per request so the store's own collections can be injected as a
// closed enum. With no collections (guest, or a store with no connected
// Shopify) the result is byte-identical to the schema this was before the
// per-store work — no extra property, no extra `required` entry — so those
// callers are provably unchanged.
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
        price_tag_amount: {
          type: ["number", "null"],
          description:
            "The numeric price read directly off a visible physical price tag in the image, in the tag's own currency units (e.g. a tag reading '59 KR' → 59). Only set this when a price is clearly and unambiguously legible — null if no price tag is visible, or if it's blurry, handwritten and unclear, partially obscured, or otherwise not confidently readable. Never guess or estimate a price.",
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
        "price_tag_amount",
      ],
      additionalProperties: false,
    },
  },
};

// Prefix for the opaque per-request collection refs handed to the model.
const COLLECTION_REF_PREFIX = "c";

/**
 * Gives each of the store's collections a short, opaque ref (`c1`, `c2`, …) for
 * this request only.
 *
 * The model is never shown a title, handle or GID to return, because none of
 * them is safe to match on: handles contradict titles on real stores, and
 * titles are not unique either — one live store has two separate collections
 * both titled "Jakker". A ref maps back to exactly one GID, so an ambiguous
 * title can no longer resolve to the wrong collection.
 *
 * @param {Array} collections  from getStoreCollectionsForUser()
 * @returns {Map<string, object>} ref -> collection
 */
function buildCollectionRefMap(collections) {
  const map = new Map();
  collections.forEach((c, i) => {
    if (c?.id) map.set(`${COLLECTION_REF_PREFIX}${i + 1}`, c);
  });
  return map;
}

/**
 * The response schema for one request.
 *
 * @param {Map<string, object>} refMap  empty -> the unmodified base schema
 */
function buildProductResponseSchema(refMap) {
  if (!refMap || refMap.size === 0) return PRODUCT_RESPONSE_SCHEMA;

  const base = PRODUCT_RESPONSE_SCHEMA.json_schema.schema;
  const refs = [...refMap.keys()];

  return {
    ...PRODUCT_RESPONSE_SCHEMA,
    json_schema: {
      ...PRODUCT_RESPONSE_SCHEMA.json_schema,
      schema: {
        ...base,
        properties: {
          ...base.properties,
          store_collection_ref: {
            // Nullable on purpose: declining is better than a forced wrong pick.
            type: ["string", "null"],
            enum: [...refs, null],
            description:
              "The ref of the ONE store collection this garment belongs in, chosen by garment type only, or null if none fits.",
          },
        },
        required: [...base.required, "store_collection_ref"],
      },
    },
  };
}

/**
 * The collection list shown to the model.
 *
 * Both title and handle are included because the title alone can be ambiguous
 * (two collections titled "Jakker" differ only by handle), and a human reading
 * the same list in the form has the same problem.
 */
function buildCollectionPromptBlock(refMap) {
  if (refMap.size === 0) return "";

  const lines = [...refMap.entries()]
    .map(([ref, c]) => `  ${ref} = "${c.title}" (${c.handle})`)
    .join("\n");

  return `
        This store's own collections — pick the ONE that matches the garment, using store_collection_ref:
${lines}

        Rules for store_collection_ref:
        - Choose on the GARMENT TYPE you can actually see (a jacket goes in the jackets collection).
        - Do NOT choose a collection named after a BRAND, even if you can read that brand on the
          label — brand placement is decided separately from the brand field, not from the image.
        - Do NOT choose a collection that describes a market segment, gender, price tier, or a
          curated/seasonal grouping ("new in", "all products", "our favourites", "sale").
        - Two collections may share a title and differ only by handle. If you cannot tell which is
          meant, return null rather than guessing.
        - Return null if no collection matches the garment type. Null is always better than a
          wrong collection.`;
}

/**
 * Turns the model's ref back into a real collection, or null.
 *
 * Two deterministic rejections, both store-agnostic — they classify nothing
 * about a particular shop, they only drop answers another layer owns or that
 * cannot be trusted:
 *
 *  1. An unknown ref (the enum should prevent it, but never trust a model's
 *     output as a lookup key).
 *  2. A collection whose title is the product's own brand. On a store with
 *     dozens of brand collections these are the most tempting wrong answer —
 *     the label is legible right there in the photo — and brand placement is
 *     decided deterministically from the brand field, not from the image. So
 *     a brand-shaped pick is dropped rather than acted on.
 *
 * @param {string|null} ref
 * @param {Map<string, object>} refMap
 * @param {string} brand  the normalized brand, used only for rejection 2
 */
function resolveStoreCollection(ref, refMap, brand) {
  if (!ref || refMap.size === 0) return null;

  const picked = refMap.get(ref);
  if (!picked) {
    console.warn(
      `[analyze-product] Model returned unknown store_collection_ref "${ref}" — ignoring.`
    );
    return null;
  }

  const title = (picked.title || "").trim().toLowerCase();
  const brandName = (brand || "").trim().toLowerCase();
  if (title && brandName && title === brandName) {
    console.warn(
      `[analyze-product] Rejected store_collection_ref "${ref}" ("${picked.title}") — ` +
        `it is the product's own brand collection, which is assigned from the brand ` +
        `field, not from the image.`
    );
    return null;
  }

  return {
    id: picked.id,
    title: picked.title,
    handle: picked.handle,
    // Snapshot for debugging only. Anything writing to Shopify must re-read
    // ruleSet live — a collection can be switched manual/automated at any time.
    isManual: picked.isManual,
  };
}

/**
 * Core vision-analysis pipeline shared by the dashboard's own
 * /api/ai/analyze-product route and the public Discover-facing endpoint —
 * same model, same prompt, same normalization, so results never drift
 * between the two callers.
 *
 *  1. Parallel: DB connect + fetch fabrics
 *  2. Vision extraction, then similar-product pre-fetch (if storeId given)
 *  3. Single-pass refinement only when needed (low confidence + examples available)
 *  4. Backend normalization and validation
 *
 * @param {string[]} imageUrls - 1-4 hosted (Cloudinary) image URLs
 * @param {string|undefined} storeId - optional; enables the similarity-refinement step
 * @param {{ ownerUserId?: string }} [options]
 *   ownerUserId — the store owner, taken from the SESSION by the caller, never
 *   from the request body. Enables the store's own collections as an extra
 *   `storeCollection` field. Omitted (guest, try-free, public endpoint) ->
 *   `storeCollection: null` and everything else behaves exactly as before.
 *
 *   It is deliberately separate from `storeId`, which arrives in the request
 *   body and is therefore caller-controlled; see SECURITY-ISSUES.md #1. A
 *   store's category structure must not be readable by passing someone
 *   else's id.
 */
export async function analyzeProductImages(imageUrls, storeId, options = {}) {
  const { ownerUserId } = options;
  let validatedUrls = [];
  for (const url of imageUrls) {
    if (typeof url !== "string") continue;
    try {
      const parsed = new URL(url);
      if (["http:", "https:"].includes(parsed.protocol)) validatedUrls.push(url);
    } catch {
      // skip invalid URLs
    }
  }

  if (validatedUrls.length === 0) {
    throw new Object.assign(new Error("No valid image URL provided"), { status: 400 });
  }

  // Cap at 4 images to control API cost
  validatedUrls = validatedUrls.slice(0, 4);

  await dbConnect();
  const fabrics = await FabricOption.find({ active: true }).sort({ name: 1 });
  const fabricNames = fabrics.map((f) => f.name);

  // The owner's own Shopify collections. Must NEVER break or block the upload:
  // a Shopify error, a timeout or a failed token decrypt all degrade to "no
  // collections", and analysis continues exactly as it does for a store with
  // none. getStoreCollectionsForUser already swallows its own failures and
  // returns [], and this try/catch is the belt to that braces.
  let storeCollections = [];
  if (ownerUserId) {
    try {
      storeCollections = await getStoreCollectionsForUser(ownerUserId);
    } catch (err) {
      console.error(
        `[analyze-product] Collection fetch threw for owner ${ownerUserId} — continuing with no store collection:`,
        err.message
      );
      storeCollections = [];
    }

    // Never fail silently: a connected store that yields nothing is either a
    // real problem (decrypt, scopes, Shopify down) or an empty shop, and both
    // are worth seeing. The upload still succeeds either way.
    if (storeCollections.length === 0) {
      console.warn(
        `[analyze-product] Owner ${ownerUserId} produced NO store collections — ` +
          `storeCollection will be null. Either no OAuth-connected Shopify, a token ` +
          `decrypt failure, or a Shopify fetch error. See the [shopify-collections] ` +
          `and [shopifyStoreResolver] logs above for the store domain and reason.`
      );
    }
  }

  const collectionRefMap = buildCollectionRefMap(storeCollections);
  const responseSchema = buildProductResponseSchema(collectionRefMap);

  const imageContentBlocks = validatedUrls.map((url) => ({
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
        - Do NOT invent brands — if no brand visible, use "Unbranded"
        - price_tag_amount: only set this if a physical price tag is visible AND its price is clearly, unambiguously legible. If there's no tag, or it's blurry/handwritten/obscured/uncertain in any way, return null — never guess a price
${buildCollectionPromptBlock(collectionRefMap)}`,
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
    response_format: responseSchema,
    temperature: 0.2,
    max_tokens: 800,
  });

  let visionResult;
  try {
    visionResult = JSON.parse(visionResponse.choices[0]?.message?.content?.trim());
  } catch {
    throw Object.assign(new Error("Failed to parse vision response"), { status: 500 });
  }

  let similarExamples = [];
  if (storeId) {
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

      similarExamples = await retrieveSimilarProducts(queryText, storeId, visionResult.category, 5);
    } catch (err) {
      console.error("Similarity search failed (non-blocking):", err.message);
    }
  }

  let finalAiResult = visionResult;
  const needsRefinement = similarExamples.length > 0 && visionResult.confidence_score < 0.85;

  // The refinement pass aligns WRITING STYLE against other approved listings.
  // Collection placement is a factual call about this garment, and another
  // product's style says nothing about it — so the refinement neither sees the
  // ref (stripped here) nor is allowed to return one (its schema is the base
  // PRODUCT_RESPONSE_SCHEMA, which has no such property). The vision pass's
  // answer is carried forward verbatim below.
  const { store_collection_ref: visionCollectionRef = null, ...visionForRefinement } =
    visionResult;

  if (needsRefinement) {
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

    try {
      const refinementResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are refining a product listing for REe, a secondhand fashion platform.
You have an initial analysis and similar approved listings from the store.
Use the examples to align your output with the store's style and conventions.

INITIAL ANALYSIS:
${JSON.stringify(visionForRefinement, null, 2)}

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
            content: "Refine the product listing based on the similar approved examples. Return the full product object.",
          },
        ],
        response_format: PRODUCT_RESPONSE_SCHEMA,
        temperature: 0.15,
        max_tokens: 600,
      });

      finalAiResult = JSON.parse(refinementResponse.choices[0]?.message?.content?.trim());
    } catch {
      console.error("Refinement parse failed, using vision result");
    }
  }

  const normalized = normalizeProductResponse(finalAiResult);

  // Resolve the ref to a real collection. Done here, not in normalize.js —
  // that module is the taxonomy-snapping layer and deliberately knows nothing
  // about per-store data.
  const storeCollection = resolveStoreCollection(
    visionCollectionRef,
    collectionRefMap,
    normalized.brand
  );

  return {
    ...normalized,
    storeCollection,
    // The same list the model was shown, trimmed, so the form can offer it as
    // a correctable dropdown. The handle goes with the title because a title
    // alone can be ambiguous — two collections may read "Jakker" and differ
    // only by handle, which a human can't disambiguate either.
    // Empty for a guest or a store with no connected Shopify.
    storeCollectionOptions: [...collectionRefMap.values()].map((c) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      isManual: c.isManual,
    })),
    _meta: {
      similarExamplesUsed: similarExamples.length,
      refinedWithExamples: needsRefinement,
      imagesAnalyzed: validatedUrls.length,
      rawAiOutput: visionResult,
    },
  };
}
