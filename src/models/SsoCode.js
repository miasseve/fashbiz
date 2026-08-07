import mongoose from "mongoose";

// One-time code bridging a real Ree login to the Discover app, which lives
// on a different domain and can't read Ree's httpOnly session cookie.
// Discover exchanges this server-to-server (via REE_API_KEY) for the user's
// identity right after the redirect back. TTL index auto-cleans expired
// codes — nothing else needs to garbage-collect this collection.
const SsoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.SsoCode || mongoose.model("SsoCode", SsoCodeSchema);
