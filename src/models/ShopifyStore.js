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
    // --- Per-store OAuth connect flow (additive; existing rows are unaffected
    // and keep behaving exactly as before) --------------------------------
    // "connected" is the default so rows created by the developer page (which
    // are, by definition, already working credentials) read correctly without
    // any backfill.
    status: {
      type: String,
      enum: ["pending", "connected", "failed"],
      default: "connected",
    },
    // "manual" = token pasted into /admin/developer, "oauth" = store owner
    // authorized the Shopify app.
    connectedVia: {
      type: String,
      enum: ["manual", "oauth"],
      default: "manual",
    },
    // Which Shopify app this store authorized. Client IDs are public (they
    // appear in the authorize URL), so this is safe to persist and display.
    appClientId: {
      type: String,
      default: null,
    },
    // Scopes Shopify actually granted, as returned by the token exchange.
    grantedScopes: {
      type: String,
      default: "",
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    lastConnectionError: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ShopifyStore ||
  mongoose.model("ShopifyStore", ShopifyStoreSchema);
