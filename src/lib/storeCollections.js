import { getAllCollections } from "@/actions/shopifyAction";
import { resolveStoreConfigForUser } from "@/lib/shopifyStoreResolver";

/**
 * Reads a store's own Shopify collections, so a product can be placed in the
 * categories that store actually uses instead of only our shared taxonomy.
 *
 * IMPORTANT — this never replaces `src/lib/taxonomy.js`. CATEGORIES /
 * SUBCATEGORIES are shared by every store and drive the vector-search
 * pre-filter, the price-history query, points and size normalization. A
 * store's collections are an ADDITIONAL field used only for Shopify
 * placement. See docs/cph-category-mapping.md §6.0.
 */

// Collections change rarely (a shop adds a category now and then), but
// analyze-product runs on every upload, so re-listing them per request would
// spend a Shopify call for a result that is almost always identical.
// Per-instance and deliberately small: a stale entry costs at most one upload
// placed without a brand-new collection, and the TTL clears it.
const TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // storeDomain -> { at: number, collections: [] }

/** Clears the cache for one store, or all of them when no domain is given. */
export function invalidateStoreCollections(storeDomain) {
  if (storeDomain) cache.delete(storeDomain);
  else cache.clear();
}

/**
 * A manual collection is one Shopify reports with `ruleSet: null`. That is the
 * only dependable signal, and it decides how we may write to the collection:
 *
 *   - manual     -> a product must be added explicitly (collectionAddProducts)
 *   - automated  -> the rules populate it; writing to it is rejected by Shopify
 *
 * A collection we have not fetched `ruleSet` for returns `null` (unknown)
 * rather than a guess, so a caller can refuse to write instead of assuming.
 */
export function isManualCollection(collection) {
  if (!collection || !("ruleSet" in collection)) return null;
  return collection.ruleSet === null || collection.ruleSet === undefined;
}

/**
 * Lists the collections on the store belonging to `userId`.
 *
 * Returns `[]` for a user with no OAuth-connected Shopify — the caller then
 * behaves exactly as it does today, which is what keeps every existing store
 * unaffected. It never throws: a Shopify or resolution failure degrades to an
 * empty list.
 *
 * ⚠️ THIS FUNCTION DOES NO AUTHORIZATION. It returns the collection structure
 * of whichever store `userId` owns, and trusts the caller to have earned that
 * id. The only caller today is the admin-gated route, which is fine. When the
 * upload path (analyze-product) starts calling this, take `userId` from the
 * SESSION — never from the request body or a query parameter — or any user
 * becomes able to read another store's categories by passing their id.
 *
 * @param {string|mongoose.Types.ObjectId} userId  the store OWNER's id
 * @param {{ force?: boolean }} [options]  force skips the cache
 * @returns {Promise<Array<{ id, title, handle, description, updatedAt, sortOrder, productsCount, ruleSet, isManual }>>}
 */
export async function getStoreCollectionsForUser(userId, options = {}) {
  if (!userId) return [];

  let storeConfig;
  try {
    storeConfig = await resolveStoreConfigForUser(userId);
  } catch (error) {
    console.error(
      "[storeCollections] Could not resolve a store for this user:",
      error.message
    );
    return [];
  }

  // No connected store of their own. Deliberately NOT falling back to the base
  // store: listing the base store's collections to another store's uploader
  // would place their product in categories that aren't theirs.
  if (!storeConfig?.storeDomain) return [];

  const key = storeConfig.storeDomain;
  const hit = cache.get(key);
  if (!options.force && hit && Date.now() - hit.at < TTL_MS) {
    return hit.collections;
  }

  const raw = await getAllCollections(storeConfig);

  // An empty result is either a store with no collections or a failed fetch
  // (getAllCollections logs and returns [] for both). Don't cache it — the next
  // upload should retry rather than be stuck with [] for the whole TTL.
  if (!raw.length) return [];

  const collections = raw.map((c) => ({
    ...c,
    productsCount: c.productsCount?.count ?? null,
    isManual: isManualCollection(c),
  }));

  cache.set(key, { at: Date.now(), collections });
  return collections;
}
