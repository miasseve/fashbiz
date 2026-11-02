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
    // Collections on this store that the AI must never be offered — a shop's
    // brand categories and its catch-all buckets ("all products", "our
    // favourites", "archive"). The store owner can still choose one by hand in
    // the upload form; only the model's list is filtered. See
    // .claude/specs/546-cphs-real-categories.md FR-06.
    //
    // Set BY HAND, per store, with scripts/set-store-ai-excluded-collections.js
    // — deliberately no UI, like the status/connectedVia group above. It stays
    // UI-free only while the two developer routes keep their explicit field
    // whitelists (api/developer/shopify-stores/route.js POST and
    // .../[storeId]/route.js PATCH); don't add this field to either.
    //
    // Shopify collection GIDs, never titles or handles: titles are not unique
    // (one live store has two collections both titled "Jakker") and handles
    // contradict their contents on a real store (the PRADA category's handle
    // says "skjorter"). An id here whose collection has since been deleted is
    // simply never matched, which is harmless.
    aiExcludedCollectionIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.ShopifyStore ||
  mongoose.model("ShopifyStore", ShopifyStoreSchema);
