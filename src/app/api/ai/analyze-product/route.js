import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { analyzeProductImages } from "@/lib/aiProductAnalysis";

/**
 * POST /api/ai/analyze-product
 * Thin route wrapper — the actual vision/normalization pipeline lives in
 * analyzeProductImages() so the public Discover-facing endpoint can reuse
 * the exact same logic without duplicating it.
 */
export async function POST(req) {
  try {
    // auth() is optional — demo/try mode works without a session.
    try {
      await auth();
    } catch {
      // Unauthenticated request — continue without session
    }

    const { imageUrl, imageUrls, storeId } = await req.json();
    const urls = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

    const result = await analyzeProductImages(urls, storeId);

    return NextResponse.json({ message: "Product analyzed successfully", ...result }, { status: 200 });
  } catch (error) {
    console.error("AI analyze-product error:", error);
    return NextResponse.json({ errorMessage: error.message }, { status: error.status || 500 });
  }
}
