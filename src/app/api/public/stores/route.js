import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { normalizeName } from "@/lib/storeMatching";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { serializePublicStore, PUBLIC_STORE_FIELDS } from "@/lib/publicStoreSerializer";

export async function OPTIONS() {
  return handlePreflight();
}

// The real boutique directory — every known store, verified or not. The
// `verified` field on each entry tells the caller which ones are approved;
// filtering that down to a "map-visible" set is Discover's job (it also
// needs the FULL list, unverified included, to let a user attribute a
// capture to a brand-new not-yet-approved store) — see fetchStores() on
// that side. Nothing here is ever deleted for being unverified, just not
// shown on the public map until an admin ticks "Verified" in Ree admin.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    // Was capped at 500, sorted alphabetically — harmless when there were a
    // few hundred stores total, but once bulk imports pushed the real count
    // well past that, it silently truncated to an alphabetical slice of
    // store names with zero relation to geography (e.g. entire cities
    // missing from the map depending on how their names sorted). Raised
    // well above current + expected near-term volume; real pagination is
    // the correct long-term fix if this keeps growing into the tens of
    // thousands.
    const stores = await User.find({ role: "store" })
      .select(PUBLIC_STORE_FIELDS)
      .sort({ storename: 1 })
      .limit(5000)
      .lean();

    // One representative photo + a real count per store, computed directly
    // instead of Discover trying to derive it client-side from a capped
    // global product feed. That approach silently broke at scale: fetching
    // "all products" is capped (currently 200, platform-wide) to keep that
    // endpoint fast, so once total inventory grew past that, only whichever
    // stores happened to have the very newest listings ever showed a photo
    // on the map — every other store looked photo-less regardless of how
    // much real inventory it actually had. This aggregation has no such
    // cap: it's one pass over real (non-archived, non-sold, review-passed,
    // has-a-photo) products, grouped per store, so it stays correct no
    // matter how large the catalogue gets.
    const productAgg = await Product.aggregate([
      {
        $match: {
          archived: { $ne: true },
          needsReview: { $ne: true },
          sold: { $ne: true },
          images: { $exists: true, $not: { $size: 0 } },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          activeProductCount: { $sum: 1 },
          thumbnail: { $first: { $arrayElemAt: ["$images.url", 0] } },
        },
      },
    ]);
    const productInfoByStore = new Map(
      productAgg.map((p) => [String(p._id), { thumbnail: p.thumbnail || null, activeProductCount: p.activeProductCount }]),
    );

    return Response.json({
      ok: true,
      stores: stores.map((s) => ({
        ...serializePublicStore(s),
        ...(productInfoByStore.get(String(s._id)) || { thumbnail: null, activeProductCount: 0 }),
      })),
    });
  } catch (error) {
    console.error("Public stores list error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// A Discover user submitting "Add a boutique" — matches the real form's
// fields (name/address/city + optional geolocation lat/lng), same
// duplicate-check + unverified-stub pattern as the admin CSV importer, just
// entered one at a time instead of in bulk.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const storename = String(body.name || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "DK").trim();

    if (!storename) {
      return Response.json({ error: "Store name is required" }, { status: 400 });
    }

    let latitude, longitude;
    if (body.lat !== undefined && body.lat !== null && body.lat !== "") {
      const lat = Number(body.lat);
      if (!Number.isNaN(lat) && lat >= -90 && lat <= 90) latitude = lat;
    }
    if (body.lng !== undefined && body.lng !== null && body.lng !== "") {
      const lng = Number(body.lng);
      if (!Number.isNaN(lng) && lng >= -180 && lng <= 180) longitude = lng;
    }

    await dbConnect();

    const normalizedName = normalizeName(storename);
    const existing = await User.findOne({
      role: "store",
      storename: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    // Loose regex match above only catches exact-ish spelling; fall back to
    // comparing normalized names across all stores if that misses, same
    // rule the CSV importer uses.
    let match = existing;
    if (!match) {
      const candidates = await User.find({ role: "store" }).select("storename").lean();
      const hit = candidates.find((c) => normalizeName(c.storename) === normalizedName);
      if (hit) match = await User.findById(hit._id);
    }

    if (match) {
      return Response.json({
        ok: true,
        status: "already_exists",
        storeId: String(match._id),
      });
    }

    const placeholderEmail = `unverified-${crypto.randomUUID()}@ree-unclaimed.internal`;
    const placeholderPassword = await bcrypt.hash(crypto.randomUUID(), 10);
    // Schema requires businessNumber for role "store"; this form has no CVR field
    // (unlike the admin CSV importer), so stub one out until the real owner claims
    // the store and provides their actual CVR during verification.
    const placeholderBusinessNumber = `UNVERIFIED-${crypto.randomUUID()}`;

    const doc = new User({
      // Mongoose treats "" as "not provided" for a required String field, so an
      // empty string here fails validation just like omitting the field entirely.
      firstname: "Unclaimed",
      lastname: "Store",
      storename,
      email: placeholderEmail,
      password: placeholderPassword,
      role: "store",
      country,
      city,
      address,
      latitude,
      longitude,
      businessNumber: placeholderBusinessNumber,
      isVerified: false,
      isActive: false,
    });

    await doc.save();

    return Response.json(
      { ok: true, status: "pending_verification", storeId: String(doc._id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public add-store error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
