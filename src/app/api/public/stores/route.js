import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { normalizeName } from "@/lib/storeMatching";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
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
