import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { normalizeName } from "@/lib/storeMatching";

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
 * Same duplicate-detection rules as the CSV bulk importer (name and CVR),
 * checked here too so this doesn't become a second way to accidentally
 * create the exact kind of duplicate that prompted building this in the
 * first place.
 */
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();

    const storename = String(body.storename || "").trim();
    const country = String(body.country || "").trim().toUpperCase();
    if (!storename) return json({ error: "Store name is required" }, 400);
    if (!country) return json({ error: "Country is required" }, 400);
    if (!ALLOWED_COUNTRIES.includes(country)) {
      return json({ error: `Country must be one of: ${ALLOWED_COUNTRIES.join(", ")}` }, 400);
    }

    const businessNumber = String(body.businessNumber || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zipcode = String(body.zipcode || "").trim();
    const phone = String(body.phone || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const loginEmail = String(body.email || "").trim();

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

    await dbConnect();

    // Duplicate check — the exact problem this feature exists to prevent.
    const normalizedName = normalizeName(storename);
    const existing = await User.find({ role: "store" }).select("storename businessNumber").lean();
    const nameMatch = existing.find((s) => normalizeName(s.storename) === normalizedName);
    if (nameMatch) {
      return json(
        { error: `A store named "${nameMatch.storename}" already exists. Edit that one instead of creating a duplicate.` },
        409,
      );
    }
    if (businessNumber) {
      const cvrMatch = existing.find((s) => s.businessNumber === businessNumber);
      if (cvrMatch) {
        return json(
          { error: `CVR ${businessNumber} is already registered to "${cvrMatch.storename}". Edit that one instead of creating a duplicate.` },
          409,
        );
      }
    }

    // A real login email needs a real, chosen password to go with it (same
    // as signup — email and password always arrive together there). Left
    // blank, the store stays an unclaimed stub, same as a bulk-import row or
    // a self-submitted "Add a boutique" entry — nobody can log into it until
    // it's edited with real credentials later.
    let email, password;
    if (loginEmail) {
      const emailTaken = await User.findOne({ email: loginEmail.toLowerCase() }).select("_id").lean();
      if (emailTaken) return json({ error: "That email is already in use" }, 409);

      const passwordError = validatePassword(body.password || "");
      if (passwordError) return json({ error: passwordError }, 400);

      email = loginEmail;
      password = await bcrypt.hash(body.password, 10);
    } else {
      email = `unverified-${crypto.randomUUID()}@ree-unclaimed.internal`;
      password = await bcrypt.hash(crypto.randomUUID(), 10);
    }

    const doc = new User({
      firstname: body.firstname?.trim() || storename,
      lastname: body.lastname?.trim() || "Store",
      storename,
      email,
      password,
      role: "store",
      country,
      city: city || undefined,
      state: state || undefined,
      zipcode: zipcode || undefined,
      address: address || undefined,
      phone: phone || undefined,
      contactEmail: contactEmail || undefined,
      businessNumber: businessNumber || undefined,
      latitude,
      longitude,
      // An admin deliberately adding a store from real, known-good info is
      // exactly what verification means to signal — defaults on, but still
      // an explicit choice (checkbox), not forced.
      isVerified: body.isVerified !== false,
      isActive: false,
    });

    await doc.save();

    return json({ ok: true, storeId: String(doc._id) }, 201);
  } catch (error) {
    console.error("Admin add store error:", error);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}
