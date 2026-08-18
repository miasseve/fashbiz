import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
// Straight from libphonenumber-js itself, not react-phone-number-input —
// that package's entry points all re-export its React <PhoneInput/>
// component too (even the "/core" one), which broke the build when pulled
// into a server-only API route ("Super expression must either be null or a
// function"). isValidPhoneNumber from libphonenumber-js/core has no such
// baggage, but needs metadata passed explicitly - it isn't bundled in like
// the default/min builds are.
import { isValidPhoneNumber } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/min/metadata";
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
 * Exactly the same required fields as the real store sign-up form
 * (src/app/(auth)/register/StoreForm.jsx) — an admin-created store is meant
 * to be a real, immediately-usable account, not a placeholder.
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

    if (!storename) return json({ error: "Store Name is required" }, 400);
    if (!country) return json({ error: "Country is required" }, 400);
    if (!ALLOWED_COUNTRIES.includes(country)) {
      return json({ error: `Country must be one of: ${ALLOWED_COUNTRIES.join(", ")}` }, 400);
    }
    if (!businessNumber) return json({ error: "Business Registration Number is required" }, 400);
    if (!phone || !isValidPhoneNumber(phone, metadata)) return json({ error: "Phone number is not valid" }, 400);
    if (!email) return json({ error: "Email is required" }, 400);
    const passwordError = validatePassword(password);
    if (passwordError) return json({ error: passwordError }, 400);

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

    const emailTaken = await User.findOne({ email }).select("_id").lean();
    if (emailTaken) return json({ error: "That email is already in use" }, 409);

    const doc = new User({
      firstname,
      lastname,
      storename,
      email,
      password: await bcrypt.hash(password, 10),
      role: "store",
      country,
      businessNumber,
      phone,
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
