import mongoose from "mongoose";

const ShopifyStoreSchema = new mongoose.Schema(
  {
    // null = base store (not tied to a specific owner)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    storeDomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    //  encrypted 
    accessToken: {
      type: String,
      required: true,
    },
    // encrypted 
    apiSecret: {
      type: String,
      required: true,
    },
    isBaseStore: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ShopifyStore ||
  mongoose.model("ShopifyStore", ShopifyStoreSchema);
