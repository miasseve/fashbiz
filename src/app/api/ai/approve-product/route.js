import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import ApprovedProduct from "@/models/ApprovedProduct";
import { storeProductEmbedding } from "@/lib/embeddings";

/**
 * POST /api/ai/approve-product
 *
 * Save a merchant-approved listing as a gold example.
 * Computes per-field corrections and stores the embedding for future retrieval.
 *
 * Body:
 *   productId   - MongoDB ObjectId of the created Product
 *   storeId     - merchant's user ID
 *   imageUrl    - primary product image URL
 *   rawAiOutput - the raw AI response before any merchant edits
 *   approvedOutput - the final merchant-approved data
 */
export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { errorMessage: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, storeId, imageUrl, rawAiOutput, approvedOutput } = body;

    if (!productId || !storeId || !rawAiOutput || !approvedOutput) {
      return NextResponse.json(
        { errorMessage: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // ── Compute per-field corrections ──
    const corrections = [];
    const fieldsToCompare = [
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
    ];

    for (const field of fieldsToCompare) {
      const original = rawAiOutput[field];
      const corrected = approvedOutput[field];

      // Deep compare for arrays
      const origStr = JSON.stringify(original);
      const corrStr = JSON.stringify(corrected);

      if (origStr !== corrStr) {
        corrections.push({
          field,
          original_value: original,
          corrected_value: corrected,
        });
      }
    }

    // ── Save the approved product ──
    const approved = await ApprovedProduct.create({
      productId,
      storeId,
      category: approvedOutput.category || "",
      subcategory: approvedOutput.subcategory || "",
      imageUrl: imageUrl || "",
      rawAiOutput,
      approvedOutput: {
        title: approvedOutput.title,
        brand: approvedOutput.brand,
        size: approvedOutput.size,
        category: approvedOutput.category,
        subcategory: approvedOutput.subcategory,
        color: approvedOutput.color
          ? (Array.isArray(approvedOutput.color)
              ? approvedOutput.color
              : [approvedOutput.color].filter(Boolean))
          : [],
        fabric: approvedOutput.fabric
          ? (Array.isArray(approvedOutput.fabric)
              ? approvedOutput.fabric
              : [approvedOutput.fabric].filter(Boolean))
          : [],
        description: approvedOutput.description,
        condition_grade: approvedOutput.condition_grade || null,
        condition_notes: approvedOutput.condition_notes || "",
        shopify_tags: approvedOutput.shopify_tags || [],
        value_score: approvedOutput.value_score || 0,
      },
      corrections,
      confidenceScore: rawAiOutput.confidence_score || 0,
    });

    // ── Generate and store embedding for similarity search ──
    try {
      await storeProductEmbedding(approved._id, approvedOutput);
    } catch (embErr) {
      // Non-blocking: embedding can be regenerated later
      console.error("Embedding generation failed (non-blocking):", embErr.message);
    }

    return NextResponse.json(
      {
        message: "Product approved and saved as gold example",
        approvedProductId: approved._id,
        correctionsCount: corrections.length,
        corrections,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve product error:", error);
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/approve-product?storeId=xxx
 *
 * Retrieve correction statistics for a store
 */
export async function GET(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { errorMessage: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { errorMessage: "storeId required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const totalApproved = await ApprovedProduct.countDocuments({ storeId });
    const withCorrections = await ApprovedProduct.countDocuments({
      storeId,
      "corrections.0": { $exists: true },
    });

    // Get most commonly corrected fields
    const pipeline = [
      { $match: { storeId: storeId } },
      { $unwind: "$corrections" },
      {
        $group: {
          _id: "$corrections.field",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];

    const correctionStats = await ApprovedProduct.aggregate(pipeline);

    return NextResponse.json(
      {
        totalApproved,
        withCorrections,
        correctionRate:
          totalApproved > 0
            ? ((withCorrections / totalApproved) * 100).toFixed(1)
            : 0,
        topCorrectedFields: correctionStats.map((s) => ({
          field: s._id,
          count: s.count,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get approval stats error:", error);
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 }
    );
  }
}
