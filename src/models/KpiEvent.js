import mongoose from "mongoose";

// Generic event log for Discover-app KPIs — one shared shape for "go to
// store" clicks, reservations, likes, etc. rather than a separate model per
// event type, since they all just need to answer "what happened, where,
// when."
const KpiEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["store_directions_clicked", "reservation_created", "product_saved"],
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    // Opaque identifier from Discover's side (device/session/user id) —
    // not validated against a Ree account; useful for de-duping/analysis
    // without requiring the login system to exist yet.
    externalUserId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.KpiEvent || mongoose.model("KpiEvent", KpiEventSchema);
