import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      // Optional — "reminder" notifications are store-wide, not tied to one
      // product.
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    type: {
      type: String,
      enum: ["sold", "order", "system", "reminder"],
      default: "sold",
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    orderDetails: {
      shopifyOrderId: { type: String },
      shopifyOrderUrl: { type: String },
      customerName: { type: String },
      customerEmail: { type: String },
      shippingAddress: {
        address1: { type: String },
        address2: { type: String },
        city: { type: String },
        province: { type: String },
        country: { type: String },
        zip: { type: String },
      },
      fulfillmentMethod: { type: String },
      totalPrice: { type: String },
      currency: { type: String },
    },
  },
  { timestamps: true },
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
