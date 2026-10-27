import dbConnect from "@/lib/db";
import ShopifyStore from "@/models/ShopifyStore";
import { decrypt } from "@/actions/encryption";
import { SHOPIFY_OAUTH_API_VERSION } from "@/lib/shopifyOAuth";

// API version the shared base-store client has always used. Kept as a named
// constant here (rather than reaching into shopifyAction.js) so this module
// has no dependency on shopifyAction.js and can't be affected by changes
// there — this file only decides WHICH store/credentials to use, never HOW
// to call Shopify.
const ENV_STORE_API_VERSION = "2024-10";

function envFallbackConfig() {
  return {
    source: "env",
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
    accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: ENV_STORE_API_VERSION,
  };
}

/**
 * Resolves which Shopify store a product action for this user should target.
 *
 * Returns the store owner's own OAuth-connected Shopify (when one exists and
 * is active) so callers can route product sync there instead of the shared
 * base store — WITHOUT those callers needing to know anything about
 * ShopifyStore, encryption, or connection state themselves.
 *
 * Falls back to the existing env-based base-store config for every other
 * case: no userId, no matching row, or a row that fails to decrypt. This
 * function never throws — a resolution problem degrades to "use the base
 * store," it never blocks product creation.
 *
 * isBaseStore rows are never returned from the OAuth branch: they are
 * user-less by convention (userId: null), so a lookup scoped to a specific
 * userId already excludes them, and the query also excludes them explicitly
 * as a second guard.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ source: "oauth"|"env", storeDomain: string, accessToken: string, apiVersion: string }>}
 */
export async function resolveStoreForUser(userId) {
  if (!userId) {
    return envFallbackConfig();
  }

  try {
    await dbConnect();

    const store = await ShopifyStore.findOne({
      userId,
      connectedVia: "oauth",
      status: "connected",
      isActive: { $ne: false },
      isBaseStore: { $ne: true },
    }).lean();

    if (!store) {
      return envFallbackConfig();
    }

    let accessToken;
    try {
      accessToken = decrypt(store.accessToken);
    } catch (decryptError) {
      console.error(
        `[shopifyStoreResolver] Failed to decrypt access token for ${store.storeDomain} — falling back to base store`,
        decryptError.message
      );
      return envFallbackConfig();
    }

    return {
      source: "oauth",
      storeDomain: store.storeDomain,
      accessToken,
      apiVersion: SHOPIFY_OAUTH_API_VERSION,
    };
  } catch (error) {
    console.error(
      "[shopifyStoreResolver] Resolution failed — falling back to base store:",
      error.message
    );
    return envFallbackConfig();
  }
}
