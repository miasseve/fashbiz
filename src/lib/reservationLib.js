import Reservation from "@/models/Reservation";

// Flat window, not opening-hours-aware — Discover's own mock never actually
// used real per-store hours either (it always fell back to a hardcoded
// default schedule), so this matches what the app already effectively does.
// A real opening-hours-aware window needs a Store hours model; separate task.
export const RESERVATION_WINDOW_MS = 8 * 60 * 60 * 1000;

const OPEN_STATES = ["RESERVED", "CONFIRMED"];

// No background job flips expired holds — every read path lazily expires
// whatever it touches first.
async function lazilyExpireIfNeeded(reservation) {
  if (!reservation) return reservation;
  if (OPEN_STATES.includes(reservation.state) && reservation.expiresAt <= new Date()) {
    reservation.state = "EXPIRED";
    await reservation.save();
  }
  return reservation;
}

/** The current open (RESERVED/CONFIRMED, not-yet-expired) hold on a product, if any. */
export async function getActiveReservation(productId) {
  const candidate = await Reservation.findOne({
    productId,
    state: { $in: OPEN_STATES },
  }).sort({ createdAt: -1 });
  if (!candidate) return null;
  const settled = await lazilyExpireIfNeeded(candidate);
  return OPEN_STATES.includes(settled.state) ? settled : null;
}

/** Batch version for list endpoints — one query instead of N. */
export async function getActiveReservationsByProduct(productIds) {
  const candidates = await Reservation.find({
    productId: { $in: productIds },
    state: { $in: OPEN_STATES },
  });
  const byProduct = new Map();
  for (const r of candidates) {
    const settled = await lazilyExpireIfNeeded(r);
    if (OPEN_STATES.includes(settled.state)) byProduct.set(String(settled.productId), settled);
  }
  return byProduct;
}

export async function getReservationById(id) {
  const reservation = await Reservation.findById(id);
  return lazilyExpireIfNeeded(reservation);
}
