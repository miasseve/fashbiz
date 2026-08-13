import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { serializePublicStore, PUBLIC_STORE_FIELDS } from "@/lib/publicStoreSerializer";

export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(req, { params }) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await dbConnect();

    const store = await User.findOne({ _id: id, role: "store" }).select(PUBLIC_STORE_FIELDS).lean();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    return Response.json(serializePublicStore(store));
  } catch (error) {
    console.error("Public store detail error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Lets Discover write back coordinates it resolved itself (geocoded from the
// store's address) so each store only ever needs geocoding once. Discover's
// own geocode cache is in-memory and per-request-capped — without saving
// the result here, a store that isn't reached within that cap stays
// unlocatable forever instead of just until the next successful pass.
export async function PATCH(req, { params }) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ error: "lat and lng must be finite numbers" }, { status: 400 });
    }

    await dbConnect();

    const store = await User.findOneAndUpdate(
      { _id: id, role: "store" },
      { $set: { latitude: lat, longitude: lng } },
      { new: true },
    ).select(PUBLIC_STORE_FIELDS);

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    return Response.json(serializePublicStore(store));
  } catch (error) {
    console.error("Public store coordinate update error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
