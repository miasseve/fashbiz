# CPH Concept — category structure & mapping reference

Reference for building the per-store category feature (point 2 of the CPH scope: *"fetch CPH's
categories directly from their Shopify store, so the AI picks from their actual categories"*).

**Source:** CPH Concept's **public** Shopify endpoints only — we do not have an access key yet.
**Store:** <https://cphconcept.com>

**Two passes, both captured 2026-10-30:**

1. First pass (this file's original §2–§5): 574 products across 3 segment, 9 product-type and
   12 brand collections, pulled with `products.json`.
2. Second pass: an independent review of the homepage, menus, every collection page, the filter
   UI and the full feeds (**602 live products, all 34 collections**), reconciled against pass 1.
   Where the two disagreed, each disagreement was re-verified against the raw JSON. The outcome
   of that reconciliation is in **§0**.

## How this was derived (re-runnable without credentials)

```bash
curl -sL "https://cphconcept.com/collections.json?limit=250"                     # collection inventory
curl -sL "https://cphconcept.com/collections/<handle>/products.json?limit=250"   # per-collection products
curl -sL "https://cphconcept.com/sitemap.xml"                                    # structure / locales
```

**Platform confirmed Shopify:** `collections.json` / `products.json` shapes, Shopify sitemap index
(`sitemap_products_1.xml`, `sitemap_collections_1.xml`, …), `cdn.shopify.com` images, single
`Default Title` variants. Storefront is multilingual (root + `/en/` + `/sv/`).

> ⚠️ **`products.json` caps at 250 per collection.** `all`, `highend`, `kesi-s` and `mini-drop`
> all hit the cap, so any count taken from one of those files is a *sample*, not a total. The
> `products_count` field in `collections.json` is the opposite problem — it counts drafts and
> archived products too (`mini-drop` reports 3741 against ~602 live). Neither number is the live
> count on its own.

---

## 0. Reconciliation — what changed after the second pass

### Corrected in this file (pass 1 was wrong)

| Claim | Was | Now |
|---|---|---|
| Collection count | "~30" | **34**, verified from `collections.json` |
| A **T-shirts** collection | "does not exist — 48 orphan t-shirts, the largest gap" | **It exists.** Handle `t-shirt` (singular), title "T-shirts", **84 live**. Never fetched in pass 1. |
| A **bags** collection | "`taske` → 22 orphans" | **It exists.** Handle `tasker-1`, title "Tasker", **32 live**. |
| Products in no type collection | 104 | **16**, and 11 of those have an empty `product_type`. The gap was almost entirely pass 1's own blind spot. |
| Products with no segment | 105 | **129 (21%)** on the fuller crawl |
| Live catalogue size | "574 sampled" | **~602 live** (599 reachable by joining every collection file) |

The `t-shirt` miss matters: build item "handle the t-shirt gap" is **void** — there is nothing to
work around.

### Corrected in the second pass (it was wrong)

> *"Across all 53 vendors, no vendor appears in both segments."*

**Not true — 3 vendors appear in both,** re-verified directly:

| Vendor | highend | Men | Women | streetwear | The streetwear item(s) |
|---|---|---|---|---|---|
| Gucci | 28 | 23 | 7 | 1 | *Gucci x **Palace** flip flops* |
| Comme des Garçons | 1 | 1 | 0 | 2 | *CDG x **Nike***, *CDG jakke* |
| CPH Concept | 4 | 1 | 3 | 1 | ***Supreme** hue* |

What *is* true is the stronger, more useful statement: **no single product is in both segments**
(`highend ∩ streetwear = 0`, `men ∩ women = 0`). The vendor overlap has a mechanism:

- **A collab is segmented by its streetwear partner, not by the luxury house.** Gucci × Palace and
  CDG × Nike both land in Streetwear.
- **The CPH Concept row is a data-entry artefact,** not a real brand: `Cph Concept` is used as a
  placeholder vendor on 13 products that plainly have a brand (*"Supreme hue"*, *"Louis Vuitton
  Jakke"*, *"Miu Miu Loafers"*). Its segment follows the real brand in the title.

So a brand → segment lookup is still the right design, with **two documented exceptions**:
a collab in the title, and a placeholder vendor.

### Both passes agree on

Categories are Collections, not `product_type`/`tags` · handles contradict titles · exactly one
segment per product · Streetwear has no gender split · `product_type` is inconsistently
cased/spelled, `accesories` typo included · tags merely duplicate `vendor` · the collections are
**hand-maintained**, not rule-driven.

---

## 1. Categories are Shopify **Collections**

Every navigable category on the site points at `/collections/...`. `product_type` and `tags`
exist but are *not* what the site navigates by.

**34 collections**, in four kinds:

| Kind | Members | In main nav? |
|---|---|---|
| **Segment** | Highend (`highend`), High-end – Men, High-end – Women, Streetwear | ✅ yes — this *is* the top menu |
| **Product-type** | Jakker, Bukser, Skjorter, Sko, **T-shirts**, Hættetrøjer, Poloer, Bluser, Jerseys, **Tasker**, Accessories | ❌ not in the menu — reachable only via the filter sidebar |
| **Brand** | SUPREME, PRADA, CHANEL, GUCCI, BAPE, PALACE, STONE ISLAND, MIU MIU, CHROME HEARTS, MAISON MARGIELA, STUSSY, COMME DES GARCONS, BURBERRY SCARF | ❌ homepage tiles + `/pages/brands` |
| **Catch-all** | `all`, `alle-produkter`, `kesi-s` ("Kesi´s"), `mini-drop` ("Nye produkter"), `our-pics` ("Vores favoritter"), `archive` | partly — "Nyheder" points at `mini-drop` |

`highend` is the parent of the two gendered collections: Men + Women account for ~292 of its ~296
live products, the remainder being a handful of ungendered items (Louis Vuitton key holders).

### ⚠️ Match on the collection **GID only** — not the handle, and not the title

Handles contradict titles (table below), **and titles are not unique either** — proven on our own
test store, which has two separate collections both titled `Jakker` (GIDs …547862167 with handle
`jakker` and …548124311 with handle `jakker-1`). A title lookup there is ambiguous and would place
products in whichever one happened to be matched first. See §8.

Collections have been renamed/repurposed, so several handles contradict their title:

| Title | Handle | Actual contents |
|---|---|---|
| SUPREME | `t-shirts` | vendor `Supreme` |
| PRADA | `skjorter` | 71 live, 100% vendor `Prada` |
| GUCCI | `sweatshirt` | 36 live, 100% `Gucci` |
| BAPE | `jakker` | 10 live, 100% `A Bathing Ape` |
| PALACE | `bukser` | 6 live, 100% `Palace` |
| COMME DES GARCONS | `sko` | 5 live, 100% `Comme Des Garcons` |
| STONE ISLAND | `hoodies` | 10 live, 100% `Stone Island` |

The real product-type collections therefore carry a `-1` suffix (`jakker-1`, `bukser-1`, `sko-1`,
`skjorter-1`, `poloer-1`, `accessories-1`, `tasker-1`) or a singular handle (`t-shirt`), because
the obvious handle was already taken by a brand. **The homepage links "PRADA" to
`/collections/skjorter`** — the mismatch is live and load-bearing on their own site.

Brand collections whose handle *does* match: `stussy`, `chanel`, `miu-miu`, `maison-margiela`,
`chrome-hearts-1`, `burberry-scarf`.

---

## 2. Brand split — High-end vs Streetwear

**High-end only — 35 brands** (live counts in the pass-1 sample):

Prada (49), Miu Miu (41), Burberry (33), Louis Vuitton (21), Chanel (17), Chrome Hearts (12),
Maison Margiela (9), Acne Studios (8), Loewe (7), Goyard (7), Celine (6), Christian Dior (5),
Christian Louboutin (5), Bottega Veneta (4), Valentino (4), Hermès (4), Balenciaga (3),
Loro Piana (2), Hysteric Glamour (2), Brunello Cucinelli (2), Missoni (2), Lemaire (1),
Saint Laurent (1), Jacques Marie Mage (1), Our Legacy (1), Enfants Riches Déprimés (1),
C.P. Company (1), The Row (1), Givenchy (1), Saint Mxxxxx (1), Marc by Marc Jacobs (1),
Alaïa (1), Dries Van Noten (1), Dolce & Gabbana (1), Fendi (1)

**Streetwear only — 13 brands:**

Supreme (86), Converse (28), Stussy (27), A Bathing Ape (9), Stone Island (8), Palace (6),
Avirex (2), Billionaire Boys Club (2), Evisu (1), Patta (1), Kapital (1), New Era (1), Moncler (1)

**Straddling both — 3 brands,** with the mechanism for each: see §0. Gucci and Comme des Garçons
straddle only via **collabs with a streetwear brand**; `Cph Concept` is a **placeholder vendor**.

**Brand tier is not a computable rule.** Sibling brands are split — Stone Island → Streetwear but
C.P. Company → High-end. Moncler sits in Streetwear despite being luxury. The split is CPH's own
commercial judgement, not a price/luxury tier you can derive.

### Men vs Women is *not* derivable — it needs a human choice

Across the catalogue, **18 vendors and 15 product types appear in both** High-end – Men and
High-end – Women, and only 9 of ~602 products mention gender anywhere in the title or
description. It cannot be read off the photo, the brand, or the type.

**Build consequence:** for a High-end item, gender is a required input from whoever uploads —
not something the AI may guess. Streetwear needs no gender at all.

---

## 3. Membership — how many collections per product

Pass 1, 574 distinct products across the 12 collections it sampled:

| Collections | Products | % |
|---|---|---|
| 1 | 118 | 20.6% |
| 2 | 277 | 48.3% |
| 3 | 176 | 30.7% |
| 4 | 3 | 0.5% |

Broken down by *kind* — this is the pattern to replicate:

| Shape | Count |
|---|---|
| **1 segment + 1 type** | **201** |
| **1 segment + 1 type + 1 brand** | **171** |
| 1 segment only | 52 |
| 1 type only | 51 |
| 1 type + 1 brand | 39 |
| 1 segment + 1 brand | 37 |
| 1 brand only | 15 |
| 1 segment + 2 type | 5 |
| other | 3 |

**The canonical shape is `1 segment + 1 type + (0 or 1) brand`** — 372 / 574 (65%).

Hard invariants, both passes:

- **Exactly one segment, never two.** Products in >1 segment: **0**.
  `high-end-men ∩ high-end-women = 0`, `highend ∩ streetwear = 0`.
- **Streetwear has no gender split.** Only High-end splits Men/Women. Code must handle the asymmetry.
- **One product-type collection** per product — the handful in two look like mistakes.

**Coverage gaps (corrected):** **129 live products (21%) are in no segment at all** — invisible
from the menu. 89 of them were created Jul–Aug 2026, which reads as a batch upload nobody
assigned, not a deliberate pattern. **16** are in no type collection (11 of those have an empty
`product_type`). Code that assumes every product has a segment breaks on a fifth of the catalogue.

---

## 4. `product_type` → product-type collection

| `product_type` values (verbatim, as stored) | → Collection (handle) |
|---|---|
| `jakke`, `Vest` | Jakker (`jakker-1`) |
| `Bukser`, `Nederdel` | Bukser (`bukser-1`) |
| `Skjorte` | Skjorter (`skjorter-1`) — 100% pure |
| `Sko` | Sko (`sko-1`) |
| `t-shirt`, `T-shirt` | **T-shirts (`t-shirt`)** — 75 of 84 are `t-shirt` |
| `Hættetrøje` | Hættetrøjer (`haettetrojer`) — 100% pure |
| `polo` | Poloer (`poloer-1`) |
| `bluse`, `Strik`, `Cardigan`, `Top` | Bluser (`bluser`) |
| `Jersey` | Jerseys (`jerseys`) |
| `taske` | **Tasker (`tasker-1`)** — 31 of 32 |
| `accesories` *(sic — misspelled in their data)*, `hat`, `Hue` | Accessories (`accessories-1`) |
| `Kjole` (dresses) | **no home** — scattered between `bukser-1`, `t-shirt` and nothing |
| `""` (empty, 11 products) | nothing |

### Folds with no category of their own

Skirts (`Nederdel`) are filed under **Bukser** (trousers); `Strik`/`Cardigan`/`Top` under
**Bluser**; `Vest` under **Jakker**; `hat`/`Hue` under **Accessories**. Jewellery, sunglasses,
wallets, belts and key holders all collapse into `accesories` — there is no finer split. These are
workable folds, but there is no "Strik", "Hats" or "Dresses" category to map to.

### `product_type` data quality is poor

Mixed Danish/English, inconsistent casing (`jakke` vs `Bukser`, `t-shirt` vs `T-shirt`), and a
misspelling (`accesories`, 71 products). Shopify's storefront filters are **case-sensitive**, so
`t-shirt` and `T-shirt` render as two separate filter options on their live site.

**Do not use `product_type` as the category source** — use it only as the join key to their
collections, normalised case-insensitively, and **write it back in their exact spelling, typo
included**, or their filters stop matching.

`tags` are just the brand name again (duplicating `vendor`), inconsistently cased (`supreme` vs
`Supreme`, `Louis vuitton`, `acne` vs `Acne Studios`). **Derive nothing from tags.**

---

## 5. Rule-based or hand-picked? → **Hand-maintained**

High confidence, and the second pass *raised* it rather than lowering it.

Decisive evidence — each of these is **impossible** under a Shopify smart (automated) collection,
which cannot take manual additions:

- `sko-1` (shoes) contains a **`Cardigan`** and a **`t-shirt`**.
- `bukser-1` (trousers) contains a **`t-shirt`**.
- `poloer-1` (polos) contains a **`Hættetrøje`**.
- `t-shirt` contains a **`Kjole`** (dress) and a **`Jersey`**.
- `/burberry-scarf` ("BURBERRY SCARF") holds exactly 1 product, whose vendor is **Maison Margiela**.
- Gucci appears in **both** segments — no single vendor or tag rule produces that.

The second pass's counter-hypothesis ("type collections are ~97% consistent with `product_type`,
so probably automated") is answered by its own finding: **3 recent items are *missing* from
`jakker-1` despite `product_type: jakke`** (e.g. *Gucci x The North Face Jakke*, created 28 Oct).
An automated rule cannot miss a matching product. Missing items + contaminating items together
rule automation out in both directions.

Rule-*like* signals do exist — segments perfectly exclusive, brand collections near-vendor-pure,
Skjorter and Hættetrøjer 100% type-pure — but that is **a convention the staff follow by hand**,
with human error, not an engine.

Purity by type collection (live):

| Collection | n | Dominant type | Purity | Distinct types |
|---|---|---|---|---|
| `skjorter-1` | 31 | `Skjorte` | 100% | 1 |
| `haettetrojer` | 19 | `Hættetrøje` | 100% | 1 |
| `tasker-1` | 32 | `taske` | 97% | 2 |
| `sko-1` | 106 | `Sko` | 97% | 4 |
| `jakker-1` | 87 | `jakke` | 95% | 2 |
| `poloer-1` | 20 | `polo` | 90% | 3 |
| `t-shirt` | 84 | `t-shirt` | 89% | 6 |
| `jerseys` | 22 | `Jersey` | 82% | 3 |
| `accessories-1` | 89 | `accesories` | 78% | 5 |
| `bukser-1` | 45 | `Bukser` | 76% | 4 |
| `bluser` | 57 | `bluse` | 63% | 7 |

Brand collection rules are **not uniform either**: `SUPREME` tracks `vendor` exactly (and so
*excludes* the "Supreme hue" whose vendor is the `Cph Concept` placeholder), while `MIU MIU`
includes a `Cph Concept`-vendor "Miu Miu Loafers" and `STUSSY` includes an `A Bathing Ape`-vendor
"BAPE x Stussy kasket" — those look title-driven. Don't assume one rule fits all brand collections.

---

## 6. What this means for the build

0. **HARD CONSTRAINT — do not replace the shared taxonomy.** `CATEGORIES` / `SUBCATEGORIES` in
   `src/lib/taxonomy.js` stay exactly as they are. They are shared by **every** store and are
   used well beyond the category dropdown:
   - the Atlas Vector Search **pre-filter** (`src/lib/embeddings.js` → `approvedOutput.category`)
   - the store's **price history** query (`/api/ai/suggest-price`)
   - **points** via `calculateValueScore()` (`src/lib/normalize.js`)
   - **category-aware size** normalization (`SHOE_CATEGORIES` / `ACCESSORY_CATEGORIES`)

   `ApprovedProduct` embeddings are shared across stores, so swapping in one store's collections
   would break similarity search, pricing and points for all the other stores. CPH's collections
   are therefore added as a **separate `storeCollection` field alongside `category`**, never
   instead of it: `category` keeps driving the AI/internal pipeline, `storeCollection` is used
   only for Shopify placement.

1. **Two placement mechanisms, picked per collection from `ruleSet` — not one.**

   Verified against our own base store on 2026-10-30 with the Admin API (read-only collections
   query, API 2024-10): **every collection on our base store is an AUTOMATED, tag-ruled
   collection** — `Women` is `TAG EQUALS women`, `Men's shirt` is `TAG EQUALS shirt` **AND**
   `TAG EQUALS men`, and so on. That is why product creation already emits `shopify_tags`: the
   base store places products *by tag, automatically*.

   CPH's are the opposite — hand-maintained manual collections (§5). So the mechanism cannot be
   hardcoded; it has to be read per collection:

   | `ruleSet` | Collection is | How a product gets in | Writing the other way |
   |---|---|---|---|
   | `null` | **manual** | explicit `collectionAddProducts` with the collection GID | tags do nothing |
   | rules present | **automated** | attach the tags/values the rules match | `collectionAddProducts` is **rejected by Shopify** |

   `getAllCollections()` therefore fetches `ruleSet`, and `isManualCollection()` in
   `src/lib/storeCollections.js` resolves it to the switch. For an automated collection the
   required tags are computable directly from `ruleSet.rules` (`column: TAG`, `relation: EQUALS`,
   `condition: <tag>`), with `appliedDisjunctively` saying whether the product needs *any* rule
   or *all* of them.

   **Do not** build only the `collectionAddProducts` path: it would be rejected on our own base
   store. **Do not** build only the tag path: it silently does nothing on CPH's.
2. **Fetch collections per store, not the base store.** `getAllCollections()` is currently
   base-store scoped and never called — give it a `storeConfig` parameter using the
   `buildShopifyClient(storeConfig)` shadow pattern, and resolve the owner via
   `resolveStoreConfigForUser(userId)`.
3. **The assignments come from four different signals — don't ask the AI for all of them:**

   | Assignment | Signal | Who decides |
   |---|---|---|
   | **Type** collection | the AI's visual classification, mapped through §4 | AI — the only one an image model should decide |
   | **Brand** collection | the `vendor`/brand the AI already extracts, matched by title | AI, then exact-match to a brand collection |
   | **Segment** (Highend/Streetwear) | brand → segment allow-list (§2) | lookup, **never** the AI |
   | **Men / Women** (High-end only) | nothing in the data predicts it (§2) | **the uploader, explicitly** |

4. **Respect the invariants:** exactly one segment, at most one type collection, Streetwear has no
   gender split.
5. **Handle the two segment-lookup exceptions** (§0): a collab in the title segments by the
   *streetwear* partner, and `Cph Concept` as vendor means "read the brand from the title".
   Unknown brand → leave the segment unset for human review rather than guessing.
6. **Resolve each collection to its GID once, and key everything on the GID** (§1). Neither the
   handle nor the title is unique or stable. Where a human must disambiguate (two collections
   with the same title), that choice is stored per store — it is not something the AI or a
   string match may decide.
7. **Write `product_type` in their exact spelling, typo included** (§4), or their storefront
   filters stop matching.
8. **Expect ~21% of their catalogue to have no segment.** Don't infer a rule from a product that
   has none, and don't "fix" theirs as a side effect.
9. **Size is not in a field — it's in the title**, as `(Str. M)` / `(Str. 42,5)`, on 484 of ~602
   products. The `Størrelse` filter renders with zero options because nothing feeds it;
   `custom.skostorrelse` exists but only holds 36–39 on a handful of shoes. If we write size into
   a variant or metafield instead of the title, it will be invisible on their storefront. Confirm
   with them which they want.
10. **Our AI will be writing their first descriptions** — 533 of ~602 products have none.
11. Keep everything behind the existing fallback: a store with no connected Shopify must behave
    exactly as today.

### Their own site has bugs — don't mirror them

- **Menu:** High-end › All points at `/collections/all` (everything, Streetwear included) instead
  of `/collections/highend`. The homepage tile links it correctly.
- `all` is a real custom collection created 2026-09-15 that **overrides** Shopify's built-in
  virtual `/collections/all`.
- "Nye produkter" (new products) holds 3741 of the catalogue — it is not "new" anything.
- Four near-identical all-product collections exist: `all`, `alle-produkter`, `kesi-s`, `mini-drop`.
- The gift card's handle is `cph-concept-gavekort-kopi` ("kopi" = copy) — a duplicate that became
  the live one.
- Every item is single-variant (`Default Title`, 601 of 602). Titles repeat with handle suffixes
  (`supreme-jakke-str-s-8`) — expected for secondhand, so **don't dedupe on title**.

---

## 7. Open questions — need the access key or a call with CPH

**Resolved by the second pass** (no longer open): whether a T-shirts collection exists (yes);
whether the collections are rule-based (hand-maintained, §5).

Still open:

- **Smart vs manual, definitively.** The public API does not expose `ruleSet`. §5 infers
  hand-maintained from contamination *and* from missing matching products. **The tooling for the
  answer now exists:** the moment CPH connects, call
  `GET /api/admin/shopify/collections?userId=<their id>` (admin only) — it returns each
  collection with `isManual` resolved from `ruleSet`, and a manual/automated/unknown summary.
  Already run against our own base store: **100% automated, tag-ruled** (see §6.1).
- **Shopify's standard product category (taxonomy) field** — not visible from the storefront. If
  they have populated it, it may be a better `storeCollection` source than the collection list.
- **The other ~3,100 products.** `products_count` reports 3741 total against ~602 live, so most of
  the catalogue is draft or archived — presumably sold. **Confirm what happens on a sale**
  (archive? unpublish? delete?) so our sync never resurrects or duplicates them.
- **Who assigns Men/Women today**, and whether they will accept a default (Streetwear = no gender;
  High-end = required choice at upload).
- **Where they want size** — title string, variant, or metafield (§6.9).
- **Sales-channel publication** — whether a new product needs explicit publishing to Online Store.
- **Are `all` / `alle-produkter` / `kesi-s` / `mini-drop` / `our-pics` live merchandising or
  leftovers** we can ignore?
- **Gender for Streetwear** — do they want one added, or stay ungendered?

---

## 8. Verified on our own test store (2026-10-30)

`GET /api/admin/shopify/collections?userId=…` run on production, logged in as admin, against
`lestoredevtest12.myshopify.com`. This exercised the whole chain — admin auth → store resolution →
token decrypt → per-store Shopify client → `ruleSet` → `isManual`.

**Result: `connected: true`, 20 collections — 18 manual, 2 automated, 0 unknown.**

| # | Title | Handle | `isManual` | Rules |
|---|---|---|---|---|
| 1 | Home page | `frontpage` | ✅ manual | Shopify's default collection, not one we made |
| 2 | **Jakker** | `jakker` | ✅ manual | ⚠️ duplicate title — see below |
| 3 | High-end – Men | `high-end-men` | ✅ manual | |
| 4 | High-end – Women | `high-end-women` | ✅ manual | |
| 5 | Streetwear | `streetwear` | ✅ manual | |
| 6 | **Jakker** | `jakker-1` | ✅ manual | ⚠️ duplicate title |
| 7 | Bukser | `bukser` | ✅ manual | |
| 8 | Skjorter | `skjorter-1` | ✅ manual | |
| 9 | Sko | `sko` | ✅ manual | |
| 10 | Hættetrøjer | `haettetrojer` | ✅ manual | |
| 11 | Poloer | `poloer` | ✅ manual | |
| 12 | Bluser | `bluser` | ✅ manual | |
| 13 | Jerseys | `jerseys` | ✅ manual | |
| 14 | Accessories | `accessories` | ✅ manual | |
| 15 | STUSSY | `stussy` | ✅ manual | |
| 16 | **PRADA** | `skjorter` | ✅ manual | handle-mismatch quirk, reproduced on purpose |
| 17 | t-shirt | `t-shirt` | ✅ manual | |
| 18 | tasker-1 | `tasker-1` | ✅ manual | title is the handle — not a display name |
| 19 | Women | `women` | ⚙️ automated | `TAG EQUALS women` |
| 20 | Men's shirt | `mens-shirt` | ⚙️ automated | `TAG EQUALS shirt` **AND** `TAG EQUALS men` |

### What this confirms

- **The two mechanisms are real and co-exist on one store.** 18 manual (need
  `collectionAddProducts`) sitting next to 2 automated (need the right tags, reject direct
  writes). `ruleSet` separates them correctly, including the two-rule conjunction on #20.
- **`PRADA` → handle `skjorter`** alongside `Skjorter` → `skjorter-1` mirrors CPH's live
  mismatch exactly, so the handle trap is reproduced and testable.
- **`appliedDisjunctively: false`** on #20 means ALL rules must match — a product needs both
  `shirt` and `men` tags. Any tag-writing path has to honour that, not just attach one tag.

### New problem this surfaced — duplicate titles

Two collections are titled **`Jakker`** (#2 and #6). CPH's live store has no duplicate titles, so
this did not show up in the public research — the test store caught it. Consequences:

- Title matching is **not** a usable key. The earlier "match on title/GID" guidance was wrong and
  has been corrected to **GID only** (§1, §6.6).
- The AI cannot be handed a bare list of titles to choose from: two identical options are
  indistinguishable to it. The list it sees must carry a stable identifier, and the mapping from
  its answer back to a GID must be exact.
- This store needs the duplicate resolved (delete or rename one) before placement testing, or
  the ambiguity will be baked into whatever mapping we build against it.

### Also confirmed: the local decrypt failure is local-only

`connected: true` here proves the production `REFERRAL_SECRET_KEY` **does** decrypt this store's
token. The failure seen on the dev machine is a local `.env` key that differs from production —
production is healthy. The silent base-store fallback in `resolveStoreForUser` remains worth
hardening, but nothing is currently broken in production because of it.
