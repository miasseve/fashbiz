import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  title: { type: String, required: true },
  brand: { type: String, required: true },
  // category: { type: String, required: true },
  description: { type: String, required: true },
  // color: { type: String, required: true },
  price: { type: Number, required: true },
  images: [
    {
      url: { type: String },
      publicId: { type: String },
    },
  ],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  consignorName: { type: String, required: true },
  consignorEmail: { type: String, required: true },
  consignorAccount: { type: String, required: true },
  sold: { type: Boolean, default: false },
  // wixProductId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;