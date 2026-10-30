# Per-store Shopify categories — backend walkthrough

For a developer new to this area. Explains what was built, what is stored where, which
endpoints exist and why, and the end-to-end request flow.

Scope of this document: how a product ends up in the right **collection** on a store's **own**
Shopify. The surrounding product/AI pipeline is described only where this feature touches it.

---

## 1. The problem

Every store that uses the platform connects its own Shopify shop. Until this work, the AI filled
in a product's details from our **shared taxonomy** (`src/lib/taxonomy.js`) — a fixed list of
categories used by all stores alike. That taxonomy has nothing to do with the categories a
particular shop actually uses on its storefront.

Example: CPH Concept's live site navigates by Shopify **Collections** named `Jakker`, `Bukser`,
`Hættetrøjer`, `High-end – Men`, `Streetwear`. Our taxonomy knows nothing of those. So a product
synced to their shop arrived with no category — invisible from their own menu.

Three things were needed:

1. read the connected store's real collections,
2. let the AI pick one while it analyses the photos, and
3. put the product in it when the store owner saves.

---

## 2. Architecture at a glance

```
BROWSER                        OUR BACKEND                         SHOPIFY (the store's own)
───────                        ───────────                         ─────────────────────────
upload photos  ───────────▶  POST /api/ai/analyze-product
                                      │
                                      ├─ getStoreCollectionsForUser(session user)
                                      │        │
                                      │        ├─ ShopifyStore row ──▶ decrypt accessToken
                                      │        └─ GraphQL collections  ──────────▶ list + ruleSet
                                      │                                  ◀──────────
                                      ├─ build per-request schema with the collection list
                                      ├─ OpenAI vision call  ──▶ picks a ref ("c6")
                                      └─ resolve ref → { id, title, handle, isManual }
                                      │
form fields +  ◀──────────────────────┘
collection dropdown

owner edits, saves  ──────▶  createProduct() server action
                                      ├─ createShopifyProduct()      ──────────▶ product created
                                      ├─ addProductToStoreCollection() ─────────▶ added to collection
                                      └─ Product.save()  (Mongo)
```

Two separate Shopify conversations happen: one **read** during analysis, one **write** on save.

---

## 3. What is stored in the database

### 3.1 No new collection (table) was created by this work

This is the first thing people ask. The answer is: **none**. One field was added to an existing
document, and two collections that this feature depends on already existed from the earlier
per-store OAuth work (commit `cda4ca7`).

| Mongo collection | Created by | Role in this feature |
|---|---|---|
| `products` | original schema | **One new field added** — `storeCollection` |
| `shopifystores` | earlier OAuth work | Which Shopify shop belongs to which user, and the credentials |
| `shopifyoauthstates` | earlier OAuth work | One-time nonce for the connect link; not touched by this feature |

### 3.2 `products.storeCollection` — the new field

Defined in [src/models/Product.js](src/models/Product.js). An optional subdocument, `null` by
default:

```js
storeCollection: {
  type: {
    id:       { type: String },   // "gid://shopify/Collection/513548124311"
    title:    { type: String },   // "Jakker"
    handle:   { type: String },   // "jakker-1"
    isManual: { type: Boolean },  // true = manual, false = automated (smart)
  },
  required: false,
  default: null,
}
```

**What goes in:** whatever the store owner had selected in the dropdown when they pressed save —
which starts as the AI's pick and can be changed by hand.

**How it gets in:** the value travels browser → `createProduct()` → `sanitizeStoreCollection()` →
`new Product({...})`. It is **never** written straight from the request.

**Why keyed on the GID and not the title or handle:** neither is unique. One live test store has
two different collections both titled `Jakker`. On CPH's real store the collection titled `PRADA`
has the handle `skjorter` ("shirts"), and `SUPREME` has the handle `t-shirts` — the handles are
left over from renames and actively mislead. The GID is the only stable identifier.

