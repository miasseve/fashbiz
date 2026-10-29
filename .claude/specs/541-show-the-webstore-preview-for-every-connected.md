# Show the webstore preview for every connected store

`541` · Feature · Small size · **Medium risk** — the Webstore "Preview" link opens an external Shopify storefront on every store's product page; a wrong or dead link would send the store to the wrong page or a password wall. No stored data changes.
**Status:** Approved · 2026-10-29 · **Approved by:** navtej0110, 2026-10-29 · **Skill:** kodion-create-spec v2.6.0
**Task:** `.claude/tasks/541/task.json` · **Branch:** `feature/541-show-the-webstore-preview-for-every-connected` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task title + screenshot · `.claude/attachments/541.png` (the written description was a copy-paste of task #538 — see D1)

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve, at
> any risk. If a row looks wrong, the tables below and Part B have the detail. Part C is for plan mode.

---

# Part A — Review this

```
┌─ AT A GLANCE ─────────────────────────────────────────────────────┐
│ Goal     "Preview" always opens my live webstore, not a dead label│
│ Changes  Webstore row becomes a working link for every store      │
│ Won't    Rename the row, touch Vinted/Instagram rows, sync data   │
│ Keep     Globe icon, "Preview" label, green dot; synced-product   │
│          link; password-wall unlock; brand/collect pages          │
│ Danger   A link to the wrong store, a dead link, or a crashed page│
│ Size     7 reqs · 7 checks · 1 place · Medium risk                │
│ Needs    nothing (Q1 has a sensible default)                      │
│ Verdict  Ready to approve · check D1, D2, D4                      │
└───────────────────────────────────────────────────────────────────┘
```

```
What the store sees on a product page (right column):

  OMNICHANNEL CONNECTIONS
  +-----------------------------------------------+
  | Webstore           Preview    (green)  [open] |  <- now a link
  | Vinted Pro         Coming soon (grey)         |
  | Instagram          Connected  (green)         |
  +-----------------------------------------------+

  "Webstore / Preview" opens the live store in a new tab:
    product is synced  -> that product's storefront page
    not synced yet     -> the store's webstore homepage
```

## 1–3. Summary
**Why:** On a store's dashboard product page, the "Webstore" row in Omnichannel Connections always shows "Preview", but it only becomes a clickable link when that one product is already synced to Shopify. For every other product it's a dead label, so stores can't jump to their live webstore. We want "Preview" to be a working link for every connected store: the product's own storefront page when it's synced, and the store's webstore homepage otherwise — so it's never a dead end.
**Quality:** 93 / 100 · no blockers

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | On the dashboard product page, the "Webstore" row in Omnichannel Connections is a working link for every connected store, not only when the current product is synced to Shopify. | Must | Task title |
| FR-02 | When the current product IS synced to Shopify, the Webstore link opens that product's live storefront page — exactly as it does today. | Must | Task title |
| FR-03 | When the current product is NOT synced, the Webstore link opens the store's webstore homepage (the storefront's front page). | Must | Your answer |
| FR-04 | If the storefront is password-protected, the link still routes through the existing unlock page so the visitor doesn't hit Shopify's password wall — same as the product link today. | Must | Project rules |
| FR-05 | The row keeps its globe icon, "Preview" label and green status dot; only its link behaviour changes. The Vinted Pro and Instagram rows are untouched. | Must | Task title |
| FR-06 | The Webstore link opens in a new browser tab, with safe `rel` (noopener noreferrer) — same as the current product link. | Should | Standard |
| FR-07 | If no webstore URL can be resolved for the store at all (no synced product and no store webstore), the row stays a non-clickable "Preview" label — never a broken link or an error. | Should | AI |

