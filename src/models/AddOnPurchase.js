import mongoose from "mongoose";

const AddOnPurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    addOns: [
      {
        type: String,
        enum: ["complete_adds", "instagram", "barcode_label", "webstore", "plugin"],
      },
    ],
    totalAmount: { type: Number, required: true }, // in smallest currency unit (øre)
    currency: { type: String, default: "DKK" },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

AddOnPurchaseSchema.index({ userId: 1, status: 1 });
AddOnPurchaseSchema.index({ stripeSessionId: 1 });

export default mongoose.models.AddOnPurchase ||
  mongoose.model("AddOnPurchase", AddOnPurchaseSchema);