**Important: every field here is a snapshot, not a source of truth.** The value round-trips
through the browser, so a caller can submit a well-formed GID for a collection they do not own,
with any `title`/`handle`/`isManual` they like. Anything acting on it must re-read the collection
live from the owner's own shop. `addProductToStoreCollection()` does exactly that — see §6.3.

### 3.3 `shopifystores` — the connection

Defined in [src/models/ShopifyStore.js](src/models/ShopifyStore.js).

| Field | Notes |
|---|---|
| `userId` | the store owner. `null` marks the shared base store |
| `storeDomain` | `unique: true`, lowercased — e.g. `cphconcept.myshopify.com` |
| `accessToken` | **encrypted** (AES-256-GCM, key `REFERRAL_SECRET_KEY`) |
| `apiSecret` | **encrypted**, for manual connections |
| `isBaseStore` | the shared fallback shop |
| `status` | `pending` · `connected` · `failed` |
| `connectedVia` | `oauth` · `manual` |
| `grantedScopes`, `connectedAt`, `lastConnectionError` | diagnostics |

Only a row with `connectedVia: "oauth"`, `status: "connected"`, `isActive !== false` and
`isBaseStore !== true` is used for per-store routing. Anything else falls back to the base store.

### 3.4 Shopify collections are deliberately **not** mirrored into Mongo

A reasonable instinct is to sync the store's collections into a table of our own. We do not, on
purpose:

- a merchant can add, rename or delete a collection at any moment, and a stale mirror would send
  products to a collection that no longer exists;
- `ruleSet` (manual vs automated) can be flipped in Shopify, and acting on a stale copy would
  write to a collection Shopify rejects;
- there is nothing to reconcile, so there is no sync job to get wrong.

Instead they are fetched live and held in a **10-minute in-memory cache**, keyed by
`storeDomain`, in [src/lib/storeCollections.js](src/lib/storeCollections.js). The cache is
per-server-instance and intentionally small. A stale entry costs at most one upload that did not
see a brand-new collection.

---

## 4. The one Shopify concept you must understand

A Shopify collection is either:

| Kind | Shopify reports | How a product gets in | What happens if you write to it |
|---|---|---|---|
| **Manual** (custom) | `ruleSet: null` | you add it explicitly, via `collectionAddProducts` | works |
| **Automated** (smart) | `ruleSet: { rules: [...] }` | Shopify adds it itself, by matching the rules | **rejected** |

This is not a detail — it decides the whole write strategy, and it differs per shop:

- **our base store**: every collection is automated, with `TAG EQUALS` rules. That is why product
  creation already sends `shopify_tags` — those collections fill themselves.
- **CPH Concept**: hand-maintained manual collections. Tags do nothing there; a product must be
  added explicitly.

So the code cannot hardcode either strategy. It reads `ruleSet` per collection and branches.

---

## 5. Endpoints and entry points

