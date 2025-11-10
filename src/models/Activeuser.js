import mongoose from "mongoose";

const ActiveUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ActiveUserSchema.index({ userId: 1, ipAddress: 1 }, { unique: true });

export default mongoose.models.ActiveUser || mongoose.model("ActiveUser", ActiveUserSchema);
