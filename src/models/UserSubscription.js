import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planName: {
      type: String,
      required: true,
      enum: ["Basic", "Pro","Business"], 
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled"],
      default: "inactive",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    paymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
