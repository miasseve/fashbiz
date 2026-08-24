import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  profileImage: {
    url: { type: String },
    publicId: { type: String },
  },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  storename: {
    type: String,
    required: function () {
      return this.role === "store";
    },
  },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  // Public business contact email (e.g. scraped from a CVR registry import) —
  // kept separate from `email`, which is the login credential and must stay
  // unique. A store's real-world contact address shouldn't collide with or
  // silently become someone's login just because it appeared in an import.
  contactEmail: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipcode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  country: {
    type: String,
    required: function () {
      return this.role === "store" || this.role === "brand";
    },
  },
  businessNumber: {
    type: String,
    required: function () {
      return this.role === "store";
    },
  },
  contactTitle: {
    type: String,
    required: function () {
      return this.role === "brand";
    },
  },
  companyNumber: {
    type: String,
    required: function () {
      return this.role === "brand";
    },
  },
  companyWebsite: {
    type: String,
  },
  legalCompanyName: {
    type: String,
    required: function () {
      return this.role === "brand";
    },
  },
  brandname: {
    type: String,
    required: function () {
      return this.role === "brand";
    },
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  role: {
    type: String,
    required: true,
    enum: ["admin", "brand", "consignor", "store", "developer"],
  },
  emailVerified: Date,
  subscriptionType: {
    type: String,
  },
  subscriptionStart: { type: Date },
  subscriptionEnd: { type: Date },
  isActive: {
    type: Boolean,
    default: false,
  },
  isProfileComplete: { type: Boolean, default: false },
  // false only for stores added via CSV bulk import or an unrecognized store name during
  // upload — not yet claimed/confirmed by the real business. Real signups default to true.
  isVerified: { type: Boolean, default: true },
  // True only for stores created through the admin "Add Store" form (as
  // opposed to a real self-signup or a CSV import) — shown as a badge in
  // Stores & Users so it's clear this account didn't sign up itself.
  addedByAdmin: { type: Boolean, default: false },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: String, default: null },
  stripeCustomerId: { type: String },
  //for the DKK Store loyalty points program
  points_mode: {
    type: Boolean,
    default: false,
  },
  soldNotifications: {
    type: Boolean,
    default: true,
  },
  shopifyStoreCreated: {
    type: Boolean,
    default: false,
  },
  // The non-blocking "Ready to automate?" popup shown once a store crosses
  // 300 products (Discovery uploads are unlimited/free — this is a one-time
  // nudge toward leStores AI, not a wall). Tracked so it only shows once,
  // and so store-side conversion (shown -> clicked) can be measured later.
  productLimitUpsell: {
    shownAt: { type: Date, default: null },
    ctaClicked: { type: Boolean, default: false },
  },
  branding: {
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    primaryColor: { type: String, default: "#000000" },
    secondaryColor: { type: String, default: "#ffffff" },
    accentColor: { type: String, default: "#ff6b6b" },
    storeDescription: { type: String, default: "" },
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      website: { type: String, default: "" },
    },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
