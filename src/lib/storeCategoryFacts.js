import { getStoreProductFacts } from "@/actions/shopifyAction";

/**
 * What is actually inside each of a store's categories, and how that store
 * spells its own product types.
 *
 * Both answers come from one pass over the store's catalogue, because both are
 * needed for the same reason: a store's own words are the only trustworthy
 * description of its categories. A category's title and handle are not —
 * handles contradict their contents on a real store (the category titled
 * "PRADA" has the handle "skjorter", "shirts"), and two categories can share a
 * title. So "mostly jakke · 87 products" is what lets a person, and the model,
 * tell two categories called "Jakker" apart.
 *
 * ── Why this never blocks an upload ──
 *
 * The read walks the catalogue in pages (a 600-product store is three calls).
 * Product creation runs in a server action invoked from a page route, which is
 * outside the raised function timeout in vercel.json, so spending that budget
 * before the model is even asked would both slow every upload and risk the
 * invocation being killed. So: a cold cache serves nothing, the upload shows
 * category names alone, and the read is kicked off for the next upload. The
 * spec allows exactly that ("the row shows the category's name on its own —
 * never a handle").
 *
 * This is the one deliberate deviation from the approved spec's D3, which said
 * to reuse the 10-minute collection cache. Recorded in the plan as P2 and in
 * the spec's §13.
 */

// Contents change far more slowly than the collection list does (a shop adds a
// garment; it does not re-theme its categories), so this is cached for much
// longer than the 10-minute collection cache and is refreshed off the request.
const TTL_MS = 60 * 60 * 1000;

// storeDomain -> { at: number, digest: object }
const cache = new Map();
// storeDomain -> Promise, so N uploads arriving together trigger one read.
const inFlight = new Map();

/** Clears the digest for one store, or all of them when no domain is given. */
export function invalidateStoreCategoryFacts(storeDomain) {
  if (storeDomain) cache.delete(storeDomain);
  else cache.clear();
}

/**
 * How many of a category's products must share one product type before we
 * describe the category by it. Below this the category is genuinely mixed, and
 * naming one type would describe it wrongly — worse than saying nothing.
 */
const DOMINANT_SHARE = 0.4;

