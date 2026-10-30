import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getStoreCollectionsForUser } from "@/lib/storeCollections";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user.role !== "admin" && session.user.role !== "developer")) {
    return null;
  }
  return session;
}

/**
 * GET /api/admin/shopify/collections?userId=<store owner's id>[&force=1]
 *
 * Reads back the collections on that store's own connected Shopify, with
 * Shopify's `ruleSet` resolved into `isManual`.
 *
 * This is how we verify a connection end to end before handing a store the
 * connect link, and how the smart-vs-manual question in
 * CPH-CATEGORY-MAPPING.md §7 gets settled the moment a store connects:
 * `ruleSet` is not exposed on the public storefront API, only here.
 *
 * Admin/developer only — it reports another store's category structure.
 */
export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const force = searchParams.get("force") === "1";

    if (!userId) return json({ error: "userId is required" }, 400);

    await dbConnect();
    const user = await User.findById(userId)
      .select("storename brandname email role")
      .lean();
    if (!user) return json({ error: "User not found" }, 404);

    // `force` already bypasses the cache read and overwrites that store's
    // entry inside the helper, so there is nothing to clear here. Calling
    // invalidateStoreCollections() with no argument would wipe EVERY store's
    // cache to refresh one — correct, but needlessly punishing every other
    // store on the instance.
    const collections = await getStoreCollectionsForUser(userId, { force });

    // An empty list means either no connected store or a failed fetch. Say
    // which, rather than returning a bare [] the caller has to guess about —
    // the server log carries Shopify's own message.
    const summary = {
      total: collections.length,
      manual: collections.filter((c) => c.isManual === true).length,
      automated: collections.filter((c) => c.isManual === false).length,
      unknown: collections.filter((c) => c.isManual === null).length,
    };

    return json({
      store: {
        id: userId,
        name: user.storename || user.brandname || user.email,
      },
      connected: collections.length > 0,
      note:
        collections.length > 0
          ? null
          : "No collections returned — either this user has no OAuth-connected Shopify, or the fetch failed. Check the server log for [shopify-collections].",
      summary,
      collections,
    });
  } catch (error) {
    console.error("Admin shopify collections error:", error);
    return json({ error: "Something went wrong" }, 500);
  }
}
