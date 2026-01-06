// src\models\PointRule.js
import mongoose from "mongoose";
const PointRuleSchema = new mongoose.Schema(
  {
    storeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "MAXI_DRESS",
        "JUMPSUIT",
        "SET",
        "JACKET",
        "BLAZER",
        "COAT",
        "HOME_KNITTED",
        "SHOES",
        "BAGS",
        "ACCESSORIES",
        "BOOTS",
      ],
      required: true,
    },

    brandType: {
      type: String,
      enum: ["FAST_FASHION", "LESS_FAST_FASHION", "ANY"],
      default: "ANY",
    },

    minPoints: { type: Number, default: 0 },
    maxPoints: { type: Number }, // used for ranges (shoes/bags)

    fixedPoints: { type: Number }, // used for exact values (coats, dresses)

    requiresQualityCheck: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PointRule =
  mongoose.models.PointRule ||
  mongoose.model("PointRule", PointRuleSchema);

export default PointRule;
