# Multi-Store Pro Subscription — How It Works

**Use case:** A customer (e.g. *folkekirkens*) runs ~30 physical stores but wants to pay
for **one** Pro subscription. Every product must stay linked to the **address of the store
it belongs to**, so app/shop users can **browse by store location** instead of seeing one
giant mixed inventory under a single address.

This document explains how that will work, what changes, and what stays the same.

---

## 1. The core idea

Today the platform assumes **1 account = 1 subscription = 1 store**. The store's identity
(name + address) comes straight from the logged-in user's `storename`.

To support many stores under one subscription, we add a **store-location layer** *between*
the account and its products:

```
Account (1 Pro subscription)
   └── Store Locations (30)      ← NEW layer
          └── Products (each tagged to one location)
```

The **subscription itself does not change** — folkekirkens still buys one Pro plan in
Stripe. Everything new sits in *how products are organised and displayed*, not in billing.

---

## 2. What exists today vs. what's missing

| Capability | Today | Needed |
|---|---|---|
| One Pro subscription | ✅ Yes (`Ads Pro`, `productLimit: 1000`) | ✅ Reuse as-is |
| Products carry a store label in Shopify | ✅ Yes — `vendor = storename` + `store_label` metafield | ✅ Reuse the mechanism |
| Multiple store **addresses** under one account | ❌ No | 🔨 Build |
| Tag each product to a **specific** store | ❌ No (all share one `storename`) | 🔨 Build |
| **Browse by store location** in the shop/app | ❌ No | 🔨 Build |
| More than a few logins per account | ❌ Capped (`maxUsers: 5` on Pro) | 🔨 Raise the cap |

The good news: the "products carry a store label" plumbing **already exists** — we just need
to make that label the *specific* store instead of the one account name.

---

## 3. How it works, step by step

### Step 1 — Register the 30 store locations
A new **`StoreLocation`** record is introduced:

```
StoreLocation {
  accountId   // the ONE folkekirkens account/subscription
  name        // e.g. "Folkekirkens Nødhjælp — Aarhus C"
  address     // the physical store address
  code        // short unique code, used for tagging/filtering
}
```

Folkekirkens' 30 stores become 30 `StoreLocation` rows, all under their single account.
Managed from a simple **"Store Locations"** screen (add / edit / remove an address).

### Step 2 — Tag each product to its store
When a product is uploaded, the uploader picks **which store location** it belongs to. We
add a `storeLocationId` field to the product, so every item now knows its home store.

### Step 3 — Send the location to Shopify
Currently every product is stamped with the account's `storename`. We change this so each
product is stamped with **its own location** instead:

- `vendor` → the specific store's name
- `store_label` metafield → the specific store (name/address/code)

This is the field that powers "browse by store."

### Step 4 — Browse by store
The shop/app reads that location field to offer a filter:

- **All stores** → the full combined inventory (one big catalogue).
- **A single store** → only that location's shelf.

So one webshop shows everything, but users can narrow to any single store.

### Step 5 — Allow 30 logins
The Pro plan currently allows only a handful of simultaneous logins (`maxUsers: 5`). If each
of the 30 stores needs its own login, we add a **per-account override** to lift that limit
for folkekirkens without changing the plan for everyone else.

---

## 4. What changes vs. what stays the same

**Stays the same**
- Stripe billing — one Pro subscription, paid once. No new plan, no payment changes.
- How inventory syncs to Shopify (same pipeline, just a more specific store label).
- Existing single-store accounts — unaffected.

**Changes / new**
- New `StoreLocation` concept + a screen to manage the 30 addresses.
- Products gain a `storeLocationId` and a location picker at upload.
- Shopify product label becomes the *specific* store, not the account name.
- A browse-by-store filter in the shop/app.
- A per-account login-limit override.

---

## 5. The one open question that changes the size

**Where does "browse by store" need to appear?**

- **(A) The live re-e.dk / Shopify storefront** — mostly a collection/metafield + theme
  filter change. *Cheaper.*
- **(B) The Lovable "Discover" app** — that app currently runs on mock data with no backend
  connected, so browse-by-store there is a much larger job (needs the backend integration
  first). *More expensive, possibly a separate project.*

This must be confirmed before the estimate is locked.

---

## 6. Scope & time estimate

| # | Work | Hours |
|---|------|-------|
| 1 | `StoreLocation` data model + migration | 6–8h |
| 2 | Manage-locations UI (add/edit/remove 30 addresses) | 6–10h |
| 3 | Product → location link (field + upload picker + save) | 8–12h |
| 4 | Shopify sync of the specific location + re-sync existing products | 6–10h |
| 5 | Per-account login-cap override (`maxUsers`) | 2–4h |
| 6 | Onboard folkekirkens (30 locations, tag existing products), QA, deploy | 6–10h |
| 7 | Browse-by-store filter — **(A)** storefront `6–10h` / **(B)** Lovable app `16–24h` | see path |

**Totals**
- **Path (A) — Shopify / re-e.dk storefront:** ~**40–54h**
- **Path (B) — Lovable app:** ~**50–68h** (assumes the app's backend is already wired up)

---

## 7. Recommended delivery

Bill hourly against milestones, and start with the **foundation** so there's something real
before committing to the app-side unknown:

1. **Phase 1 — Locations + tagging** (steps 1–3): the reusable core. ~20–30h.
2. **Phase 2 — Browse by store + login cap** (steps 4–5, 7): make it visible. ~15–25h.
3. **Phase 3 — Onboard folkekirkens + go live** (step 6). ~6–10h.

Phase 1 alone is demoable and de-risks the whole estimate.
