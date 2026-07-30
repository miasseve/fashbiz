import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Loose match: ignore case, punctuation and extra whitespace so
// "H&M" / "H & M." / "h and m " are treated as the same store name.
function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows : null;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No rows provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (rows.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Max 1000 rows per upload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await dbConnect();

    // Existing stores, loaded once so every row (and rows against each other)
    // can be matched without a query per row.
    const existingStores = await User.find({ role: "store" })
      .select("storename businessNumber")
      .lean();

    const byBusinessNumber = new Map();
    const byName = new Map();
    for (const s of existingStores) {
      if (s.businessNumber) byBusinessNumber.set(s.businessNumber.trim(), s);
      if (s.storename) byName.set(normalizeName(s.storename), s);
    }

    const created = [];
    const updated = [];
    const errors = [];
    const placeholderPassword = await bcrypt.hash(crypto.randomUUID(), 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // account for the CSV header row
      const storename = String(row.storename || row.name || "").trim();
      const country = String(row.country || "").trim();

      if (!storename) {
        errors.push({ row: rowNum, reason: "Missing store name" });
        continue;
      }
      if (!country) {
        errors.push({ row: rowNum, reason: "Missing country" });
        continue;
      }

      const businessNumber = String(row.businessNumber || row.cvr || "").trim();
      const normalizedName = normalizeName(storename);

      // Name first (per Mia's request), CVR as fallback. Note: matching by
      // name carries more risk of merging two unrelated stores that happen
      // to share a name than CVR would, since CVR is a unique government
      // number and names aren't guaranteed unique.
      const matchByName = byName.get(normalizedName);
      const matchByCvr = !matchByName && businessNumber
        ? byBusinessNumber.get(businessNumber)
        : null;
      const match = matchByName || matchByCvr;

      let latitude, longitude;
      if (row.latitude !== undefined && row.latitude !== "" && row.latitude !== null) {
        const lat = Number(row.latitude);
        if (!Number.isNaN(lat) && lat >= -90 && lat <= 90) latitude = lat;
      }
      if (row.longitude !== undefined && row.longitude !== "" && row.longitude !== null) {
        const lng = Number(row.longitude);
        if (!Number.isNaN(lng) && lng >= -180 && lng <= 180) longitude = lng;
      }

      if (match) {
        // Only overwrite fields the row actually provides — a blank CSV
        // cell should never erase existing good data.
        const update = {};
        if (String(row.address || "").trim()) update.address = String(row.address).trim();
        if (String(row.city || "").trim()) update.city = String(row.city).trim();
        if (String(row.state || "").trim()) update.state = String(row.state).trim();
        if (String(row.zipcode || "").trim()) update.zipcode = String(row.zipcode).trim();
        if (country) update.country = country;
        if (businessNumber) update.businessNumber = businessNumber;
        if (latitude !== undefined) update.latitude = latitude;
        if (longitude !== undefined) update.longitude = longitude;

        try {
          await User.findByIdAndUpdate(match._id, update, { runValidators: true });
          updated.push({
            row: rowNum,
            storename,
            matchedField: matchByName ? "storename" : "businessNumber",
            existingStoreId: String(match._id),
          });
          if (businessNumber) byBusinessNumber.set(businessNumber, match);
        } catch (err) {
          errors.push({ row: rowNum, reason: err.message });
        }
        continue;
      }

      const placeholderEmail = `unverified-${crypto.randomUUID()}@ree-unclaimed.internal`;

      const doc = new User({
        firstname: "",
        lastname: "",
        storename,
        email: placeholderEmail,
        password: placeholderPassword,
        role: "store",
        country,
        city: String(row.city || "").trim(),
        state: String(row.state || "").trim(),
        zipcode: String(row.zipcode || "").trim(),
        address: String(row.address || "").trim(),
        businessNumber: businessNumber || undefined,
        latitude,
        longitude,
        isVerified: false,
        isActive: false,
      });

      try {
        await doc.save();
        created.push({ row: rowNum, storename, userId: String(doc._id) });
        // Register it immediately so a later row in the same file matches
        // against it too, not just against pre-existing data.
        if (businessNumber) byBusinessNumber.set(businessNumber, doc);
        byName.set(normalizedName, doc);
      } catch (err) {
        errors.push({ row: rowNum, reason: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        createdCount: created.length,
        updatedCount: updated.length,
        errorCount: errors.length,
        created,
        updated,
        errors,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk store import error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