| Entry point | Method | Who can call it | What it does and why it exists |
|---|---|---|---|
| [`/api/developer/shopify-oauth/authorize-link`](src/app/api/developer/shopify-oauth/authorize-link/route.js) | POST | admin/developer | Mints the one-time connect link for a store. Creates a `ShopifyOAuthState` nonce with an expiry so a link can't be replayed. |
| [`/api/shopify/oauth/callback`](src/app/api/shopify/oauth/callback/route.js) | GET | Shopify | Where Shopify returns after the owner approves. Validates the nonce + HMAC, exchanges the code for an access token, encrypts it, writes the `ShopifyStore` row, and registers webhooks. |
| [`/api/admin/shopify/collections?userId=`](src/app/api/admin/shopify/collections/route.js) | GET | admin/developer | **Read-back / verification.** Returns a store's collections with `isManual` resolved, plus a manual/automated summary. `ruleSet` is not exposed on Shopify's public storefront API, so this is the only way to confirm a shop's structure before trusting it. Used to verify a connection end-to-end. |
| [`/api/ai/analyze-product`](src/app/api/ai/analyze-product/route.js) | POST | any session (guests too) | Existing endpoint. Now also returns `storeCollection` (the AI's pick) and `storeCollectionOptions` (the list for the dropdown). |
| `createProduct()` — [src/actions/productActions.js](src/actions/productActions.js) | server action | store/brand session | Existing action. Now also persists `storeCollection` and performs the Shopify placement. |
| [`/api/shopify/webhook`](src/app/api/shopify/webhook/route.js) | POST | Shopify | Existing. Handles `orders/create` (mark sold) and `inventory_levels/update`. HMAC-verified per store. |

### Supporting modules

| Module | Responsibility |
|---|---|
| [src/lib/shopifyStoreResolver.js](src/lib/shopifyStoreResolver.js) | *Which* shop and credentials to use for a user. Knows nothing about *how* to call Shopify. Never throws — degrades to the base store. |
| [src/lib/storeCollections.js](src/lib/storeCollections.js) | Reads a user's collections, caches them, classifies manual vs automated, and whitelists the value coming back from the form. |
| [src/actions/shopifyAction.js](src/actions/shopifyAction.js) | All Shopify Admin API calls. `buildShopifyClient(storeConfig)` returns a per-store client, or the shared base-store client when given nothing. |
| [src/lib/aiProductAnalysis.js](src/lib/aiProductAnalysis.js) | The OpenAI pipeline. Builds the response schema per request so the store's collections can be offered as a closed list. |

---

## 6. End-to-end flow

### 6.1 Connecting a store (once)

```
admin creates link  →  POST /api/developer/shopify-oauth/authorize-link
                          └─ ShopifyOAuthState { nonce, shopDomain, expiresAt, used:false }
owner opens link    →  Shopify consent screen
owner approves      →  GET /api/shopify/oauth/callback?code&hmac&state
                          ├─ verify nonce (unused, unexpired) + HMAC
                          ├─ exchange code → access token
                          ├─ encrypt(accessToken)
                          ├─ upsert ShopifyStore { connectedVia:"oauth", status:"connected" }
                          └─ register webhooks: ORDERS_CREATE, INVENTORY_LEVELS_UPDATE
```

### 6.2 Analysing a product (per upload)

`POST /api/ai/analyze-product`

1. **Who is the owner?** Taken from the **session** — `session.user.id`. The request body also
   carries a `storeId`, but it is browser-supplied and is *not* used for this. It keeps its
   existing meaning (similarity search) only. See `SECURITY-ISSUES.md` #1.
2. `getStoreCollectionsForUser(ownerUserId)` → resolver → decrypt token → GraphQL
   `collections(first: 250)` including `ruleSet`, `productsCount`, `sortOrder`.
   No connected shop → `[]`, and **deliberately not** the base store's collections, so one shop's
   categories are never offered to another shop's uploader.
3. **Schema is built per request.** With an empty list,
   `buildProductResponseSchema()` returns *the same object* as before the feature existed — so
   guests and unconnected stores are unchanged by identity, not by resemblance.
   With a list, one property is added:
   ```js
   store_collection_ref: { type: ["string","null"], enum: ["c1","c2",…,null] }
   ```
4. **The model answers with an opaque ref**, never a title, handle or GID. The prompt shows
   `c6 = "Jakker" ("jakker-1")`, JSON-encoded so a collection named with a quote can't break the
   list. Refs exist precisely because titles and handles are ambiguous (§3.2).
5. **The refinement pass cannot change the pick.** A second model call runs when confidence < 0.85
   to align writing style with the store's past listings. It keeps the *base* schema (no such
   property), the ref is stripped from the vision result embedded in its prompt, and the first
   pass's answer is carried forward verbatim. Style has no bearing on where a garment belongs.
6. **Ref → collection,** with two deterministic rejections: an unknown ref, and a collection whose
   title equals the product's own brand (brand placement comes from the brand field, not the
   photo — and on a shop with dozens of brand collections that is the most tempting wrong answer).
7. Response carries `storeCollection` and `storeCollectionOptions`.

### 6.3 Saving the product

`createProduct()`:

