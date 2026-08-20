import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// Straight from libphonenumber-js itself, not react-phone-number-input —
// that package's entry points all re-export its React <PhoneInput/>
// component too (even the "/core" one), which broke the build when pulled
// into a server-only API route ("Super expression must either be null or a
// function"). isValidPhoneNumber from libphonenumber-js/core has no such
// baggage, but needs metadata passed explicitly - it isn't bundled in like
// the default/min builds are.
import { isValidPhoneNumber } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/min/metadata";
import { normalizeName, makeUnclaimedEmail } from "@/lib/storeMatching";

// Same 8 countries the real store signup form offers — keeping this list to
// exactly what StoreForm.jsx supports (src/app/(auth)/register/StoreForm.jsx)
// instead of free text, since anything outside it isn't a real option
// elsewhere in the app either.
const ALLOWED_COUNTRIES = ["DK", "FR", "DE", "IT", "ES", "NL", "SE", "NO"];

// Mirrors validatePassword in src/app/(auth)/validation/validation.js exactly
// - an admin-created account should be held to the same bar as a real signup,
// since it's meant to actually be logged into.
function validatePassword(value) {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters long";
  if (!/\d/.test(value)) return "Password must contain a digit";
  if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter";
  if (!/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value)) return "Password must contain a special character";
  if (value.length > 50) return "Password can be at most 50 characters";
  return null;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return null;
  }
  return session;
}

/**
 * POST /api/admin/stores — manually add a single real store from admin.
 *
 * Name, country and CVR are the only truly required fields — an admin
 * adding a store one at a time often doesn't have the owner's phone/email
 * on hand. Leaving email blank creates an unclaimed listing (same stub
 * pattern as the CSV importer and the app's "add a boutique" flow): visible
 * everywhere a normal store is, but with no working login until the real
 * owner signs up for real, at which point registerUser() claims this exact
 * record in place instead of creating a duplicate — see authActions.js.
 * Providing a real email still creates an immediately-usable account, same
 * as before.
 *
 * Same duplicate-detection rules as the CSV bulk importer (name and CVR),
 * checked here too so this doesn't become a second way to accidentally
 * create the exact kind of duplicate that prompted building this in the
 * first place.
 *
 * Address and a photo are optional but both matter for a store to actually
 * be usable the moment it's created: no address/coordinates means it stays
 * off the map/search page (same rule as everywhere else — see
 * publicStoreSerializer.js) until edited in later, and with no photo it just
 * falls back to a generic icon.
 */
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();

    // Owner's name is often unknown when adding a store one at a time (same
    // reason the CSV bulk importer defaults to this) — not required.
    const firstname = String(body.firstname || "").trim() || "Unclaimed";
    const lastname = String(body.lastname || "").trim() || "Store";
    const storename = String(body.storename || "").trim();
    const country = String(body.country || "").trim().toUpperCase();
    const businessNumber = String(body.businessNumber || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // Address is optional but strongly encouraged — without it (and
    // coordinates), a store stays off the map/search page even once
    // verified, same rule as everywhere else in the app. Not required here
    // since some stores get their address filled in later.
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zipcode = String(body.zipcode || "").trim();
    let latitude, longitude;
    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== "") {
      const lat = Number(body.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) return json({ error: "Invalid latitude" }, 400);
      latitude = lat;
    }
    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== "") {
      const lng = Number(body.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) return json({ error: "Invalid longitude" }, 400);
      longitude = lng;
    }

    // Storefront photo, already uploaded via /api/upload by the time this
    // request is made — same Cloudinary flow the store's own dashboard
    // Branding tab uses. Optional.
    const logoUrl = String(body.logoUrl || "").trim();
    const logoPublicId = String(body.logoPublicId || "").trim();

    if (!storename) return json({ error: "Store Name is required" }, 400);
    if (!country) return json({ error: "Country is required" }, 400);
    if (!ALLOWED_COUNTRIES.includes(country)) {
      return json({ error: `Country must be one of: ${ALLOWED_COUNTRIES.join(", ")}` }, 400);
    }
    if (!businessNumber) return json({ error: "Business Registration Number is required" }, 400);
    // Phone is optional — only validated if actually provided.
    if (phone && !isValidPhoneNumber(phone, metadata)) return json({ error: "Phone number is not valid" }, 400);

    // Email is optional too — no email means no real login is possible, so
    // password is irrelevant and skipped entirely rather than validated.
    let finalEmail, finalPassword;
    if (email) {
      const passwordError = validatePassword(password);
      if (passwordError) return json({ error: passwordError }, 400);
      finalEmail = email;
      finalPassword = await bcrypt.hash(password, 10);
    } else {
      finalEmail = makeUnclaimedEmail();
      finalPassword = await bcrypt.hash(crypto.randomUUID(), 10);
    }

    await dbConnect();

    // Duplicate check — the exact problem this feature exists to prevent.
    const existing = await User.find({ role: "store" }).select("storename businessNumber").lean();
    const normalizedName = normalizeName(storename);
    const nameMatch = existing.find((s) => normalizeName(s.storename) === normalizedName);
    if (nameMatch) {
      return json(
        { error: `A store named "${nameMatch.storename}" already exists. Edit that one instead of creating a duplicate.` },
        409,
      );
    }
    const cvrMatch = existing.find((s) => s.businessNumber === businessNumber);
    if (cvrMatch) {
      return json(
        { error: `CVR ${businessNumber} is already registered to "${cvrMatch.storename}". Edit that one instead of creating a duplicate.` },
        409,
      );
    }

    if (email) {
      const emailTaken = await User.findOne({ email }).select("_id").lean();
      if (emailTaken) return json({ error: "That email is already in use" }, 409);
    }

    const doc = new User({
      firstname,
      lastname,
      storename,
      email: finalEmail,
      password: finalPassword,
      role: "store",
      country,
      businessNumber,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zipcode: zipcode || undefined,
      latitude,
      longitude,
      ...(logoUrl && { branding: { logoUrl, logoPublicId } }),
      addedByAdmin: true,
      // An admin manually adding a store from real, known-good info is
      // exactly what verification means to signal — same as a real signup,
      // which also defaults to verified.
      isVerified: true,
      isActive: false,
    });

    await doc.save();

    return json({ ok: true, storeId: String(doc._id) }, 201);
  } catch (error) {
    console.error("Admin add store error:", error);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}
