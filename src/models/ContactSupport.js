import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const ContactSupportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["public", "dashboard", "bug_report"],
      default: "public",
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    storename: { type: String, default: "" },
    role: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
    isRead: { type: Boolean, default: false },
    adminReply: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    // Bug report chat fields
    messages: [MessageSchema],
    hasNewReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ContactSupport ||
  mongoose.model("ContactSupport", ContactSupportSchema);
