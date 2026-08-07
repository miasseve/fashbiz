import mongoose from "mongoose";

// A Discover user's "liked"/saved Find. Guest saves stay local-only on
// Discover's side (no account to attach them to); this only exists once
// someone is actually signed in.
const SavedProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

SavedProductSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.models.SavedProduct || mongoose.model("SavedProduct", SavedProductSchema);