```
1. createShopifyProduct(formData, storeConfig)      → product created on the owner's shop
2. sanitizeStoreCollection(storeCollection)         → whitelist the 4 fields, require a real GID
3. addProductToStoreCollection(productId, collectionId, storeConfig)
      ├─ refuse outright if there is no storeConfig
      ├─ read the collection LIVE through the owner's client
      │     ├─ not found        → skipped (this is also the ownership check)
      │     └─ ruleSet present  → skipped (automated: it fills itself from tags)
      └─ collectionAddProducts  → added
4. new Product({ … storeCollection }).save()
```

**Step 3 can never fail the upload.** The product already exists on Shopify by then, so an error
there would be far worse than a missing collection. The function never throws — every outcome is
a returned status, logged with its reason — and the call site wraps it again. A 15-second
per-request timeout is set on these two calls only (not on the shared client, which would change
every other Shopify call in the file), because a hung connection here would leave a product on
Shopify that was never recorded in Mongo.

---

## 7. Design decisions worth knowing

**The shared taxonomy was not replaced.** `CATEGORIES`/`SUBCATEGORIES` in `src/lib/taxonomy.js`
stay exactly as they were, and `category` is still a locked enum in the AI schema. That taxonomy
is not just a dropdown — it is also the Atlas Vector Search pre-filter (`embeddings.js`), the key
for the store's price-history query (`/api/ai/suggest-price`), the basis of `calculateValueScore()`
points, and what makes size normalisation category-aware. `ApprovedProduct` embeddings are shared
across stores, so swapping in one store's collections would have broken similarity search, pricing
and points for every other store. `storeCollection` is therefore an **additional** field used only
for Shopify placement. It must never reach `buildEmbeddingText()` or the vector-search pre-filter.

**The owner id comes from the session, not the request body.** Otherwise any user could read
another store's category structure by passing their id.

**The base store is never written to on a connected store's behalf.** `addProductToStoreCollection`
refuses to run without a `storeConfig`, because a `storeCollection` can only originate from an
OAuth store — so a call arriving without one is wrong by definition.

**Removed: automatic smart-collection creation.** Product creation used to call
`findOrCreateSmartCollectionByTags()`, which created a smart collection per tag combination. It
was removed: its return value was never used, it built `appliedDisjunctively: true` (match *any*
tag) rules over generic tags like `casual`/`women`, and it wrote to the **base store** even for a
connected store's product. The base store had reached 144 collections, 123 of them generated this
way. The ~123 existing ones still auto-fill from tags, so nothing disappeared from any storefront.

---

## 8. Not done / known gaps

| Gap | Note |
|---|---|
| Changing the collection on **edit** | Only the create path places a product. Moving one also means removing it from the previous collection — larger change, out of scope. |
| Accuracy is unmeasured | No fixture test yet. It is verified that a ref resolves to one correct GID and that manual/automated branch correctly; it is **not** measured how often the AI picks the *right* collection. |
| Catch-all collections | CPH has `Nye produkter`, `Alle produkter`, `Kesi´s`, `All`, `Vores favoritter` — generic buckets the AI could wrongly pick. Not filtered. A size-based threshold was tried and rejected: catch-alls and real collections overlap in size, so no threshold separates them. |
| Men/Women | For High-end items, gender is not derivable from the photo, the brand or the data. It needs an explicit choice at upload. Not built. |
| Two open issues | `SECURITY-ISSUES.md` — body-supplied `storeId`, and the silent base-store fallback on a token decrypt failure. |

---

## 9. How to verify it works

```
GET /api/admin/shopify/collections?userId=<store owner's id>
```
Logged in as admin/developer, in the same browser. Returns `connected`, a
manual/automated/unknown summary, and every collection with its `ruleSet` and `isManual`.
An empty list means either no connected shop or a failed fetch — the server log carries the reason
under `[shopify-collections]` and `[shopifyStoreResolver]`.

Then: add a product with a collection selected, and check it appears in that collection in the
store's Shopify admin. Placement outcomes are logged under `[collection]`.

Related reading: [CPH-CATEGORY-MAPPING.md](CPH-CATEGORY-MAPPING.md) for how one real store's
categories are actually structured, and why handles and titles can't be trusted.
