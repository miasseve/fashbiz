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
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipcode: { type: String },
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
    default: function () {
      return this.role === "store" ? "free" : undefined;
    },
  },
  subscriptionStart: { type: Date },
  subscriptionEnd: { type: Date },
  isActive: {
    type: Boolean,
    default: function () {
      return this.role === "store" ? true : undefined;
    },
  },
  isProfileComplete: { type: Boolean, default: false },
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
