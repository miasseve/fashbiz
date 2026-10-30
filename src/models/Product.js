import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  title: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  description: { type: String, required: true },
  color: {
    name: { type: String, default: "No Color" },
    hex: {
      type: String,
      match: /^#([0-9A-F]{3}){1,2}$/i,
      default: "#fff",
    },
  },
  price: { type: Number, required: true },
  pointsValue: { type: Number, required: false },
  brandPrice: { type: Number, required: false },
  images: [
    {
      url: { type: String },
      publicId: { type: String },
    },
  ],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collect: { type: Boolean, default: false },
  barcode: { type: String, unique: true },
  size: {
    type: [String], // or [Number] if sizes are numeric
    required: true,
  },
  fabric: { type: String },
  condition_grade: {
    type: String,
    enum: ["A", "B", "C", null],
    default: null,
  },
  condition_notes: { type: String, default: "" },
  consignorName: { type: String },
  consignorEmail: { type: String },
  consignorAccount: { type: String },
  sold: { type: Boolean, default: false },
  soldVia: { type: String, enum: ["ree", "shopify"], default: null },
  archived: { type: Boolean, default: false },
  wixProductId: { type: String, required: false },
  shopifyProductId: { type: String, required: false },
  shopifyVariantId: { type: String, required: false },
  shopifyInventoryItemId: { type: String, required: false },
  // The collection on the OWNER'S OWN Shopify store that this product belongs
  // in, chosen by the AI from that store's real collections. Optional: null for
  // a store with no connected Shopify, and null when the AI had no good match.
  //
  // Keyed on the Shopify GID, never the title or handle — neither is unique
  // (one live store has two collections both titled "Jakker"). See
  // CPH-CATEGORY-MAPPING.md §1.
  //
  // EVERY FIELD HERE IS A SNAPSHOT, not a source of truth. The value round-trips
  // through the browser form, so a caller can submit a well-formed GID for a
  // collection they don't own along with any title/handle/isManual they like.
  // Anything acting on it must therefore re-read the collection LIVE from the
  // owner's own store and use that `ruleSet`, never the stored title, handle or
  // isManual — a collection can also be switched between manual and automated
  // in Shopify at any time. addProductToStoreCollection() does exactly that:
  // it resolves the id through the owner's client (so another store's id is
  // simply not found) and refuses to run at all without a storeConfig.
  storeCollection: {
    type: {
      id: { type: String },
      title: { type: String },
      handle: { type: String },
      isManual: { type: Boolean },
    },
    required: false,
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  isDemo: {
    type: Boolean,
    default: false,
  },
  guestSessionId: { type: String, required: false, index: true },
  // Flag to indicate if this product has been posted to Instagram
   hasInstagramPost: {
    type: Boolean,
    default: false,
    index: true,
  },
  // AI confidence flag — true when confidence_score < 0.6
  needsReview: {
    type: Boolean,
    default: false,
    index: true,
  },
  aiConfidenceScore: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
