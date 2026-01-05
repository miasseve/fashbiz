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
    modules: [
      {
        type: String,
        enum: [
          "✔ Upload up to 60 products per Month",
          "✔ AI automation",
          "✔ Consignor fee setup",
          "✔ Up to 2 users access",
          "✔ Auto Split Payments Support",
          "✔ All Starter features",
          "✔ Upload up to 500 products per Month",
          "✔ Up to 3 users access",
          "✔ Faster automation",
          "✔ All Business features",
          "✔ Upload up to 1000 products per Month",
          "✔ Up to 5-10 users access",
          "✔ Multi-store Sync",
          "✔ Priority Support",
          "✔ Ree Collect Program",
          "✔ Ecommerce Integrations",
          "✔ Resale Tag",
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
