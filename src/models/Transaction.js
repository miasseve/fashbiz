import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    channel: {
      type: String,
      enum: ["shopify", "ree"],
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "DKK" },
    paymentMethod: { type: String, default: "" },
    status: {
      type: String,
      enum: ["completed", "pending", "refunded", "failed"],
      default: "completed",
    },
    shopifyOrderUrl: { type: String },
    shopifyOrderNumber: { type: String },
    stripePaymentIntentId: { type: String },
    consignorName: { type: String, default: "" },
    consignorEmail: { type: String, default: "" },
    fulfillmentMethod: {
      type: String,
      enum: ["shipping", "pickup", "in-store", null],
      default: null,
    },
    shippingAddress: {
      address1: { type: String },
      address2: { type: String },
      city: { type: String },
      province: { type: String },
      country: { type: String },
      zip: { type: String },
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, channel: 1, createdAt: -1 });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);

export default Transaction;
