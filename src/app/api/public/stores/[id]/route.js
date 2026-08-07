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
