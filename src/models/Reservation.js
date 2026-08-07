import mongoose from "mongoose";

// A Discover user's hold on a product. Mirrors the state machine Discover's
// UI already assumes (see ree.ts ReservationState): RESERVED -> CONFIRMED ->
// COLLECTED, or RESERVED/CONFIRMED -> EXPIRED/CANCELLED. There's no
// background job to flip expired holds — callers lazily expire on read
// (see reservationLib.js), same pattern as the SsoCode TTL is handled
// differently (that one really does get deleted; a reservation's history is
// worth keeping, so it's marked EXPIRED instead of removed).
const ReservationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    state: {
      type: String,
      enum: ["RESERVED", "CONFIRMED", "COLLECTED", "EXPIRED", "CANCELLED"],
      default: "RESERVED",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
