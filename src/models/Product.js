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
  consignorName: { type: String },
  consignorEmail: { type: String },
  consignorAccount: { type: String },
  sold: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  wixProductId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
