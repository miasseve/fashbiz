import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Reservation from "@/models/Reservation";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { RESERVATION_WINDOW_MS, getActiveReservation } from "@/lib/reservationLib";

export async function OPTIONS() {
  return handlePreflight();
}

function serialize(r) {
  return {
    reservationId: String(r._id),
    productId: String(r.productId),
    storeId: String(r.storeId),
    state: r.state,
    expiresAt: r.expiresAt.getTime(),
  };
}

// Places an 8-hour hold on a product — the one action Discover requires a
// real sign-in for, so userId always comes from a genuine Ree account.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { productId, userId, storeId } = await req.json();
    if (!productId || !userId) {
      return Response.json({ error: "Missing productId or userId" }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findOne({ _id: productId, archived: { $ne: true } });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.sold) {
      return Response.json({ error: "Already sold" }, { status: 409 });
    }

    const existing = await getActiveReservation(productId);
    if (existing) {
      return Response.json({ error: "Already reserved" }, { status: 409 });
    }

    const reservation = await Reservation.create({
      productId,
      storeId: storeId || product.userId,
      userId,
      state: "RESERVED",
      expiresAt: new Date(Date.now() + RESERVATION_WINDOW_MS),
    });

    return Response.json({ ok: true, ...serialize(reservation) }, { status: 201 });
  } catch (error) {
    console.error("Create reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// The signed-in user's current active hold, if any — used to restore the
// reservation card when they open the app on a different device/session.
export async function GET(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    await dbConnect();

    const reservation = await Reservation.findOne({
      userId,
      state: { $in: ["RESERVED", "CONFIRMED"] },
    }).sort({ createdAt: -1 });

    if (!reservation || reservation.expiresAt <= new Date()) {
      return Response.json({ ok: true, reservation: null });
    }

    return Response.json({ ok: true, reservation: serialize(reservation) });
  } catch (error) {
    console.error("Get reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
