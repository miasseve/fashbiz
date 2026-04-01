import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

/**
 * GET /api/ai/review-queue
 * Returns products that need manual review (low AI confidence).
 * Query params:
 *   - page (default 1)
 *   - limit (default 20)
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

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const filter = {
      userId: session.user.id,
      needsReview: true,
      archived: { $ne: true },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Review queue error:", error);
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/review-queue
 * Mark a product as reviewed (clears needsReview flag).
 * Body: { productId }
 */
export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { errorMessage: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { errorMessage: "productId is required" },
        { status: 400 }
      );
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, userId: session.user.id },
      { $set: { needsReview: false } },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { errorMessage: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Product marked as reviewed", product });
  } catch (error) {
    console.error("Review queue PATCH error:", error);
    return NextResponse.json(
      { errorMessage: error.message },
      { status: 500 }
    );
  }
}
