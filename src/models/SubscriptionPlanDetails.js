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
      required: true,
    },
    maxUsers: {
      type: Number,
      required: true,
    },
    modules: [
      {
        type: String,
        enum: [
          "✔ Upload up to 60 products per Month",
          "✔ AI automation",
          "✔ Consignor fee setup",
          "✔ Upto 2 Users access",
          "✔ Auto Split Payments Support",
          "✔ All Starter features",
          "✔ Upload up to 500 products per Month",
          "✔ Upto 3 Users access",
          "✔ Faster automation",
          "✔ All Business features",
          "✔ Upload up to 1000 products per Month",
          "✔ Upto 5-10 Users access",
          "✔ Multi-store Sync",
          "✔ Priority Support",
        ],
      },
    ],
    minDurationMonths: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true } 
);

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
