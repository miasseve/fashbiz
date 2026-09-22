import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Reservation from "@/models/Reservation";
import Notification from "@/models/Notification";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import {
  MAX_ACTIVE_GLOBAL,
  MAX_ACTIVE_PER_STORE,
  getActiveReservation,
  getActiveReservationsForUser,
  reservationWindowMs,
} from "@/lib/reservationLib";

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
    // When the hold was placed - lets a client show its real age.
    createdAt: r.createdAt ? r.createdAt.getTime() : null,
  };
}

// Places a hold on a product - the one action Discover requires a real
// sign-in for, so userId always comes from a genuine Ree account.
//
// `durationHours` (optional): 2 or 5, Discover's two choices. The server sets
// the expiry from it; a client never sends a timestamp. Omitted, the legacy
// 8-hour window applies, so older clients keep working. Any other value is
// rejected.
//
// Limits (Discover reservation-rules.ts): 3 open holds per store, 6 overall.
// A refusal says which one (`reason`), so the app can show the right dialog.
export async function POST(req) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { productId, userId, storeId, durationHours } = await req.json();
    if (!productId || !userId) {
      return Response.json({ error: "Missing productId or userId" }, { status: 400 });
    }
    const windowMs = reservationWindowMs(durationHours);
    if (windowMs === null) {
      return Response.json({ error: "Unsupported durationHours" }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findOne({ _id: productId, archived: { $ne: true } });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.sold) {
      return Response.json({ error: "Already sold", reason: "sold" }, { status: 409 });
    }

    const existing = await getActiveReservation(productId);
    if (existing) {
      return Response.json({ error: "Already reserved", reason: "already_reserved" }, { status: 409 });
    }

    const holdStoreId = String(storeId || product.userId);
    const mine = await getActiveReservationsForUser(userId);
    if (mine.length >= MAX_ACTIVE_GLOBAL) {
      return Response.json({ error: "Reservation limit reached", reason: "limit_global" }, { status: 409 });
    }
    if (mine.filter((r) => String(r.storeId) === holdStoreId).length >= MAX_ACTIVE_PER_STORE) {
      return Response.json({ error: "Store reservation limit reached", reason: "limit_store" }, { status: 409 });
    }

    const reservation = await Reservation.create({
      productId,
      storeId: holdStoreId,
      userId,
      state: "RESERVED",
      expiresAt: new Date(Date.now() + windowMs),
    });

    // Store-side heads up — the store otherwise has no way to know a hold
    // exists until the shopper physically shows up. Best-effort: the
    // reservation itself is already committed, so a notification hiccup
    // shouldn't fail the whole request.
    try {
      const hours = Math.round(windowMs / (60 * 60 * 1000));
      await Notification.create({
        userId: reservation.storeId,
        productId: reservation.productId,
        type: "reservation",
        title: "New reservation",
        message: `Someone reserved "${product.title}" — hold it for them for the next ${hours} hours.`,
      });
    } catch (notifyError) {
      console.error("Reservation notification error:", notifyError);
    }

    return Response.json({ ok: true, ...serialize(reservation) }, { status: 201 });
  } catch (error) {
    console.error("Create reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// The signed-in user's open holds - used to restore reservation state when
// they open the app on a different device/session.
//
// `reservations`: every open, unexpired hold, soonest to end first.
// `reservation`: the most recently placed one, kept for older clients.
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

    const open = await getActiveReservationsForUser(userId);
    const latest = [...open].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    return Response.json({
      ok: true,
      reservation: latest ? serialize(latest) : null,
      reservations: open.map(serialize),
    });
  } catch (error) {
    console.error("Get reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
