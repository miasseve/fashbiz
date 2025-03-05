import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expires: Date,
  sessionToken: { type: String, unique: true },
  accessToken: String,
});

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);
