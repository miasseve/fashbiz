import mongoose from "mongoose";

// Generic key/value store for small pieces of admin-editable config that
// don't warrant their own model or an env var + redeploy (e.g. a password
// Mia changes on her own schedule from inside Shopify).
const SiteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    // Encrypted at rest via @/actions/encryption — same treatment as
    // ShopifyStore's accessToken/apiSecret.
    value: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSetting ||
  mongoose.model("SiteSetting", SiteSettingSchema);