function buildDigest(facts) {
  // collection id -> { seen: number, types: Map(exact spelling -> count) }
  const byCollection = new Map();
  const typeCounts = new Map(); // store-wide: exact spelling -> count

  for (const fact of facts) {
    // Coerced rather than trusted: this is the only place a surprising value
    // from Shopify could reach, and a throw here would cost the whole digest.
    const type = String(fact?.productType ?? "").trim();

    if (type) {
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    for (const collectionId of Array.isArray(fact?.collectionIds)
      ? fact.collectionIds
      : []) {
      let entry = byCollection.get(collectionId);
      if (!entry) {
        entry = { seen: 0, types: new Map() };
        byCollection.set(collectionId, entry);
      }
      // Counted whether or not it has a type — a product with no product_type
      // is still a product in that category.
      entry.seen += 1;
      if (type) entry.types.set(type, (entry.types.get(type) || 0) + 1);
    }
  }

  // Per category: how many of its products we saw, and the dominant type in the
  // store's own spelling — but only when one type really does dominate. The
  // share is measured against everything in the category, so a category where
  // most products have no type at all reads as "mixed" rather than being
  // described by the handful that do.
  const categories = {};
  for (const [collectionId, entry] of byCollection) {
    let topType = "";
    let topCount = 0;
    for (const [type, count] of entry.types) {
      if (count > topCount) {
        topType = type;
        topCount = count;
      }
    }
    categories[collectionId] = {
      productsSeen: entry.seen,
      dominantType:
        topCount / Math.max(entry.seen, 1) >= DOMINANT_SHARE ? topType : "",
    };
  }

  // Store-wide spelling lookup: lowercased type -> the spelling this store uses
  // most often for it. This is what gets written back to Shopify, so their
  // storefront filters keep matching — including a typo of theirs, and their
  // own choice between "t-shirt" and "T-shirt".
  const spellings = {};
  const bestCount = new Map();
  for (const [spelling, count] of typeCounts) {
    const key = spelling.toLowerCase();
    if (!bestCount.has(key) || count > bestCount.get(key)) {
      bestCount.set(key, count);
      spellings[key] = spelling;
    }
  }

  return { categories, spellings, productsSeen: facts.length };
}

/**
 * Returns the digest for a store, or `null` when there isn't one yet.
 *
 * Never awaits a cold read — see the note at the top of this file. A caller
 * that gets `null` must behave as if it knows nothing about the store's
 * contents, which is always a supported state.
 *
 * @param {object} storeConfig  a resolved store config (needs storeDomain)
 * @returns {{ categories: object, spellings: object, productsSeen: number } | null}
 */
export function getStoreCategoryFacts(storeConfig) {
  const key = storeConfig?.storeDomain;
  if (!key) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.digest;

  // Cold or stale: answer now with nothing, and warm it for next time.
  warmStoreCategoryFacts(storeConfig);
  return hit?.digest ?? null;
}

/**
 * Starts the read for a store if one isn't already running. Returns the
 * in-flight promise so a caller that genuinely wants to wait (a script, a test)
 * can — the upload path never does.
 */
export function warmStoreCategoryFacts(storeConfig) {
  const key = storeConfig?.storeDomain;
  if (!key) return Promise.resolve(null);
  if (inFlight.has(key)) return inFlight.get(key);

  const run = (async () => {
    try {
      const facts = await getStoreProductFacts(storeConfig);
      // An empty result is either an empty shop or a failed read, and
      // getStoreProductFacts logs the reason for both. Don't cache it — the
      // next upload should retry rather than be stuck with nothing for an hour.
      if (!facts.length) return null;
      const digest = buildDigest(facts);
      cache.set(key, { at: Date.now(), digest });
      return digest;
    } catch (error) {
      // getStoreProductFacts already swallows its own failures; this is belt
      // to the braces, because nothing here may ever reject into an upload.
      console.error(
        `[store-category-facts] Could not build the digest for ${key}:`,
        error.message
      );
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, run);
  return run;
}

/**
 * A short, honest description of what is inside one category, in the store's
 * own words — e.g. `mostly jakke · 87 products`. Empty string when we can't
 * say, in which case callers show the category's name on its own.
 */
export function describeCategoryContents(digest, collectionId) {
  const entry = digest?.categories?.[collectionId];
  if (!entry) return "";
  if (!entry.productsSeen) return "no products yet";

  const count = `${entry.productsSeen} product${entry.productsSeen === 1 ? "" : "s"}`;
  return entry.dominantType
    ? `mostly ${entry.dominantType} · ${count}`
    : `mixed · ${count}`;
}

/**
 * The store's own spelling for a product type, or "" when they have never used
 * it. Matched case-insensitively, returned exactly as they write it.
 *
 * Only settles a difference in CASE — "T-shirt" vs "t-shirt". It cannot bridge
 * a difference in wording or language, which is what
 * `storeTypeForCollection` is for.
 */
export function storeSpellingForType(digest, type) {
  const key = (type || "").trim().toLowerCase();
  if (!key) return "";
  return digest?.spellings?.[key] || "";
}

/**
 * The product type the store itself uses for the things in one of its
 * categories, exactly as they spell it — or "" when we can't say.
 *
 * This is the one that actually matters, because a store's words are usually
 * not ours. Our own taxonomy would write "Accessories"; the store writes
 * `accesories` (their typo, on 71 products) and their storefront filters are
 * case-sensitive, so our spelling creates a second, empty filter beside theirs.
 * A case-insensitive match can't get from "Accessories" to `accesories`, and
 * nothing could get from "Jackets" to `jakke`. What does work is the category
 * the owner picked: whatever that category is full of is what they call these,
 * so that is what we write back.
 */
export function storeTypeForCollection(digest, collectionId) {
  if (!collectionId) return "";
  return digest?.categories?.[collectionId]?.dominantType || "";
}