<sub>Must = can't ship without it · Should = soon after · Could = nice to have · Source "AI" = my suggestion, please check it</sub>

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Scope is taken from the **title + screenshot** (the Webstore "Preview" link), not the written description. The written description is word-for-word task **#538** (simplify the admin connection page), which is already specced, approved and merged — a copy-paste leftover. You confirmed this. | Building the description would duplicate shipped work. |
| D2 | "Connected store" is read broadly: every store whose products publish to a live webstore — its own connected Shopify if it has one, otherwise the shared re-e.dk base storefront. So "Preview" works for every active store. | Matches "every connected store" and never leaves a dead label. See Q1 for the narrower reading. |
| D3 | For a not-synced product, "Preview" opens the webstore **homepage** (storefront front page), per your answer. | Your choice over "only when synced" / "hide until synced". |
| D4 | Password-protected storefronts keep routing through the existing unlock page; no password wall. | Preserves today's product-link behaviour. |
| D5 | If no URL can be resolved at all, "Preview" stays a plain non-clickable label (today's behaviour), not a broken link. | A dead or erroring link is worse than a label. |
| D6 | Brand / Ree-Collect product pages are unchanged — they use a different layout that has no Omnichannel Connections panel. | Not part of this screen; out of scope. |

## 10. Questions for you
| # | Question | Blocks | Who answers |
|---|---|---|---|
| Q1 | For a store with no Shopify connection of its own (its products publish to the shared re-e.dk base store), should "Preview" open the **shared base storefront homepage** (default, per D2), or should those stores show "Preview" as a **non-link**? | Nothing | Client |

**To reply:** `approve` · or `D1 change: <what instead>` · or `Q1: <your answer>`
**Not sure?** Open Part B for the detail behind any row above.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| Store / consignor | Views their own product page and clicks "Webstore / Preview" to open their live webstore. |

### 4.2 Key information
| Item | What it holds |
|---|---|
| Webstore link target | The product's live storefront page if the product is synced, otherwise the store's webstore homepage. Routed through the unlock page if the storefront is password-protected. |

</details>

<details>
<summary><b>4.4 Where it appears (1 place · 1 excluded)</b></summary>

### 4.4 Where it appears
**Where it appears**
| Place | What the user should see | Check |
|---|---|---|
| Dashboard → product page (regular item), right column → "Omnichannel Connections" → Webstore row | "Preview" is a working link that opens the live webstore in a new tab | AC-01, AC-02 |

**Not affected (checked)**
| Place | Why |
|---|---|
| Brand / Ree-Collect product pages | They use a different layout with no Omnichannel Connections panel (D6). Verified by AC-07. |

</details>

<details>
<summary><b>5. When things go wrong (5 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| Product is synced to Shopify | "Preview" opens that product's live storefront page in a new tab. |
| Product not synced, store has a webstore | "Preview" opens the store's webstore homepage in a new tab. |
| Storefront is password-protected | "Preview" routes through the unlock page and lands on the store, not Shopify's password wall. |
| No webstore URL can be resolved at all | "Preview" stays a plain, non-clickable label — no broken link, no error. |
| The webstore-URL lookup is slow or fails while the page loads | The product page still loads normally; "Preview" falls back to a non-clickable label. The lookup never blocks or crashes the page. |

</details>

<details>
<summary><b>6. How we know it's done (7 acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given a connected store viewing a product that IS synced to Shopify, when they click "Webstore / Preview", then a new tab opens on that product's live storefront page. | FR-01, FR-02 |
| AC-02 | Given a connected store viewing a product that is NOT synced, when they click "Webstore / Preview", then a new tab opens on the store's webstore homepage. | FR-01, FR-03 |
| AC-03 | Given a password-protected storefront, when the store clicks "Webstore / Preview", then they land on the store via the unlock page, not on Shopify's password wall. | FR-04 |
| AC-04 | Given any product page, then the Webstore row still shows the globe icon, the "Preview" text and a green dot, and the Vinted Pro and Instagram rows look exactly as today. | FR-05 |
| AC-05 | Given the Webstore link, when it is clicked, then it opens in a new browser tab (target `_blank`, `rel="noopener noreferrer"`). | FR-06 |
| AC-06 | Given a store with no resolvable webstore URL at all, then the Webstore row shows "Preview" as a non-clickable label with no broken link and no error. | FR-07 |
| AC-07 | Given a Brand or Ree-Collect product page, then it shows its existing layout with no Omnichannel Connections panel — unchanged from today. | D6 (no spillover) |

</details>

<details>
<summary><b>7. Safety & security (4 apply · rest not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| Outside service (Shopify) | The link only points to the external storefront; no new Shopify writes. Resolving the URL must never block or crash the product page — on slowness or failure it falls back to a non-clickable label (§5). |
| Access control | A store only sees "Preview" on its own product pages, and the resolved homepage is that store's own storefront. The link must never resolve to another store's webstore. |
| Output safety | The external link opens with `rel="noopener noreferrer"` to prevent reverse-tabnabbing. |
| Secrets | The storefront unlock password stays server-side (used only when building the link on the server); it is never exposed to the browser. |

**Not involved (checked):** login/auth (no change) · permissions/roles (no change) · money/payments (none) · personal data (none shown or stored) · saved data/DB writes (none) · deleting (none) · migrations (none) · file upload (none) · input validation (no user input) · rate limits (none).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and design.
- Keep the shared base-store fallback behaviour; webstore-URL resolution must never throw or block the product page (it degrades to a non-clickable label).
- All prices/labels unchanged; this is a link-behaviour change only.

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- On a store's dashboard product page, the right column shows "Omnichannel Connections": Webstore ("Preview", green dot), Vinted Pro ("Coming soon", grey), Instagram ("Connected" or "Not shared yet").
- The Webstore row only becomes a clickable link when the current product is already synced to Shopify; for every other product "Preview" is just a label with no link.
- To reproduce: open a product that has not been synced to Shopify → the Webstore "Preview" row is not clickable.

**Things that could break:** the product-storefront link for already-synced products (must still work); the password-wall unlock routing; the Brand / Ree-Collect product pages (must stay unchanged); the product page must keep loading even if the webstore-URL lookup is slow or fails.

**Attachments:** `541.png` — a dashboard product page ("Stylish Blue and Beige Varsity Jacket") with the Webstore "Preview" row in Omnichannel Connections highlighted, plus the "Your Own Webstore" upsell and the left-nav Webstore entry. (The file is named `task_83_…`, so it may be a reused screenshot, but it matches this task's title.)

</details>

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Full spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `541` · plan file: `.claude/plans/541-show-the-webstore-preview-for-every-connected.md` |
| **Type** | Feature |
| **Lessons that apply** | L1 (check the Preview link in every place it shows — the regular product page; confirm no spillover onto brand/collect pages, AC-07) · L3 (one check per place; keep it small) |
| **Required for Risk Medium** | Copy the Medium-risk checks from `references/risk-matrix.md` §3 into the plan. |
| **Also for this task** | Reuse the existing storefront-URL plumbing, don't reinvent it: `OmnichannelConnections.jsx` (the Webstore row + `webstoreUrl` prop), `getProductById` in `src/actions/productActions.js` (where `shopifyProductUrl` is derived), `resolveStoreForUser` in `src/lib/shopifyStoreResolver.js` (the connected store's `storeDomain`), and `buildStorefrontLink` / `getShopifyStorefrontPassword` in `src/lib/shopifySettings.js` (the password-wall unlock). The homepage URL is the storefront root (`https://<storeDomain>/`) run through `buildStorefrontLink`. Resolution must stay non-throwing and must not block the product page. |

## 13. Technical summary
- **Plan:** `.claude/plans/541-show-the-webstore-preview-for-every-connected.md`
- **Stack:** Next.js App Router. One server action (`getProductById` in `src/actions/productActions.js`) resolves a new `webstoreHomeUrl`; the server component `src/app/dashboard/product/[productId]/page.jsx` passes it to the presentational component `OmnichannelConnections.jsx`. No new models, no DB writes, no Shopify writes. **Still small? yes** — 3 files, link-behaviour only; all plumbing reused (`resolveStoreForUser`, `buildStorefrontLink`, `getShopifyStorefrontPassword`).
- **Acceptance-check coverage:**

| AC | How it's proven | Status |
|---|---|---|
| AC-01 | `webstoreLink = webstoreUrl \|\| webstoreHomeUrl`; when synced, `webstoreUrl` (product page) is used for `href`. Needs a running app + synced product to see live. | ⏸ runtime |
| AC-02 | When not synced, `webstoreUrl` is null → falls back to `webstoreHomeUrl` (store homepage). Needs app + DB/Shopify to see live. | ⏸ runtime |
| AC-03 | Homepage built via `buildStorefrontLink(..., getShopifyStorefrontPassword())` — same `/go` unlock path as the product link. Needs a password-protected store to see live. | ⏸ runtime |
| AC-04 | Code-verified: icon, "Preview" label, green dot and the Vinted/Instagram rows are unchanged; only `href`/`linkable` source changed. | ✅ |
| AC-05 | Code-verified: the `<a>` keeps `target="_blank"` and `rel="noopener noreferrer"`. | ✅ |
| AC-06 | Code-verified: `linkable` requires a truthy `webstoreLink`, else a non-clickable `<div>` renders; `getProductById` returns `null` on any resolution failure. | ✅ |
| AC-07 | Code-verified: `page.jsx` renders `OmnichannelConnections` only in the non-brand/collect branch; brand/collect layout has no panel and is untouched. | ✅ |

## 14. Done report
**Files changed:** `src/actions/productActions.js` (add `webstoreHomeUrl` to `getProductById`), `src/app/dashboard/product/[productId]/page.jsx` (pass the prop), `src/app/dashboard/product/[productId]/OmnichannelConnections.jsx` (prefer product URL, fall back to homepage). Plus bookkeeping: spec, plan file, `task.json`.

**Acceptance checks:** AC-04, AC-05, AC-06, AC-07 ✅ (code-verified, see §13). AC-01, AC-02, AC-03 ⏸ — require a running app with DB/Shopify and (for AC-03) a password-protected storefront; this session has no such environment. Verify on `npm run dev` with real credentials, or on the Vercel preview, before shipping.

**Tests:** No test framework. `npm run lint` and `npm run build` — same as the known-failures list (can't run on this host; no new breakage introduced). Compile check: rely on Vercel's build.

**Deviations from plan:** none.

## Quality check
**Blockers:** none · **Score:** 93 / 100
