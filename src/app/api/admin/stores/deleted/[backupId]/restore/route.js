import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DeletedAccountBackup from "@/models/DeletedAccountBackup";

import User from "@/models/User";
import Product from "@/models/Product";
import Account from "@/models/Account";
import ActiveUser from "@/models/Activeuser";
import AddOnPurchase from "@/models/AddOnPurchase";
import Cart from "@/models/Cart";
import ContactSupport from "@/models/ContactSupport";
import InstagramPostLogs from "@/models/InstagramPostLogs";
import Notification from "@/models/Notification";
import Session from "@/models/Session";
import ShopifyStore from "@/models/ShopifyStore";
import Subscription from "@/models/Subscription";
import Transaction from "@/models/Transaction";
import PointRule from "@/models/PointRule";
import StoreReferralCode from "@/models/StoreReferralCode";
import ApprovedProduct from "@/models/ApprovedProduct";
import Referral from "@/models/Referral";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Re-inserts every doc with its ORIGINAL _id so anything elsewhere that
// references these ids (Discover, Shopify links, other collections not part
// of this backup) reconnects automatically — a no-op when the array is empty
// (insertMany throws on []).
async function restoreInto(Model, docs) {
  if (!docs || docs.length === 0) return 0;
  await Model.insertMany(docs, { ordered: false });
  return docs.length;
}

/**
 * POST /api/admin/stores/deleted/:backupId/restore
 *
 * Undoes a DELETE /api/admin/users/:userId by re-inserting the full snapshot
 * — the account plus every collection that referenced it — using the exact
 * ids they had before deletion. Refuses if the account was already restored,
 * or if the original id / email is back in use (e.g. a new account signed up
 * with that email since the delete).
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { backupId } = await params;

    await dbConnect();

    const backup = await DeletedAccountBackup.findById(backupId);
    if (!backup) return json({ error: "Backup not found" }, 404);
    if (backup.restoredAt) return json({ error: "This account was already restored" }, 409);

    const { data } = backup;

    const idClash = await User.findById(backup.originalUserId).select("_id").lean();
    if (idClash) {
      return json({ error: "An account with this id already exists — cannot restore." }, 409);
    }
    const emailClash = await User.findOne({ email: data.user.email }).select("_id").lean();
    if (emailClash) {
      return json(
        { error: `"${data.user.email}" is already in use by another account — cannot restore.` },
        409,
      );
    }

    await User.create(data.user);

    const [
      products,
      accounts,
      activeUsers,
      addOnPurchases,
      carts,
      contactSupport,
      instagramPostLogs,
      notifications,
      sessions,
      shopifyStores,
      subscriptions,
      transactions,
      pointRules,
      storeReferralCodes,
      approvedProducts,
      referrals,
    ] = await Promise.all([
      restoreInto(Product, data.products),
      restoreInto(Account, data.accounts),
      restoreInto(ActiveUser, data.activeUsers),
      restoreInto(AddOnPurchase, data.addOnPurchases),
      restoreInto(Cart, data.carts),
      restoreInto(ContactSupport, data.contactSupport),
      restoreInto(InstagramPostLogs, data.instagramPostLogs),
      restoreInto(Notification, data.notifications),
      restoreInto(Session, data.sessions),
      restoreInto(ShopifyStore, data.shopifyStores),
      restoreInto(Subscription, data.subscriptions),
      restoreInto(Transaction, data.transactions),
      restoreInto(PointRule, data.pointRules),
      restoreInto(StoreReferralCode, data.storeReferralCodes),
      restoreInto(ApprovedProduct, data.approvedProducts),
      restoreInto(Referral, data.referrals),
    ]);

    backup.restoredAt = new Date();
    await backup.save();

    return json({
      ok: true,
      message: `Restored ${backup.displayName} and all associated data.`,
      summary: {
        user: 1,
        products,
        accounts,
        activeUsers,
        addOnPurchases,
        carts,
        contactSupport,
        instagramPostLogs,
        notifications,
        sessions,
        shopifyStores,
        subscriptions,
        transactions,
        pointRules,
        storeReferralCodes,
        approvedProducts,
        referrals,
      },
    });
  } catch (error) {
    console.error("Store restore error:", error);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}
