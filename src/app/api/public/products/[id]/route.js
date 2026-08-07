import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { serializePublicProduct } from "@/lib/publicProductSerializer";
import { getActiveReservation } from "@/lib/reservationLib";

export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(req, { params }) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await dbConnect();

    const product = await Product.findOne({ _id: id, archived: { $ne: true }, needsReview: { $ne: true } });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const activeReservation = await getActiveReservation(product._id);

    return Response.json({ ok: true, product: serializePublicProduct(product, activeReservation) });
  } catch (error) {
    console.error("Public product detail error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
