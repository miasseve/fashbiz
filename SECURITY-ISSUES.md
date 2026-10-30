# Open security issues

Issues found during development that are **not** fixed by the change that found them, recorded
here so they don't get lost. Each one should become a task on the board.

Fixed issues are removed from this file — git history is the record.

---

## 1. `storeId` is taken from the request body on the AI analyse endpoints

**Found:** 2026-10-30, while planning the per-store collection work (Phase B).
**Severity:** Medium — cross-tenant read of approved-listing data.
**Status:** Open. Deliberately **not** fixed as part of Phase B, because changing it silently
alters similarity-search behaviour for every existing store, which is a different change than the
one Phase B was asked for.

### What it is

`src/app/api/ai/analyze-product/route.js` calls `auth()` and then **discards the result**:

```js
try { await auth(); } catch {}                              // result unused
const { imageUrl, imageUrls, storeId } = await req.json();  // storeId from the BODY
const result = await analyzeProductImages(urls, storeId);
```

`storeId` is the store owner's user id, sent from the browser
(`src/app/dashboard/add-product/components/SecondStep.jsx` → `storeId: user.id`). Nothing checks
that it belongs to the caller.

### Why it matters

`storeId` flows into `retrieveSimilarProducts(queryText, storeId, category, 5)`
(`src/lib/embeddings.js`), where it drives the same-store relevance boost and is returned in
`_meta.rawAiOutput` / the similar-example set. A caller who passes another store's id gets that
store's approved listings used as the style reference for their own listing — titles, tag
conventions, brands and descriptions from a competitor's catalogue.

It is not a credential leak and not a write, which is why it is Medium rather than High.

### What it is **not**

Phase B does **not** use this value for collections. `getStoreCollectionsForUser()` is handed a
**session-derived** `ownerUserId` instead, precisely so a store's category structure can't be read
by passing someone else's id. The body `storeId` keeps its existing, unchanged meaning.

### Fix

Derive the store from the session in the route and ignore the body value:

```js
const session = await auth();
const storeId = session?.user?.id;   // body value ignored entirely
```

Then confirm the guest/try-free path still works — `analyzeProductImages` already treats a missing
`storeId` as "no similarity search", so an unauthenticated caller degrades correctly. Check both
callers: `/api/ai/analyze-product` and `/api/public/analyze-product` (the public one already
passes `undefined` and is fine).

---

## 2. A failed token decrypt silently falls back to the base store

**Found:** 2026-10-30, while testing Phase A against the dev stores.
**Severity:** Medium — silent cross-store misrouting of products.
**Status:** Open.

### What it is

`resolveStoreForUser()` (`src/lib/shopifyStoreResolver.js:63-72`) catches a decrypt failure,
logs one line, and returns the **base store** config:

```js
try { accessToken = decrypt(store.accessToken); }
catch (decryptError) {
  console.error(`[shopifyStoreResolver] Failed to decrypt access token for ${store.storeDomain} …`);
  return envFallbackConfig();      // ← the BASE store
}
```

So a store that *is* connected, but whose token can't be decrypted, has its products created,
updated and deleted on the **shared base store** instead of its own — visible only as a console
line that nobody is watching.

### How it was found

Two of three connected dev stores (`lestoredevtest12`, `lestoredevtesting`, both connected in
October) fail to decrypt with the local `.env` `REFERRAL_SECRET_KEY`; the September one
(`cph-test-zdjh3fq2`) succeeds. Production decrypts all of them, so nothing is currently broken
there — this was an environment-key mismatch, not a data problem.

### Why it matters anyway

The failure mode is the hazard, not this instance of it. If `REFERRAL_SECRET_KEY` is ever rotated
without re-encrypting the stored tokens, **every** connected store silently starts writing to the
base store. There is no alert, no status change on the `ShopifyStore` row, and no user-visible
symptom until someone notices products in the wrong shop.

### Fix options

- Mark the row (`status: "error"`, `lastConnectionError: "token decrypt failed"`) so the admin
  Shopify-connections screen surfaces it, instead of only logging.
- Decide explicitly whether a decrypt failure should fall back at all, or refuse the write. For a
  *delete*, falling back to the base store is the worst case — it can delete nothing, or the wrong
  thing.
- Phase A's `getStoreCollectionsForUser()` already takes the safe path here: it returns `[]`
  rather than the base store's collections. The product write paths do not.
