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
 * This is IRREVERSIBLE — there is no backup. Admin/developer only.
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

    // ── 1. Best-effort Shopify removal for any synced products ──
    //    We only need the products that are linked to Shopify so we can remove
    //    them there before wiping them from the DB.
    const shopifyProducts = await Product.find({
      userId,
      shopifyProductId: { $exists: true, $ne: "" },
    })
      .select("shopifyProductId")
      .lean();
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

    // ── 2. Cascade delete every related collection, then the user ──
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
