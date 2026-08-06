import dbConnect from "@/lib/db";
import KpiEvent from "@/models/KpiEvent";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";

const VALID_TYPES = ["store_directions_clicked", "reservation_created", "product_saved"];

export async function OPTIONS() {
  return handlePreflight();
}

export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { type, storeId, productId, externalUserId } = body;

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: "Invalid event type" }, { status: 400 });
    }

    await dbConnect();
    const event = await KpiEvent.create({ type, storeId, productId, externalUserId });

    return Response.json({ ok: true, id: String(event._id) }, { status: 201 });
  } catch (error) {
    console.error("KPI event error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
