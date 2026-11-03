import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ShopifyStore from "@/models/ShopifyStore";
import { encrypt } from "@/actions/encryption";
import { normalizeShopDomain } from "@/lib/shopifyOAuth";
import { requestClientCredentialsToken } from "@/lib/shopifyClientCredentials";
import { registerWebhooksForStore } from "@/actions/shopifyOAuthWebhooks";
import { invalidateStoreCollections } from "@/lib/storeCollections";
import { invalidateStoreCategoryFacts } from "@/lib/storeCategoryFacts";
import { isUnclaimedEmail } from "@/lib/storeMatching";

// Scopes the code needs on a connected store. Anything missing is reported
// back to the admin so it can be fixed in the store's app before testing.
const REQUIRED_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_locations",
  "read_orders",
  "read_publications",
  "write_publications",
];

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

// Shopify reports write_x without read_x when both were granted.
function missingScopes(granted) {
  const have = new Set(
    String(granted || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  for (const scope of [...have]) {
    if (scope.startsWith("write_")) have.add(`read_${scope.slice(6)}`);
  }
  return REQUIRED_SCOPES.filter((s) => !have.has(s));
}

/**
 * POST /api/admin/shopify-connections/credentials
 *
 * Connects a store that created its OWN app in its Shopify Dev Dashboard
 * (connectedVia "client_credentials"). Gets a token with the app's Client ID
 * and Secret first — nothing is saved unless Shopify accepts them — then
 * saves the connection and registers the webhooks.
 *
 * Also used to reconnect, or to replace a rotated secret.
 *
 * Body: { userId, shopDomain, clientId, clientSecret }
 * The secret and the token are never returned or logged.
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

    const userId = String(body?.userId || "").trim();
    const clientId = String(body?.clientId || "").trim();
    const clientSecret = String(body?.clientSecret || "").trim();
    const shopDomain = normalizeShopDomain(body?.shopDomain || "");

    if (!userId || !clientId || !clientSecret) {
      return json(
        { error: "Please choose a store owner and enter the Client ID and Client Secret." },
        400
      );
    }
    if (!shopDomain) {
      return json({ error: "The shop domain must look like your-store.myshopify.com" }, 400);
    }

    await dbConnect();

    const targetUser = await User.findById(userId)
      .select("_id email role")
      .lean()
      .catch(() => null);
    if (!targetUser) return json({ error: "That store owner could not be found." }, 404);
    if (targetUser.role !== "store") {
      return json(
        { error: `${targetUser.email} has the role "${targetUser.role}". A Shopify connection can only be set up for a store owner.` },
        400
      );
    }
    if (isUnclaimedEmail(targetUser.email)) {
      return json({ error: "This store has not been claimed by its owner yet." }, 400);
    }

    // Same guards as the OAuth callback: never touch the base store's record
    // or a shop that belongs to someone else.
    const existing = await ShopifyStore.findOne({ storeDomain: shopDomain })
      .select("userId isBaseStore")
      .lean();
    if (existing?.isBaseStore) {
      return json({ error: "That shop is the platform's base store and cannot be connected here." }, 409);
    }
    if (existing?.userId && String(existing.userId) !== String(targetUser._id)) {
      return json({ error: "That shop is already connected to a different leStores account." }, 409);
    }

    // One own store per owner: the resolver routes by userId.
    const otherStore = await ShopifyStore.findOne({
      userId: targetUser._id,
      storeDomain: { $ne: shopDomain },
      connectedVia: { $in: ["oauth", "client_credentials"] },
      isActive: { $ne: false },
    })
      .select("storeDomain")
      .lean();
    if (otherStore) {
      return json(
        { error: `This store owner is already connected to ${otherStore.storeDomain}. Disconnect it first.` },
        409
      );
    }

    // 1. Prove the credentials work before saving anything.
    let token;
    try {
      token = await requestClientCredentialsToken({ shopDomain, clientId, clientSecret });
    } catch (tokenError) {
      console.error(`[shopify-credentials] Token request failed for ${shopDomain}:`, tokenError.message);
      return json({ error: tokenError.message }, tokenError.permanent ? 400 : 502);
    }

    // 2. Save. apiSecret = this app's Client Secret: it renews the token and
    //    verifies this store's webhooks.
    await ShopifyStore.findOneAndUpdate(
      { storeDomain: shopDomain },
      {
        $set: {
          userId: targetUser._id,
          storeDomain: shopDomain,
          accessToken: encrypt(token.accessToken),
          apiSecret: encrypt(clientSecret),
          tokenExpiresAt: token.expiresAt,
          isBaseStore: false,
          isActive: true,
          status: "connected",
          connectedVia: "client_credentials",
          appClientId: clientId,
          grantedScopes: token.scope || "",
          connectedAt: new Date(),
          lastConnectionError: "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    invalidateStoreCollections(shopDomain);
    invalidateStoreCategoryFacts(shopDomain);

    console.log(
      `[shopify-credentials] Connected ${shopDomain} for user ${targetUser._id} by ${session.user.id} (scopes: ${token.scope || "none reported"})`
    );

    // 3. Webhooks — reported, never fatal.
    let webhooks;
    try {
      webhooks = await registerWebhooksForStore({ shopDomain, accessToken: token.accessToken });
    } catch (webhookError) {
      webhooks = { skipped: true, reason: webhookError.message, results: [] };
    }

    return json(
      {
        message: `${shopDomain} is connected.`,
        shopDomain,
        grantedScopes: token.scope || "",
        missingScopes: missingScopes(token.scope),
        tokenExpiresAt: token.expiresAt,
        webhooks: webhooks.skipped
          ? { skipped: true, reason: webhooks.reason }
          : webhooks.results.map((r) => ({ topic: r.topic, status: r.status, error: r.error || null })),
      },
      200
    );
  } catch (error) {
    console.error("[shopify-credentials] POST error:", error.message);
    return json({ error: "Something went wrong" }, 500);
  }
}
