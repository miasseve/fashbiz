import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    subscriptionPlanId: {
      type: String,
      unique: true,
      required: true,
    },
    plan_name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "DKK",
    },
    productLimit: {
      type: Number,
      default: null,
    },
    maxUsers: {
      type: Number,
      default: null,
    },
    tagline: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    modules: [
      {
        type: String,
      },
    ],
    bgColor: {
      type: String,
      default: "bg-white",
    },
    minDurationMonths: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true } 
);

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
