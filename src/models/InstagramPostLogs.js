import mongoose from "mongoose";

const InstagramPostLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId, // or String if product ID is external
      required: true,
      index: true,
    },

    instagramPostId: {
      type: String,
      default: null,
      index: true,
    },

    carouselId: {
      type: String,
      default: null, // Only for carousel posts
    },

    postType: {
      type: String,
      enum: ["single", "carousel"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    errorLog: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    postedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

export default mongoose.models.InstagramPostLog ||
  mongoose.model("InstagramPostLog", InstagramPostLogSchema);
