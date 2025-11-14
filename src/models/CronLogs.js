import mongoose from "mongoose";

const CronLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  totalChecked: Number,
  updated: Number,
  activated: Number,
  deactivated: Number,
  errors: Number,
  productsArchived: Number,
  productsUnarchived: Number,
}, { timestamps: true });

export default mongoose.models.CronLog ||
  mongoose.model("CronLog", CronLogSchema);
