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

// Discover's reservation rules (APP-lovable-discover reservation-rules.ts):
// a member picks a 2- or 5-hour hold, and may hold up to 3 Finds per store
// and 6 overall at the same time. The server owns the expiry: a client only
// ever names one of these durations, never a timestamp.
export const RESERVATION_DURATIONS_HOURS = [2, 5];
export const MAX_ACTIVE_PER_STORE = 3;
export const MAX_ACTIVE_GLOBAL = 6;

/**
 * The hold window for a create request. `undefined`/`null` keeps the legacy
 * 8-hour window for clients that do not send a duration; anything other than
 * a supported whole-hour choice is rejected (returns null).
 */
export function reservationWindowMs(durationHours) {
  if (durationHours === undefined || durationHours === null) return RESERVATION_WINDOW_MS;
  if (!RESERVATION_DURATIONS_HOURS.includes(durationHours)) return null;
  return durationHours * 60 * 60 * 1000;
}

/** Every open, not-yet-expired hold a user has, soonest to end first. */
export async function getActiveReservationsForUser(userId) {
  const candidates = await Reservation.find({
    userId,
    state: { $in: OPEN_STATES },
  });
  const open = [];
  for (const r of candidates) {
    const settled = await lazilyExpireIfNeeded(r);
    if (OPEN_STATES.includes(settled.state)) open.push(settled);
  }
  return open.sort((a, b) => a.expiresAt - b.expiresAt);
}
