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
    let session = null;
    try {
      session = await auth();
    } catch {
      // Unauthenticated request — continue without session
    }

    const { imageUrl, imageUrls, storeId } = await req.json();
    const urls = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

    // `storeId` comes from the request body and is caller-controlled, so it is
    // NOT usable for reading a store's own data (SECURITY-ISSUES.md #1). It
    // keeps its existing meaning here — it drives the similarity search, and
    // changing that is a separate fix.
    //
    // The owner for the store-collection lookup is taken from the SESSION
    // only. No session -> no collections -> storeCollection: null, which is
    // exactly how guest and try-free uploads already behave.
    const ownerUserId = session?.user?.id;

    const result = await analyzeProductImages(urls, storeId, { ownerUserId });

    return NextResponse.json({ message: "Product analyzed successfully", ...result }, { status: 200 });
  } catch (error) {
    console.error("AI analyze-product error:", error);
    return NextResponse.json({ errorMessage: error.message }, { status: error.status || 500 });
  }
}
