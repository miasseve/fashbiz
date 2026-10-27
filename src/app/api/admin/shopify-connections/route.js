import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ShopifyStore from "@/models/ShopifyStore";
import ShopifyOAuthState from "@/models/ShopifyOAuthState";
import { createShopifyAuthorizeUrl, normalizeShopDomain } from "@/lib/shopifyOAuth";
import { sendShopifyConnectRequestEmail } from "@/mails/shopifyConnectRequest";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "developer")) return null;
  return session;
}

function displayName(user) {
  if (!user) return "";
  return (
    user.storename ||
    user.brandname ||
    `${user.firstname || ""} ${user.lastname || ""}`.trim()
  );
}

/**
 * GET /api/admin/shopify-connections
 *
 * Lists per-store Shopify connections. Tokens are never selected or returned.
 * Rows come from two places:
 *   • ShopifyStore  — real connections (connected / failed)
 *   • ShopifyOAuthState — links sent but not yet used (pending), only for
 *     shops that don't already have a connection record.
 */
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return json({ error: "Unauthorized" }, 401);

    await dbConnect();

    // Explicit field list — accessToken/apiSecret are deliberately excluded.
    const stores = await ShopifyStore.find({ isBaseStore: { $ne: true } })
      .select("storeDomain userId status connectedVia connectedAt grantedScopes isActive updatedAt createdAt")
      .lean();

    const pendingStates = await ShopifyOAuthState.find({
      used: false,
      expiresAt: { $gt: new Date() },
    })
      .select("userId shopDomain recipientEmail expiresAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const connectedDomains = new Set(stores.map((s) => s.storeDomain));

    // Only the newest pending request per shop, and only for shops with no
    // connection record yet.
    const seenPending = new Set();
    const pendingRows = [];
    for (const state of pendingStates) {
      if (connectedDomains.has(state.shopDomain)) continue;
      if (seenPending.has(state.shopDomain)) continue;
      seenPending.add(state.shopDomain);
      pendingRows.push(state);
    }

    const userIds = [
      ...stores.map((s) => s.userId).filter(Boolean),
      ...pendingRows.map((p) => p.userId).filter(Boolean),
    ];

    const users = await User.find({ _id: { $in: userIds } })
      .select("firstname lastname storename brandname email")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const rows = [
      ...stores.map((s) => {
        const user = s.userId ? userMap[s.userId.toString()] : null;
        return {
          id: String(s._id),
          kind: "connection",
          shopDomain: s.storeDomain,
          status: s.status || "connected",
          connectedVia: s.connectedVia || "manual",
          storeName: displayName(user),
          userEmail: user?.email || "",
          userId: s.userId ? String(s.userId) : null,
          connectedAt: s.connectedAt || null,
          grantedScopes: s.grantedScopes || "",
          isActive: s.isActive !== false,
          recipientEmail: user?.email || "",
          sortDate: s.connectedAt || s.updatedAt || s.createdAt || null,
        };
      }),
      ...pendingRows.map((p) => {
        const user = p.userId ? userMap[p.userId.toString()] : null;
        return {
          id: String(p._id),
          kind: "request",
          shopDomain: p.shopDomain,
          status: "pending",
          connectedVia: "oauth",
          storeName: displayName(user),
          userEmail: user?.email || "",
          userId: p.userId ? String(p.userId) : null,
          connectedAt: null,
          grantedScopes: "",
          isActive: true,
          recipientEmail: p.recipientEmail || user?.email || "",
          linkExpiresAt: p.expiresAt,
          requestedAt: p.createdAt,
          sortDate: p.createdAt || null,
        };
      }),
    ].sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));

    return json({ connections: rows }, 200);
  } catch (error) {
    console.error("Shopify connections GET error:", error.message);
    return json({ error: "Something went wrong" }, 500);
  }
}

/**
 * POST /api/admin/shopify-connections
 *
 * Generates an authorization link for a store owner and emails it.
 * Also used by "Resend link".
 *
 * Body: { userId, shopDomain, email? }
 */
export async function POST(request) {
  try {
    const session = await requireAdmin();
    if (!session) return json({ error: "Unauthorized" }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be JSON" }, 400);
    }

    const { userId, shopDomain, email } = body || {};

    if (!userId || !shopDomain) {
      return json({ error: "Please choose a store owner and enter a shop domain." }, 400);
    }

    const normalizedShop = normalizeShopDomain(shopDomain);
    if (!normalizedShop) {
      return json(
        { error: "The shop domain must look like your-store.myshopify.com" },
        400
      );
    }

    await dbConnect();

    const targetUser = await User.findById(userId)
      .select("_id email firstname lastname storename brandname role")
      .lean()
      .catch(() => null);

    if (!targetUser) {
      return json({ error: "That store owner could not be found." }, 404);
    }

    if (targetUser.role !== "store") {
      return json(
        {
          error: `${targetUser.email} has the role "${targetUser.role}". A Shopify connection can only be set up for a store owner.`,
        },
        400
      );
    }

    // Default to the registered login email, but let the admin override it.
    const recipientEmail = (email || "").trim() || targetUser.email;
    if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      return json({ error: "Please provide a valid recipient email address." }, 400);
    }

    // Mirror the callback's guards so the admin gets told now rather than
    // after the store owner has already clicked through.
    const existing = await ShopifyStore.findOne({ storeDomain: normalizedShop })
      .select("userId isBaseStore")
      .lean();

    if (existing?.isBaseStore) {
      return json(
        { error: "That shop is the platform's base store and cannot be connected here." },
        409
      );
    }

    if (existing?.userId && String(existing.userId) !== String(targetUser._id)) {
      return json(
        { error: "That shop is already connected to a different leStores account." },
        409
      );
    }

    // Supersede any earlier unused link for this owner + shop, so only the
    // newest emailed link can be used.
    await ShopifyOAuthState.updateMany(
      { userId: targetUser._id, shopDomain: normalizedShop, used: false },
      { $set: { expiresAt: new Date() } }
    );

    const { url, expiresAt } = await createShopifyAuthorizeUrl({
      userId: targetUser._id,
      shopDomain: normalizedShop,
      issuedByUserId: session.user.id,
      recipientEmail,
    });

    try {
      await sendShopifyConnectRequestEmail({
        to: recipientEmail,
        recipientName:
          targetUser.firstname || displayName(targetUser) || "",
        shopDomain: normalizedShop,
        authorizeUrl: url,
      });
    } catch (mailError) {
      console.error(
        `[shopify-connections] Failed to email connect link for ${normalizedShop}:`,
        mailError.message
      );
      return json(
        {
          error:
            "The link was created but the email could not be sent. Please check the mail settings and try again.",
        },
        502
      );
    }

    // Deliberately not logging the URL — it carries the state token.
    console.log(
      `[shopify-connections] Connect link emailed for ${normalizedShop} (user ${targetUser._id})`
    );

    return json(
      {
        message: `Connection link sent to ${recipientEmail}`,
        shopDomain: normalizedShop,
        sentTo: recipientEmail,
        expiresAt,
      },
      200
    );
  } catch (error) {
    console.error("Shopify connections POST error:", error.message);
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}
