import mongoose from "mongoose";

const ActiveUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ActiveUserSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// Auto-expire stale sessions after 24 hours of inactivity
// This handles cases where users close the browser without logging out
ActiveUserSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.ActiveUser ||
  mongoose.model("ActiveUser", ActiveUserSchema);
