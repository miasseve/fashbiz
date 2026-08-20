import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Give this more room than the Vercel default (10s) — a store can need
// several sequential geocode attempts (see buildQueryVariants), each
// rate-limited a second apart.
export const maxDuration = 60;

// Small on purpose — Nominatim's usage policy caps at 1 request/second, and
// this runs sequentially (with a delay between EVERY request, including
// retries for the same store) rather than in parallel like Discover's own
// client-side pass does, to actually respect that instead of risking the
// shared IP getting rate-limited. The admin page calls this repeatedly
// (passing back `afterId`) to work through however many stores are waiting.
const BATCH_SIZE = 4;
const NOMINATIM_DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(query) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url, { headers: { "User-Agent": "ree-admin-geocoder/1.0" } });
    if (!res.ok) return null;
    const hits = await res.json();
    const hit = hits[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

// A big chunk of this backlog comes from bulk-imported CVR registry data,
// which turned out to have two real formatting quirks that silently defeat
// a plain address lookup: " - " used as the field separator instead of a
// comma (so a street/postal/city block reads as one run-on phrase), and a
// "C/O <name>," addressee prefix — sometimes duplicated — that isn't a
// geocodable place at all. Neither is something Discover's own auto-geocode
// pass (a single plain query) can work around.
function stripCareOf(address) {
  return address.replace(/^(?:c\/o\s+[^,-]+[,-]\s*)+/gi, "").trim();
}

// Tries increasingly coarse queries so a bad street-level address still
// lands the pin somewhere real (its postal code/city) instead of nowhere —
// approximate beats missing entirely for a map pin.
function buildQueryVariants(store) {
  const rawAddress = (store.address || "").trim();
  const cleanedAddress = rawAddress.replace(/\s+-\s+/g, ", ");
  const noCareOf = stripCareOf(cleanedAddress);
  const zip = (store.zipcode || "").trim();
  const city = (store.city || "").trim();
  const country = store.country || "DK";

  const withLocation = (addr) => {
    const parts = [addr];
    if (zip && !addr.includes(zip)) parts.push(zip);
    if (city && !addr.toLowerCase().includes(city.toLowerCase())) parts.push(city);
    parts.push(country);
    return parts.filter(Boolean).join(", ");
  };

  const variants = [];
  if (cleanedAddress) variants.push(withLocation(cleanedAddress));
  if (noCareOf && noCareOf !== cleanedAddress) variants.push(withLocation(noCareOf));
  if (zip && city) variants.push([zip, city, country].join(", "));
  if (zip) variants.push([zip, country].join(", "));

  return [...new Set(variants)];
}

async function geocodeStore(store) {
  const variants = buildQueryVariants(store);
  for (let i = 0; i < variants.length; i++) {
    const hit = await geocodeAddress(variants[i]);
    if (hit) return hit;
    if (i < variants.length - 1) await sleep(NOMINATIM_DELAY_MS);
  }
  return null;
}

// Same "pending" definition as Discover's own auto-geocode pass — missing
// coordinates, but has enough of an address to look up.
function pendingQuery(afterId) {
  const filter = {
    role: "store",
    $or: [{ latitude: null }, { longitude: null }, { latitude: { $exists: false } }, { longitude: { $exists: false } }],
    address: { $exists: true, $ne: "" },
    city: { $exists: true, $ne: "" },
  };
  if (afterId) filter._id = { $gt: afterId };
  return filter;
}

/**
 * POST /api/admin/stores/geocode-pending
 *
 * Manually works through the backlog of verified-but-uncoordinated stores
 * that Discover's own auto-geocode pass can't realistically clear on its
 * own (it only processes 80 per real visitor page load, and a store deep in
 * that queue — alphabetically or otherwise — can go a very long time
 * without ever being reached). This is the same idea, just admin-triggered
 * and rate-limited properly.
 *
 * Advances by `_id` regardless of whether each store resolves, so an
 * unresolvable address (bad data) can't block progress on everything after
 * it within this pass — a future pass (starting fresh with no afterId)
 * will retry it.
 */
export async function POST(request) {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const afterId = body.afterId || null;

    await dbConnect();

    const batch = await User.find(pendingQuery(afterId))
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .select("_id storename address city zipcode country")
      .lean();

    let resolved = 0;
    let failed = 0;
    let lastId = afterId;

    for (let i = 0; i < batch.length; i++) {
      const store = batch[i];
      lastId = store._id;

      const hit = await geocodeStore(store);

      if (hit) {
        await User.updateOne({ _id: store._id }, { $set: { latitude: hit.lat, longitude: hit.lng } });
        resolved++;
      } else {
        failed++;
      }

      if (i < batch.length - 1) await sleep(NOMINATIM_DELAY_MS);
    }

    // Total still pending across the whole dataset (not scoped to this
    // pass's cursor) — shrinks as passes resolve stores, a reasonable
    // progress signal for the admin UI even though it's not exactly
    // "remaining in this run".
    const totalPending = await User.countDocuments(pendingQuery(null));

    return Response.json({
      processed: batch.length,
      resolved,
      failed,
      lastId,
      totalPending,
      done: batch.length < BATCH_SIZE,
    });
  } catch (error) {
    console.error("Admin geocode-pending error:", error);
    return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
