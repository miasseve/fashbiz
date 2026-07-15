import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import { deleteShopifyProduct } from "@/actions/shopifyAction";

// Models — every collection that references a user is cleaned up here so a
// deleted user leaves no orphaned data behind.
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
// NOTE: UserSubscription is intentionally NOT imported. In this codebase both
// models/Subscription.js and models/UserSubscription.js register under the same
// mongoose model name ("Subscription") and therefore share the ONE "subscriptions"
// collection — importing both would double-query and duplicate the backup data.
import PointRule from "@/models/PointRule";
import StoreReferralCode from "@/models/StoreReferralCode";
import ApprovedProduct from "@/models/ApprovedProduct";
import Referral from "@/models/Referral";

/**
 * DELETE /api/admin/users/:userId
 *
 * HARD-deletes a user and cascades to every collection that references them.
 * Products are also removed from Shopify (best-effort — a Shopify failure does
 * NOT block the DB deletion).
 *
 * Before deleting, a full snapshot of the user + all their related documents is
 * assembled and returned as `backup` so the admin UI can download a recovery
 * file. The password hash is deliberately excluded from the snapshot.
 *
 * This is IRREVERSIBLE in the database. Admin/developer only.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "developer")
    ) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { userId } = await params;

    // Guard: an admin cannot delete their own account from this screen.
    if (userId === session.user.id) {
      return json({ error: "You cannot delete your own account." }, 400);
    }

    await dbConnect();

    const user = await User.findById(userId).lean();
    if (!user) {
      return json({ error: "User not found." }, 404);
    }

    // Guard: never allow deleting admin/developer accounts through this endpoint.
    if (user.role === "admin" || user.role === "developer") {
      return json({ error: "Admin accounts cannot be deleted here." }, 403);
    }

    // ── 1. Gather everything owned by this user (for the backup snapshot
    //       and for the Shopify cleanup below) ──
    const [
      products,
      accounts,
      addOnPurchases,
      carts,
      contactSupport,
      instagramLogs,
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
      Product.find({ userId }).lean(),
      Account.find({ userId }).lean(),
      AddOnPurchase.find({ userId }).lean(),
      Cart.find({ userId }).lean(),
      ContactSupport.find({ userId }).lean(),
      InstagramPostLogs.find({ userId }).lean(),
      Notification.find({ userId }).lean(),
      Session.find({ userId }).lean(),
      ShopifyStore.find({ userId }).lean(),
      Subscription.find({ userId }).lean(),
      Transaction.find({ userId }).lean(),
      PointRule.find({ storeUserId: userId }).lean(),
      StoreReferralCode.find({ user_id: userId }).lean(),
      ApprovedProduct.find({ storeId: userId }).lean(),
      Referral.find({
        $or: [{ referredByuser_id: userId }, { referredTouser_id: userId }],
      }).lean(),
    ]);

    // Build the recovery snapshot (password intentionally stripped).
    const { password, ...safeUser } = user;
    const backup = {
      exportedAt: new Date().toISOString(),
      note: "Recovery snapshot taken immediately before deletion. Password hash omitted for security.",
      user: safeUser,
      related: {
        products,
        accounts,
        addOnPurchases,
        carts,
        contactSupport,
        instagramLogs,
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
    };

    // ── 2. Best-effort Shopify removal for any synced products ──
    const shopifyProducts = products.filter((p) => p?.shopifyProductId);
    let shopifyResult = { attempted: shopifyProducts.length, error: null };
    if (shopifyProducts.length > 0) {
      try {
        await deleteShopifyProduct(shopifyProducts);
      } catch (err) {
        // Don't block the DB deletion if Shopify is unreachable.
        console.error("Shopify cleanup during user delete failed:", err);
        shopifyResult.error = err?.message || "Shopify cleanup failed";
      }
    }

    // ── 3. Cascade delete every related collection, then the user ──
    const deletions = await Promise.all([
      Product.deleteMany({ userId }),
      Account.deleteMany({ userId }),
      ActiveUser.deleteMany({ userId }),
      AddOnPurchase.deleteMany({ userId }),
      Cart.deleteMany({ userId }),
      ContactSupport.deleteMany({ userId }),
      InstagramPostLogs.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Session.deleteMany({ userId }),
      ShopifyStore.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      Transaction.deleteMany({ userId }),
      PointRule.deleteMany({ storeUserId: userId }),
      StoreReferralCode.deleteMany({ user_id: userId }),
      ApprovedProduct.deleteMany({ storeId: userId }),
      Referral.deleteMany({
        $or: [{ referredByuser_id: userId }, { referredTouser_id: userId }],
      }),
    ]);

    await User.deleteOne({ _id: userId });

    const [
      dProducts,
      dAccounts,
      dActiveUsers,
      dAddOns,
      dCarts,
      dSupport,
      dInstagram,
      dNotifications,
      dSessions,
      dShopifyStores,
      dSubscriptions,
      dTransactions,
      dPointRules,
      dStoreRefCodes,
      dApproved,
      dReferrals,
    ] = deletions;

    return json(
      {
        success: true,
        message: `Deleted ${user.firstname} ${user.lastname} and all associated data.`,
        backup,
        summary: {
          user: 1,
          products: dProducts.deletedCount,
          accounts: dAccounts.deletedCount,
          activeUsers: dActiveUsers.deletedCount,
          addOnPurchases: dAddOns.deletedCount,
          carts: dCarts.deletedCount,
          contactSupport: dSupport.deletedCount,
          instagramLogs: dInstagram.deletedCount,
          notifications: dNotifications.deletedCount,
          sessions: dSessions.deletedCount,
          shopifyStores: dShopifyStores.deletedCount,
          subscriptions: dSubscriptions.deletedCount,
          transactions: dTransactions.deletedCount,
          pointRules: dPointRules.deletedCount,
          storeReferralCodes: dStoreRefCodes.deletedCount,
          approvedProducts: dApproved.deletedCount,
          referrals: dReferrals.deletedCount,
          shopify: shopifyResult,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Admin user delete error:", error);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
