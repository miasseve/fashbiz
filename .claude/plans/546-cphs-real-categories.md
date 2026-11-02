# Plan — Task #546 · CPH's real categories

**Spec:** `.claude/specs/546-cphs-real-categories.md` (Approved · navtej0110 · 2026-10-30)
**Branch:** `feature/546-cphs-real-categories` — already created by `/start-task`; **no new branch**
**Type:** Feature · **Size:** Medium · **Risk:** High
**Plan file on approval:** `.claude/plans/546-cphs-real-categories.md`

## Context

Stores on the platform connect their own Shopify. Until recently the AI filled a product's
details from our shared taxonomy, which has nothing to do with the categories a given shop
navigates by — so a synced product arrived with no category and was invisible from the store's own
menu. CPH Concept navigates entirely by Shopify collection, and 533 of their ~602 products have no
description either.

Most of this feature already works (live per-store category read, the AI picking one or none, the
owner's override box, placement into hand-kept categories with the kind re-read at save time).
**Five gaps remain**, and every one is a case CPH's real store actually has. This plan closes those
five and nothing else.

## The scope rule that governs everything

The client quoted only: *"CPH's real categories: we fetch CPH's categories directly from their
Shopify store, so the AI picks from their actual categories. Products then appear in the right
place on their live website."* — **2–3 hours for the whole item.**

**No new screen, no new page, no new field.** The only visible change permitted anywhere is the
text of each row inside the category box that already exists on the upload form (spec §8, AC-29).
The "don't suggest" marks go straight into Mongo, set by us, like a store's Link plan flags.

## Design decisions taken during planning

| # | Decision | Why |
|---|---|---|
| P1 | **Use Shopify's `tagsAdd` mutation** for rule-filled categories, called from inside the existing `ruleSet` branch of `addProductToStoreCollection`. **Do not** reorder the save path to put tags in the create payload. | `createProduct` is a server action invoked from a **page** route, and `vercel.json` scopes `maxDuration: 60` to `app/api/**` only — so it runs on the platform default (~10s). `createShopifyProduct` is already ~6 sequential Shopify calls plus a hard 500 ms sleep (`shopifyAction.js:235`). Prepending a 15 s collection read risks the invocation being killed **mid-create**, leaving a half-built Shopify product with no Mongo row and no rollback (the outer `catch` never runs on a platform kill). `tagsAdd` is additive by definition, so D4 ("add, never replace") holds by construction instead of depending on our merge logic, and it needs only `write_products` — the scope `productCreate` already uses, so **no merchant re-consent**. |
| P2 | **Contents digest never blocks an upload.** If it isn't cached, that upload shows category names only and the crawl runs for the next one. | This is a **deviation from spec D3**, which said "the same 10-minute cache". No product query exists today, so the digest needs a full product crawl (CPH ≈ 602 products = 3 paginated calls). Running that inside an upload breaks §7 Performance ("an upload must not get measurably slower") and risks the same invocation-kill problem as P1. Spec §5 already defines the fallback: *"the row shows the category's name on its own — never a handle"*. **I asked about this and got the instruction to follow §12 rather than a choice, so I have taken the recommended option and recorded it here for you to overturn.** |
| P3 | **One shared pure function** `tagRulesForCollection(ruleSet)` decides both whether a category may be suggested (AC-13) and which tags get written (AC-08, AC-09). | If the box's idea of "eligible" and the writer's idea can drift, AC-13 passes in the box and fails at save — the exact silent-wrong-category class this task exists to remove. |
| P4 | **A rule `condition` containing a comma is rejected, never written.** | Shopify splits a tag string on commas, so a rule condition `"men, large"` becomes two tags and **neither equals the condition** — the product silently misses the chosen category *and* gains two junk tags that may pull it into other tag-ruled collections. Worst available outcome. |
| P5 | For `appliedDisjunctively: true`, write **the first valid rule in the order Shopify returned them**. | Shopify's own admin lists a smart collection's conditions in that order, so it is explainable to a merchant as "the top tag condition as it appears in your Shopify admin". Alphabetical is equally deterministic but appears nowhere in their UI. AC-09 accepts any one of the rules. |
| P6 | The marks live on **`ShopifyStore.aiExcludedCollectionIds: [String]`** (Shopify GIDs), default `[]`. | `ShopifyStore` already holds a group of fields written only by the OAuth callback and never by the developer form (`status`, `connectedVia`, `grantedScopes`, …), because both developer routes use explicit field whitelists. A new field stays UI-free as long as those two whitelists are left alone. `resolveStoreForUser` already `.lean()`s the whole doc, so reading it costs **no extra query**. |

## Work, in the order to do it

Staged so the cheapest, highest-value gaps land first — §8 asks for exactly that, given the 2–3 h quote.

### Stage 1 — Exclude brand and catch-all categories (gaps 1 + 2)

| File | Change |
|---|---|
| `src/models/ShopifyStore.js` | Add `aiExcludedCollectionIds: { type: [String], default: [] }`. Mirror the comment style of the `status`/`connectedVia` group, stating it is set by hand and has no UI. |
| `src/lib/shopifyStoreResolver.js` | Pass the field through: add `excludedCollectionIds: store.aiExcludedCollectionIds || []` to the oauth return (`:73-78`) and `[]` in `envFallbackConfig()`. Harmless to `buildShopifyClient`, which destructures only what it needs. |
| `src/lib/storeCollections.js` | In `getStoreCollectionsForUser`, mark each collection `isExcluded: excluded.has(c.id)`. **Keep excluded collections in the returned list** — D1 requires the owner can still pick one by hand (AC-15); only the AI's list is filtered. |
| `src/lib/aiProductAnalysis.js` | In `buildCollectionRefMap` (`:108`), skip `isExcluded` and ineligible rule-filled collections, so they never enter the ref map, the enum, or the prompt. The owner's `storeCollectionOptions` (`:492`) keeps everything. |
| `scripts/set-store-ai-excluded-collections.js` *(new)* | One-off setter, following the `backfill-stripe-subscriptions.js` template exactly: header docblock with `Usage: node --env-file=.env scripts/… `, CommonJS `require`, fail-fast on missing `MONGODB_URI`, inline `strict: false` model stub, `--dry-run` flag (`register-shopify-webhook.js` shows the flag convention), updated/skipped counters, `mongoose.disconnect()`, top-level catch. Validates each id against the existing GID regex before writing. |

The existing automatic own-brand refusal in `resolveStoreCollection` (`aiProductAnalysis.js:196-221`) **stays untouched** — D5, AC-14.

### Stage 2 — Make rule-filled categories actually work (gap 4)

| File | Change |
|---|---|
| `src/lib/storeCollections.js` | Add `tagRulesForCollection(ruleSet)` — a **total** pure function beside `isManualCollection`. Returns `null` for a manual collection; `{eligible:false, reason}` when `rules` isn't a non-empty array, when any rule isn't `TAG`/`EQUALS` (compare upper-cased), or (conjunctive only) when any condition was dropped; otherwise `{eligible:true, mode:"any"|"all", tags, candidates}`. Conditions are `String(c ?? "")`, trimmed, and dropped if empty, comma-bearing (P4) or over 255 chars. **Preserve the merchant's exact case** — their storefront filters are case-sensitive (AC-20). Dedupe case-insensitively. Must never throw. |
| `src/actions/shopifyAction.js` | Add `addProductTags(productId, tags, storeConfig)` beside `addProductToStoreCollection`: `mutation tagsAdd($id: ID!, $tags: [String!]!)`, same `COLLECTION_CALL_TIMEOUT_MS`, same never-throws/status-return contract. Guards: empty tags → `skipped`; **no `storeConfig` → `skipped`** (never tag on the base store — AC-25), mirroring the existing guard at `:1763`. |
| `src/actions/shopifyAction.js` | Replace the `if (collection.ruleSet)` branch (`:1805-1811`), which today just skips. Call `tagRulesForCollection`; if ineligible return `skipped` with the reason; else return `addProductTags(...)` with a **new status `"tagged"`** carrying the tags written. A distinct status is what AC-11's evidence rests on — don't overload `"added"`. |
| `src/actions/productActions.js` | At `:166-174`, treat `"tagged"` as success alongside `"added"` and log the tags, or every rule-filled success logs as a warning. |
| `src/actions/shopifyAction.js` | Add a warning comment at `updateShopifyProduct`'s `productUpdate` input (`:2016-2022`): it deliberately has **no `tags` key**, which is why an edit can't strip tags (AC-28). The `//not working as expected` note at `:1943` invites someone to add one; `productUpdate { tags }` **replaces** the set and would drop products out of every tag-ruled collection, including the base store's. |

### Stage 3 — Show what is really inside each category (gaps 3 + 5)

This is the only genuinely new Shopify work: **no product-reading query exists anywhere in `src/`.**

| File | Change |
|---|---|
| `src/actions/shopifyAction.js` | Add `getStoreProductFacts(storeConfig)`: paginated `products(first: 250, after:)` selecting `productType`, `vendor` and `collections(first: 20) { nodes { id } }`. Follow `getAllCollections`' pagination shape (`:1905-1931`) and its degrade-to-`[]`-and-log contract, but **add an explicit timeout** — `getAllCollections` has none. Cap total pages (e.g. 8 ≈ 2000 products) so a huge catalogue can't run away. |
| `src/lib/storeCollections.js` *(or a sibling `storeCategoryFacts.js`)* | Build a per-store digest from one crawl: per collection id → the dominant `productType` values in the store's own spelling plus a product count; and store-wide → each `productType` spelling with its frequency. Cache per `storeDomain`, **separate from the 10-minute collection cache** and refreshed in the background (P2). Never cache an empty/failed result, matching the existing deliberate choice at `:122`. |
| `src/lib/aiProductAnalysis.js` | `buildCollectionPromptBlock` (`:159`): replace `${title} (${handle})` with title + the contents hint. **Drop the handle entirely** (AC-18). Keep `JSON.stringify` on every merchant string — a name can contain a quote or newline. Where the digest is missing, emit the title alone. |
| `src/lib/aiProductAnalysis.js` | Add the hint to each entry of `storeCollectionOptions` (`:492`) so the form can render it. |
| `src/app/dashboard/add-product/components/ProductFormFields.jsx` | In the `<option>` at `:101-105`, show title + hint instead of `{c.title} ({c.handle})`. Keep the existing `— automatic` marker (D7) and the "None" row. Update the stale comment at `:74-77`, which explains why the handle is shown. **This is the one and only visible change.** |
| `src/actions/productActions.js` | FR-09: before calling `createShopifyProduct`, override the outgoing `subcategory` with the store's own spelling for that type when the digest has one; otherwise leave it exactly as today. Do this **in `createProduct` only** — never inside `createShopifyProduct`, or the two base-store callers (`api/public/products/route.js:135`, `api/admin/products/sync-missing-shopify/route.js:65`) would start paying a crawl and could write the wrong spelling. Build a fresh array/object; never mutate the caller's `formData` (the spread at `:136-145` is shallow). |

### Stage 4 — Optional hardening (drop first if time runs short)

Move the placement block (`productActions.js:157-183`) to **after** `await newProduct.save()`. Today
the Shopify-create→Mongo-save window is why the 15 s timeout exists at all; afterwards, every
collection/tag write happens with the product already recorded in both systems, so "placement can
never fail the upload" becomes structural rather than conventional. **Keep the inner `try/catch`,
and make it total:** after the save `createdShopifyProduct` is `true`, so anything escaping reaches
the outer `catch` and would delete the Shopify product while the Mongo row survives. Not required
by any acceptance check — pure risk reduction.

## What gets reused rather than rebuilt

`getStoreCollectionsForUser` + its 10-minute cache and deliberate no-cache-on-empty ·
`invalidateStoreCollections()` · `isManualCollection` · `sanitizeStoreCollection` and its GID regex
· `addProductToStoreCollection`'s live read, ownership check and 15 s timeout ·
`resolveStoreConfigForUser` · `buildShopifyClient` · the opaque `c1…cN` ref map (titles are never
shown to the model as the answer key) · the existing `— automatic` marker · the `[collection]` /
`[shopify-collections]` log prefixes · the `backfill-*.js` script template · the admin read-back
route `/api/admin/shopify/collections?userId=` for verification.

## Layers

| Layer | Covered |
|---|---|
| Frontend | One `<option>`'s text in `ProductFormFields.jsx`. No new screen, field or control (AC-29). States: digest missing → title only; excluded → still selectable; rule-filled → existing `— automatic`. |
| Backend | Ref-map filtering, `tagRulesForCollection`, `addProductTags`, the `ruleSet` branch, the product-facts crawl, the `subcategory` override. |
| Data | One new field, `ShopifyStore.aiExcludedCollectionIds`, default `[]`. **No migration** — absent means "none", which is today's behaviour. Shopify data is still never mirrored; the digest is an in-memory cache only. |
| Security | Owner id stays session-derived (AC-23). `addProductTags` refuses without `storeConfig` (AC-25). Merchant strings stay JSON-encoded into the prompt and plain text in the DOM. No rules or tag lists are ever accepted from the browser — tags are computed server-side from a live read, so there is no tag-injection surface. |
| Integrations | Shopify Admin 2024-10. `tagsAdd` needs `write_products`, already granted — **confirm on the first real run** and fall back to today's skip-with-reason if the shop rejects it. |
| Testing | No test runner exists; `npm run lint` and `npm run build` are both broken on this host (`.claude/rules/known-failures.md`) — same as the known-failures list. All 31 checks are manual; see Verification. |
| Release | Vercel auto-deploys `master`. Rollback = revert the release (D6). Run the marks script per store before that store's first upload. |

## Verification

Spec §6 defines 31 checks and §6's header defines the protocol: the four model-dependent ones
(AC-03, AC-04, AC-12, AC-14) are each run **5 times on one photo** and must hold every time.
Order of work:

1. **Baseline first** (Risk-High requirement): on the test store, record today's behaviour —
   the current dropdown rows (showing handles), an upload into a hand-kept category, and an upload
   into a rule-filled one. Keep the screenshots; they are the "before" for AC-29 and AC-18.
2. **Backup before release:** export `products.storeCollection` for the affected stores plus the
   new marks. Nothing is migrated, so there is nothing else to restore.
3. `GET /api/admin/shopify/collections?userId=<owner>` (admin session) to confirm the store's
   structure and `isManual` per collection before trusting any result.
4. **Stage 1:** set marks via the script with `--dry-run`, then for real; re-upload and confirm the
   marked ones are never suggested but still selectable (AC-12, AC-15, AC-26, AC-31).
5. **Stage 2:** upload into the two-rule AND collection and into a three-rule ANY collection;
   check the tags on the product and its presence in the collection in Shopify admin
   (AC-08, AC-09). Flip a collection manual→rule-filled between analysis and save for AC-11.
6. **Stage 3:** confirm no row anywhere shows a handle (AC-18), that the two same-titled "Jakker"
   are distinguishable (AC-17), and that `accesories` / `t-shirt` are written in the store's own
   spelling (AC-19, AC-20).
7. **Regressions:** unconnected store, unclaimed store, consignor, guest try-it-free (AC-22,
   AC-24); base store untouched (AC-25); taxonomy file unchanged and `storeCollection` absent from
   embedding text and the search pre-filter (AC-27); edit and delete (AC-28).
8. **Rollback test:** revert the release on a staging-like setup and confirm uploads behave as
   before and the stored marks are simply unread. Record the proof.
9. Only then CPH (AC-30), and remove the test product and its tags afterwards.

Every check must land in spec §14 with its proof — a command's output, a Shopify-admin screenshot,
or the named `[collection]` log line. **No "Pass" without proof.**

## Not in this task

Automatic brand placement · segment placement (so a CPH product will be in the right category but
still not in their top menu — accepted, §8) · the Men/Women choice · moving a product's category
after save · an owner-facing settings screen · the 250-category read cap and today's row ordering,
both left exactly as they are.

## On approval

1. Save this plan to `.claude/plans/546-cphs-real-categories.md`.
2. Set `"plan": ".claude/plans/546-cphs-real-categories.md"` in `.claude/tasks/546/task.json`.
3. Fill spec **§13** (plan path, stack, the AC→task table, and the D3 deviation in P2).
4. `bash .claude/skills/start-task/scripts/log-step.sh 546 plan`.
5. No commit, push, merge, PR or deploy — `/ship` does that.
