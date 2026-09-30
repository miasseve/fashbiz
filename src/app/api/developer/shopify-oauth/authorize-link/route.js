import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createShopifyAuthorizeUrl, normalizeShopDomain } from "@/lib/shopifyOAuth";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/developer/shopify-oauth/authorize-link
 *
 * Admin/developer-only helper that mints a Shopify authorization link for a
 * store owner. This stands in for the admin UI, which comes later.
 *
 * Body: { userId, shopDomain }
 * Returns: { url, shopDomain, expiresAt, user }
 */
export async function POST(request) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    if (!session || (role !== "admin" && role !== "developer")) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be JSON" }, 400);
    }

    const { userId, shopDomain } = body || {};

    if (!userId || !shopDomain) {
      return json({ error: "userId and shopDomain are required" }, 400);
    }

    const normalizedShop = normalizeShopDomain(shopDomain);
    if (!normalizedShop) {
      return json(
        {
          error:
            "shopDomain must be a valid Shopify domain, e.g. your-store.myshopify.com",
        },
        400
      );
    }

    await dbConnect();

    const targetUser = await User.findById(userId)
      .select("_id email storename role")
      .lean()
      .catch(() => null);

    if (!targetUser) {
      return json({ error: "No user found with that userId" }, 404);
    }

    // Guard against wiring a Shopify store to an admin/consignor account by mistake.
    if (targetUser.role !== "store") {
      return json(
        {
          error: `User ${targetUser.email} has role "${targetUser.role}" — a Shopify connection can only be issued for a store owner (role "store").`,
        },
        400
      );
    }

    const { url, expiresAt } = await createShopifyAuthorizeUrl({
      userId: targetUser._id,
      shopDomain: normalizedShop,
      issuedByUserId: session.user.id,
    });

    return json(
      {
        url,
        shopDomain: normalizedShop,
        expiresAt,
        user: {
          id: String(targetUser._id),
          email: targetUser.email,
          storename: targetUser.storename || "",
        },
      },
      200
    );
  } catch (error) {
    console.error("Shopify authorize-link error:", error.message);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}
