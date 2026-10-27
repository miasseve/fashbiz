import mongoose from "mongoose";

// Short-lived, single-use CSRF/state records for the per-store Shopify OAuth
// connect flow. One document is created per authorization link we hand out.
//
// The state token the store owner carries in their browser is signed and
// self-describing, but a signature alone can't be *single-use* — so the nonce
// is also recorded here and atomically flipped to `used` on first callback.
// A TTL index removes expired rows automatically, so abandoned links never
// accumulate in the database.
const ShopifyOAuthStateSchema = new mongoose.Schema(
  {
    // Random value embedded in the signed state token.
    nonce: {
      type: String,
      required: true,
      unique: true,
    },
    // The store owner (User with role "store") this link was issued for.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The shop the link was issued for, e.g. "cph-test-zdjh3fq2.myshopify.com".
    // The callback refuses to proceed if Shopify reports a different shop.
    shopDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Admin/developer who generated the link — useful for auditing.
    issuedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Address the link was emailed to. The admin can override the store
    // owner's registered email when sending, so "Resend" reuses whatever was
    // actually used rather than silently switching address.
    recipientEmail: {
      type: String,
      default: "",
      trim: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL: Mongo deletes the document once `expiresAt` passes.
ShopifyOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ShopifyOAuthState ||
  mongoose.model("ShopifyOAuthState", ShopifyOAuthStateSchema);
