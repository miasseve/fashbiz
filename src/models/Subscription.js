// models/Subscription.js
// import mongoose from "mongoose";
 
// const SubscriptionSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     unique: true
//   },
//   stripeSubscriptionId: { type: String, },
//   stripeCustomerId: { type: String },
//   planName: { type: String, required: true },
//   planPriceId: { type: String, required: true },
//   status: {
//     type: String,
//     enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
//     default: "incomplete"
//   },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   cancelAtPeriodEnd: { type: Boolean, default: false }
// }, { timestamps: true });
 

// export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
 

// models/Subscription.js
import mongoose from "mongoose";
 
const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  stripeSubscriptionId: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String, required: true },
  planName: { type: String, required: true },
  planPriceId: { type: String, required: true },
  status: {
    type: String,
    enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
    default: "incomplete"
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
}, { timestamps: true });
 
// Index for faster queries
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
 
export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
 