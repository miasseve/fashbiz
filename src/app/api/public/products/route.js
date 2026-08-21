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
//
// A product also only shows once its OWNING STORE is verified — same rule
// as the public stores feed. A store that isn't approved yet stays fully
// invisible, products included, rather than the store being hidden while
// its items still leak into search/Home independently.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const filter = { archived: { $ne: true }, needsReview: { $ne: true } };
    if (storeId) {
      const store = await User.findOne({ _id: storeId, role: "store", isVerified: true }).select("_id");
      if (!store) {
        return Response.json({ ok: true, products: [] });
      }
      filter.userId = storeId;
    } else {
      const verifiedStores = await User.find({ role: "store", isVerified: true }).select("_id").lean();
      filter.userId = { $in: verifiedStores.map((s) => s._id) };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(200);
    const reservations = await getActiveReservationsByProduct(products.map((p) => p._id));

    const out = products.map((p) => serializePublicProduct(p, reservations.get(String(p._id))));

    return Response.json({ ok: true, products: out });
  } catch (error) {
    console.error("Public products list error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// A Discover user capturing a "Find" — the title/brand/category come from
// Ree's real product-recognition AI now (see /api/public/products/analyze,
// same pipeline the dashboard's "add product" uses), so the data itself is
// trustworthy. When the capture names a real store (storeId), it's visible
// immediately. Without one, it falls back to an arbitrary store and stays
// archived/hidden — attaching a real customer's product to the wrong shop
// would be worse than just not showing it.
//
// needsReview (low AI confidence) used to hold a capture back for manual
// approval — removed per client request, everything a shopper adds should
// show up right away. aiConfidenceScore is still recorded either way.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    await dbConnect();

    let store = null;
    const hasRealStore = !!body.storeId;
    if (hasRealStore) {
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

    // Accepts either raw data URLs (uploads them now) or already-hosted
    // {url, publicId} pairs from a prior /analyze call, so a capture that
    // went through AI analysis first doesn't upload the same photos twice.
    const rawImages = Array.isArray(body.images) ? body.images.slice(0, 6) : [];
    const images = [];
    for (const img of rawImages) {
      if (typeof img === "string" && img.startsWith("data:")) {
        const uploaded = await cloudinary.v2.uploader.upload(img, { folder: "nm-demo", format: "webp" });
        images.push({ url: uploaded.secure_url, publicId: uploaded.public_id });
      } else if (img && typeof img === "object" && typeof img.url === "string") {
        images.push({ url: img.url, publicId: img.publicId || "" });
      }
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
      subcategory: String(body.subcategory || "").trim() || undefined,
      description: String(body.description || "").trim() || "Submitted via Discover.",
      price,
      size: [String(body.size || "One Size")],
      fabric: body.material ? String(body.material) : undefined,
      condition_grade: ["A", "B", "C"].includes(body.conditionGrade) ? body.conditionGrade : null,
      condition_notes: body.condition ? String(body.condition) : "",
      color: body.colorName ? { name: String(body.colorName), hex: body.colorHex || "#fff" } : undefined,
      images,
      userId: store._id,
      consignorAccount: "discover-app",
      aiConfidenceScore,
      // Low-confidence captures used to be held back pending manual review;
      // client asked for everything a shopper adds to show up immediately
      // instead. Still recorded (aiConfidenceScore above) if review ever
      // comes back.
      needsReview: false,
      archived: !hasRealStore,
    });

    await doc.save();

    return Response.json(
      {
        ok: true,
        status: hasRealStore ? "live" : "pending_store_match",
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
