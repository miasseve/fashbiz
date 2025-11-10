import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    referralCode: {
      type: String,
      required: true,
      unique: true, 
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.models.StoreReferralCode || mongoose.model("StoreReferralCode", ReferralSchema);
