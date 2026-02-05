import mongoose from "mongoose";

const InstagramPostLogSchema = new mongoose.Schema(
  {
    productIds: {
      type:  [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      enum: ["single", "carousel"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
      required: true,
      index: true,
    },
    instagramPostId: {
      type: String,
      default: null,
      comment: "Instagram post ID returned from API",
    },
    postedAt: {
      type: Date,
      default: null,
    },
    errorLog: {
      message: String,
      meta: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
InstagramPostLogSchema.index({ userId: 1, status: 1, createdAt: -1 });
InstagramPostLogSchema.index({ productId: 1, status: 1 });

// Prevent duplicate posts for the same product
InstagramPostLogSchema.index({ productId: 1 }, { unique: false });

const InstagramPostLog =
  mongoose.models.InstagramPostLog ||
  mongoose.model("InstagramPostLog", InstagramPostLogSchema);

export default InstagramPostLog;