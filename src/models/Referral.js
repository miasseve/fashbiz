import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referredByuser_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique:true,
    },
    referralCode: {
      type: String,
      unique: true,
      required: true,
    },
    referredTouser_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


export default mongoose.models.ReferralDetails || mongoose.model("ReferralDetails", referralSchema);
