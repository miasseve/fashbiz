import mongoose from "mongoose";

const ContactSupportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    type: { type: String, enum: ["public", "dashboard"], default: "public" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    storename: { type: String, default: "" },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    isRead: { type: Boolean, default: false },
    adminReply: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ContactSupport ||
  mongoose.model("ContactSupport", ContactSupportSchema);
