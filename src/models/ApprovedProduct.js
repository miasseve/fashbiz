import mongoose from "mongoose";

const correctionEntrySchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    original_value: { type: mongoose.Schema.Types.Mixed },
    corrected_value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const approvedProductSchema = new mongoose.Schema(
  {
    // Reference to the actual product
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Category taxonomy
    category: { type: String, required: true },
    subcategory: { type: String, required: true },

    // Original image URL or hash for deduplication
    imageUrl: { type: String },
    imageHash: { type: String },

    // Raw AI output (what the model returned before any edits)
    rawAiOutput: { type: mongoose.Schema.Types.Mixed, required: true },

    // Final approved output (after merchant corrections + normalization)
    approvedOutput: {
      title: { type: String, required: true },
      brand: { type: String, required: true },
      size: { type: String, required: true },
      category: { type: String, required: true },
      subcategory: { type: String, required: true },
      color: [{ type: String }],
      fabric: [{ type: String }],
      description: { type: String, required: true },
      condition_grade: {
        type: String,
        enum: ["A", "B", "C"],
      },
      condition_notes: { type: String, default: "" },
      shopify_tags: [{ type: String }],
      value_score: { type: Number, default: 0 },
    },

    // Merchant corrections — what changed from AI output to final
    corrections: [correctionEntrySchema],

    // AI confidence score for this prediction
    confidenceScore: { type: Number, min: 0, max: 1 },

    // Embedding vector for similarity search
    embedding: { type: [Number], default: [] },

    // Text used to generate the embedding (for re-embedding if needed)
    embeddingText: { type: String },

    approvalDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for similarity search — store + category first, then vector
approvedProductSchema.index({ storeId: 1, category: 1 });
approvedProductSchema.index({ category: 1, subcategory: 1 });

const ApprovedProduct =
  mongoose.models.ApprovedProduct ||
  mongoose.model("ApprovedProduct", approvedProductSchema);

export default ApprovedProduct;
