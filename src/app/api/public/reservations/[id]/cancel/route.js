import dbConnect from "@/lib/db";
import { requireApiKey, handlePreflight } from "@/lib/apiKeyMiddleware";
import { getReservationById } from "@/lib/reservationLib";

export async function OPTIONS() {
  return handlePreflight();
}

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
      return Response.json({ error: `Cannot cancel a ${reservation.state.toLowerCase()} reservation` }, { status: 409 });
    }

    reservation.state = "CANCELLED";
    await reservation.save();

    return Response.json({ ok: true, state: reservation.state });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
