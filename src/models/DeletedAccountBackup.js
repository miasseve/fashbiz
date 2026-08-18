import mongoose from "mongoose";

/**
 * A full snapshot of a user (store/brand/consignor) and every collection
 * that references them, taken right before an admin hard-deletes the
 * account — so a mistaken delete can be undone instead of requiring the
 * store to be told everything is gone. See DELETE /api/admin/users/[userId].
 *
 * Each sub-array is stored exactly as read from its source collection
 * (including real ObjectIds), so restoring re-inserts every document with
 * its original _id — anything elsewhere that references these ids (Discover,
 * Shopify links, other unrelated collections) reconnects automatically.
 */
const DeletedAccountBackupSchema = new mongoose.Schema(
  {
    originalUserId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    businessNumber: { type: String },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedByName: { type: String },
    deletedAt: { type: Date, default: Date.now },
    restoredAt: { type: Date, default: null },
    data: {
      user: { type: mongoose.Schema.Types.Mixed, required: true },
      products: [mongoose.Schema.Types.Mixed],
      accounts: [mongoose.Schema.Types.Mixed],
      activeUsers: [mongoose.Schema.Types.Mixed],
      addOnPurchases: [mongoose.Schema.Types.Mixed],
      carts: [mongoose.Schema.Types.Mixed],
      contactSupport: [mongoose.Schema.Types.Mixed],
      instagramPostLogs: [mongoose.Schema.Types.Mixed],
      notifications: [mongoose.Schema.Types.Mixed],
      sessions: [mongoose.Schema.Types.Mixed],
      shopifyStores: [mongoose.Schema.Types.Mixed],
      subscriptions: [mongoose.Schema.Types.Mixed],
      transactions: [mongoose.Schema.Types.Mixed],
      pointRules: [mongoose.Schema.Types.Mixed],
      storeReferralCodes: [mongoose.Schema.Types.Mixed],
      approvedProducts: [mongoose.Schema.Types.Mixed],
      referrals: [mongoose.Schema.Types.Mixed],
    },
  },
  { timestamps: true },
);

export default mongoose.models.DeletedAccountBackup ||
  mongoose.model("DeletedAccountBackup", DeletedAccountBackupSchema);
