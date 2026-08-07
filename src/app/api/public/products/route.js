import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";
import crypto from "crypto";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

// A Discover user capturing a "Find" — REE's AI recognition isn't wired up
// yet, so whatever title/brand/category/price the caller sends is unverified.
// Every product created here is saved hidden (archived + needsReview) so it
// never appears in listings or syncs to Shopify until a human reviews it,
// same as any other product a store can already un-archive from their
// dashboard once the real details are confirmed.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    await dbConnect();

    let store = null;
    if (body.storeId) {
      store = await User.findOne({ _id: body.storeId, role: "store" });
      if (!store) {
        return Response.json({ error: "Store not found" }, { status: 400 });
      }
    } else {
      store = process.env.TEST_STORE_USER_ID
        ? await User.findById(process.env.TEST_STORE_USER_ID)
        : await User.findOne({ role: "store" });
      if (!store) {
        return Response.json({ error: "No store available to attach this product to" }, { status: 500 });
      }
    }

    const rawImages = Array.isArray(body.images) ? body.images.slice(0, 6) : [];
    const images = [];
    for (const dataUrl of rawImages) {
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) continue;
      const uploaded = await cloudinary.v2.uploader.upload(dataUrl, {
        folder: "nm-demo",
        format: "webp",
      });
      images.push({ url: uploaded.secure_url, publicId: uploaded.public_id });
    }

    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

    let price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) price = 0;

    let aiConfidenceScore = Number(body.aiConfidence);
    if (!Number.isFinite(aiConfidenceScore)) aiConfidenceScore = null;

    const doc = new Product({
      sku: `DISC-${suffix}`,
      barcode: `DISC-BC-${suffix}`,
      title: String(body.title || "").trim() || "Untitled item (via Discover)",
      brand: String(body.brand || "").trim() || "Unknown",
      category: String(body.category || "").trim() || "Uncategorized",
      description: String(body.description || "").trim() || "Submitted via Discover — pending review.",
      price,
      size: [String(body.size || "One Size")],
      fabric: body.material ? String(body.material) : undefined,
      condition_notes: body.condition ? String(body.condition) : "",
      images,
      userId: store._id,
      consignorAccount: "discover-app",
      aiConfidenceScore,
      needsReview: true,
      archived: true,
    });

    await doc.save();

    return Response.json(
      {
        ok: true,
        status: "pending_review",
        productId: String(doc._id),
        images,
        createdAt: doc.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public create-product error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
