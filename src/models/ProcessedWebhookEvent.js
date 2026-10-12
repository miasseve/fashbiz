import mongoose from "mongoose";

const ProcessedWebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  processedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProcessedWebhookEvent ||
  mongoose.model("ProcessedWebhookEvent", ProcessedWebhookEventSchema);
