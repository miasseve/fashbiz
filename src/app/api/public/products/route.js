import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";
import crypto from "crypto";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { serializePublicProduct } from "@/lib/publicProductSerializer";
import { getActiveReservationsByProduct } from "@/lib/reservationLib";

export async function OPTIONS() {
  return handlePreflight();
}

// Discover's real product catalogue — everything a store has actually
// listed (not archived, not stuck pending review). This is what Home /
// Discover map / Finds browse; it replaced a hardcoded seed array on
// Discover's side that had no connection to real Ree data at all.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const filter = { archived: { $ne: true }, needsReview: { $ne: true } };
    if (storeId) filter.userId = storeId;

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(200);
    const reservations = await getActiveReservationsByProduct(products.map((p) => p._id));

    const out = products.map((p) => serializePublicProduct(p, reservations.get(String(p._id))));

    return Response.json({ ok: true, products: out });
  } catch (error) {
    console.error("Public products list error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
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
