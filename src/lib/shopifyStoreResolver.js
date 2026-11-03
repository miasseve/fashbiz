import dbConnect from "@/lib/db";
import ShopifyStore from "@/models/ShopifyStore";
import { decrypt, encrypt } from "@/actions/encryption";
import { SHOPIFY_OAUTH_API_VERSION } from "@/lib/shopifyOAuth";
import {
  requestClientCredentialsToken,
  tokenNeedsRenewal,
} from "@/lib/shopifyClientCredentials";

// API version the shared base-store client has always used. Kept as a named
// constant here (rather than reaching into shopifyAction.js) so this module
// has no dependency on shopifyAction.js and can't be affected by changes
// there — this file only decides WHICH store/credentials to use, never HOW
// to call Shopify.
const ENV_STORE_API_VERSION = "2024-10";

// Connection types that route a store owner's products to their own Shopify.
// "manual" rows (pasted on the developer page) are deliberately not here.
export const OWN_STORE_CONNECTION_TYPES = ["oauth", "client_credentials"];

function envFallbackConfig() {
  return {
    source: "env",
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
    accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: ENV_STORE_API_VERSION,
    // Always empty for the base store: the exclusion list is a per-store
    // setting, and the base store is never the source of a storeCollection.
    excludedCollectionIds: [],
    defaultLocationId: null,
    sizeInTitle: false,
  };
}

// The owner HAS their own store connected, but it can't be used right now
// (disconnected, app removed, token can't be decrypted or renewed). Callers
// must stop here — never send this owner's products to the base store.
function unavailableConfig(store, reason) {
  return {
    source: "oauth-unavailable",
    storeDomain: store.storeDomain,
    reason,
  };
}

/**
 * Returns a valid access token for a "client_credentials" row, renewing it
 * (and saving the new one) when it is about to expire. Throws when no valid
 * token can be had; marks the row failed when Shopify refuses the app.
 */
async function ensureClientCredentialsToken(store) {
  const currentToken = store.accessToken ? decrypt(store.accessToken) : null;
  if (currentToken && !tokenNeedsRenewal(store.tokenExpiresAt)) {
    return currentToken;
  }

  try {
    const { accessToken, scope, expiresAt } = await requestClientCredentialsToken({
      shopDomain: store.storeDomain,
      clientId: store.appClientId,
      clientSecret: decrypt(store.apiSecret),
    });

    await ShopifyStore.updateOne(
      { _id: store._id },
      {
        $set: {
          accessToken: encrypt(accessToken),
          tokenExpiresAt: expiresAt,
          grantedScopes: scope || store.grantedScopes || "",
          lastConnectionError: "",
        },
      }
    );
    console.log(`[shopifyStoreResolver] Renewed access token for ${store.storeDomain}`);
    return accessToken;
  } catch (renewError) {
    console.error(
      `[shopifyStoreResolver] Token renewal failed for ${store.storeDomain}:`,
      renewError.message
    );

    await ShopifyStore.updateOne(
      { _id: store._id },
      {
        $set: {
          lastConnectionError: renewError.message,
          ...(renewError.permanent ? { status: "failed" } : {}),
        },
      }
    ).catch(() => {});

    // A short network problem must not stop uploads while the old token
    // still works.
    const stillValid =
      currentToken &&
      store.tokenExpiresAt &&
      new Date(store.tokenExpiresAt).getTime() > Date.now();
    if (stillValid && !renewError.permanent) return currentToken;

    throw renewError;
  }
}

/**
 * Resolves which Shopify store a product action for this user should target.
 *
 *   - no own-store connection          -> the env base store ("env"), as before
 *   - own store connected and usable   -> that store ("oauth"; also used for
 *                                          "client_credentials" rows, so every
 *                                          caller treats both the same)
 *   - own store connected but unusable -> "oauth-unavailable": callers must
 *                                          stop, NOT fall back to the base store
 *
 * Never throws.
 *
 * isBaseStore rows are never returned from the own-store branch: they are
 * user-less by convention (userId: null), so a lookup scoped to a specific
 * userId already excludes them, and the query also excludes them explicitly
 * as a second guard.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ source: "oauth"|"oauth-unavailable"|"env", storeDomain: string, accessToken?: string, apiVersion?: string, excludedCollectionIds?: string[], defaultLocationId?: string|null, sizeInTitle?: boolean, reason?: string }>}
 */
export async function resolveStoreForUser(userId) {
  if (!userId) {
    return envFallbackConfig();
  }

  try {
    await dbConnect();

    const store = await ShopifyStore.findOne({
      userId,
      connectedVia: { $in: OWN_STORE_CONNECTION_TYPES },
      isBaseStore: { $ne: true },
    }).lean();

    if (!store) {
      return envFallbackConfig();
    }

    if (store.status !== "connected" || store.isActive === false) {
      return unavailableConfig(
        store,
        store.lastConnectionError || `connection status is ${store.status}`
      );
    }

    let accessToken;
    try {
      accessToken =
        store.connectedVia === "client_credentials"
          ? await ensureClientCredentialsToken(store)
          : decrypt(store.accessToken);
    } catch (tokenError) {
      console.error(
        `[shopifyStoreResolver] No usable access token for ${store.storeDomain} — blocking, not falling back to the base store`,
        tokenError.message
      );
      return unavailableConfig(store, tokenError.message);
    }

    return {
      source: "oauth",
      storeDomain: store.storeDomain,
      accessToken,
      apiVersion: SHOPIFY_OAUTH_API_VERSION,
      // Collections the AI must never be offered for this store — see
      // ShopifyStore.aiExcludedCollectionIds.
      excludedCollectionIds: Array.isArray(store.aiExcludedCollectionIds)
        ? store.aiExcludedCollectionIds
        : [],
      defaultLocationId: store.defaultLocationId || null,
      sizeInTitle: store.sizeInTitle === true,
    };
  } catch (error) {
    console.error(
      "[shopifyStoreResolver] Resolution failed — falling back to base store:",
      error.message
    );
    return envFallbackConfig();
  }
}

/**
 * Convenience wrapper that returns a storeConfig suitable to hand straight to
 * the Shopify action helpers (createShopifyProduct, updateShopifyProduct,
 * deleteShopifyProduct, ...), exactly as createProduct builds it:
 *
 *   - a usable own-store connection -> the resolved config
 *   - anything else (no userId, no connection, unusable connection) -> undefined
 *
 * Passing `undefined` makes those helpers take their byte-identical base-store
 * path (buildShopifyClient's no-storeConfig branch). Callers that CREATE
 * products must check resolveStoreForUser for "oauth-unavailable" first, so a
 * connected store's products are never created on the base store.
 *
 * @param {string|mongoose.Types.ObjectId} userId  the product OWNER's id
 * @returns {Promise<object|undefined>}
 */
export async function resolveStoreConfigForUser(userId) {
  const resolved = await resolveStoreForUser(userId);
  return resolved?.source === "oauth" ? resolved : undefined;
}
