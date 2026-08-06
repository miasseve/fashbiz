import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(req, { params }) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await dbConnect();

    const store = await User.findOne({ _id: id, role: "store" })
      .select(
        "storename address city state zipcode country latitude longitude businessNumber isVerified branding"
      )
      .lean();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    return Response.json({
      id: String(store._id),
      name: store.storename,
      address: store.address || null,
      city: store.city || null,
      state: store.state || null,
      zipcode: store.zipcode || null,
      country: store.country || null,
      lat: store.latitude ?? null,
      lng: store.longitude ?? null,
      businessNumber: store.businessNumber || null,
      verified: store.isVerified !== false,
      logo: store.branding?.logoUrl || null,
    });
  } catch (error) {
    console.error("Public store detail error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
