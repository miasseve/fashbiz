import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { getReservationById } from "@/lib/reservationLib";

export async function OPTIONS() {
  return handlePreflight();
}

// Marks a hold as picked up in the boutique — and the product as sold via
// Ree, same as the mock's collect flow. No store-side UI calls this yet
// (nothing in Discover's real UI does either today), but the contract is
// here so either side can wire a button to it later without a backend change.
export async function POST(req, { params }) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await dbConnect();

    const reservation = await getReservationById(id);
    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }
    if (!["RESERVED", "CONFIRMED"].includes(reservation.state)) {
      return Response.json({ error: `Cannot collect a ${reservation.state.toLowerCase()} reservation` }, { status: 409 });
    }

    reservation.state = "COLLECTED";
    await reservation.save();

    await Product.findByIdAndUpdate(reservation.productId, { sold: true, soldVia: "ree" });

    return Response.json({ ok: true, state: reservation.state });
  } catch (error) {
    console.error("Collect reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
