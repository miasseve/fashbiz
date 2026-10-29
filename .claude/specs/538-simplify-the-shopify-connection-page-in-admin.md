# Simplify the Shopify connection page in admin

`538` · Feature · Small size · **Medium risk** — admin form that emails a store-connection link (outside service); the change alters how the recipient is determined and filters owners by email. No stored data changes.
**Status:** Approved · 2026-10-29 · **Approved by:** navtej0110, 2026-10-29 · **Skill:** kodion-create-spec v2.6.0
**Task:** `.claude/tasks/538/task.json` · **Branch:** `feature/538-simplify-the-shopify-connection-page-in-admin` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task description · `.claude/attachments/538.png`

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve, at
> any risk. If a row looks wrong, the tables below and Part B have the detail. Part C is for plan mode.

---

# Part A — Review this

```
┌─ AT A GLANCE ─────────────────────────────────────────────────────┐
│ Goal     One searchable store-owner field; no recipient field     │
│ Changes  Merge the two owner fields; remove "Send link to"        │
│ Won't    Touch the Shopify store domain field or who can send     │
│ Keep     Link still goes to the owner's real registered email     │
│ Danger   A link sent to a wrong or undeliverable address          │
│ Size     9 reqs · 9 checks · 1 place · Medium risk                │
│ Needs    nothing (both questions answered)                        │
│ Verdict  Ready to approve · check D1, D2, D3                      │
└───────────────────────────────────────────────────────────────────┘
```

```
What the admin sees after this change:

  Send a connection link
  ┌──────────────────────────────────────────────────┐
  │ Store owner                                        │
  │ [ Search by store, name or email           ▾ ]    │
  │   selected: Store Owner A (owner@example.com)      │
  │ Shopify store domain                               │
  │ [ their-store.myshopify.com                   ]    │
  └──────────────────────────────────────────────────┘
  [ > Send connection link ]

  One searchable "Store owner" field · no "Send link to" field
```

## 1–3. Summary
**Why:** The admin "Send a connection link" page has two fields that do the same job — a "Find store owner" search box and a separate "Store owner" dropdown — plus a "Send link to" field that just repeats the email already shown with the owner. This is extra work and invites mistakes (sending to a mistyped address). We want one searchable store-owner field, no separate recipient field, and the link always sent to the owner's registered email.
**Quality:** 95 / 100 · no blockers

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | The "Find store owner" search box and the separate "Store owner" dropdown are replaced by a single field where the admin searches (by store name, person name or email) and selects the owner in the same control. | Must | Task description |
| FR-02 | Before the admin types, the field shows the full list of selectable owners to scroll, and narrows to matches as the admin types. | Must | Your answer |
| FR-03 | The selected owner is shown with their registered email in the field, e.g. "Store Owner A (owner@example.com)", so the recipient stays visible without a separate field. | Must | Task description |
| FR-04 | The "Send link to" field is removed from the page. | Must | Task description |
| FR-05 | The connection link is sent to the selected owner's registered email; the admin cannot edit or override the recipient. | Must | Task description |
| FR-06 | Only owners with a real registered email appear in the selector; owners of unclaimed stores (placeholder @ree-unclaimed.internal emails) are excluded. | Must | Your answer |
| FR-07 | The "Shopify store domain" field is unchanged — same label, placeholder and position. | Must | Task description |
| FR-08 | The link can't be sent until a store owner is selected and a Shopify store domain is entered; a clear message is shown for each missing one. | Should | AI |
| FR-09 | After selecting an owner and entering a domain, pressing "Send connection link" sends the link to the owner's registered email, as before. | Must | Task description |

<sub>Must = can't ship without it · Should = soon after · Could = nice to have · Source "AI" = my suggestion, please check it</sub>

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | The merged control keeps the label "Store owner" (the separate "Find store owner" heading is dropped, since it's now one field). | It's a single control now; one label avoids repeating the same idea. |
| D2 | When no owner is selected and the admin presses Send, show "Please select a store owner." and block sending — mirroring today's "Please enter the Shopify store domain." (FR-08). | Today's dropdown always had a value; a searchable field can be left empty, so it needs the same guard. |
| D3 | The selected owner is shown as "Name (registered email)", matching today's dropdown text (FR-03). | Keeps the recipient visible after removing "Send link to", with no new design. |

## 10. Questions for you
N/A: no open questions. The two that came up were decided with you in Step 3 — exclude unclaimed stores (FR-06) and show the full list then filter as you type (FR-02).

**To reply:** `approve` · or `D1 change: <what instead>` · or `D2 change: <what instead>`
**Not sure?** Open Part B for the detail behind any row above.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| Admin | Search for and select a store owner, enter the Shopify store domain, and send the connection link. No one else can reach this page. |

### 4.2 Key information
| Item | What it holds |
|---|---|
| Store owner | The owner's name and registered email — the email is the link's recipient. |
| Shopify store domain | The store's `their-store.myshopify.com` address. |

</details>

<details>
<summary><b>4.4 Where it appears and its life (1 place · 4 stages · tester checklist)</b></summary>

### 4.4 Where it appears and its life

**Where it appears**
| Place | What the user should see | Check |
|---|---|---|
| Admin → "Send a connection link" page | One searchable "Store owner" field, the "Shopify store domain" field, the "Send connection link" button — and no "Find store owner" box and no "Send link to" field. | AC-01 |

**Life of the item**
| Stage | What should happen | Check |
|---|---|---|
| Open the page | Merged field shows the full owner list; no "Send link to" field. | AC-01, AC-02 |
| Select an owner | The field shows "Name (registered email)". | AC-04 |
| Send | The link goes to the selected owner's registered email, with a success confirmation. | AC-05 |
| Nothing selected / empty domain | Sending is blocked with a clear message for each. | AC-06, AC-07 |

**What testers usually find missing**
| # | Question | Answer |
|---|---|---|
| C1 | Still there after a page refresh or on another device? | N/A — the form is transient; it saves no draft and no new record. |
| C2 | A new status or type has its own colour, badge, filter option and legend entry? | N/A — no new status or type. |
| C3 | No word or label shown twice? | Yes — the recipient email shows once (with the owner); the duplicate "Send link to" is removed (FR-04). |
| C4 | Timers, tracking, counters, notifications and emails start and stop when they should? | Yes — the connection-link email still sends, to the registered email (AC-05). |
| C5 | Validation, empty state and error message covered? | See §5. |
| C6 | Same rules on every screen (who can see or edit it)? | Yes — admin-only page, unchanged. |

</details>

<details>
<summary><b>5. When things go wrong (6 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| No store owner selected, then Send pressed | "Please select a store owner." Sending is blocked. |
| Shopify store domain empty, then Send pressed | "Please enter the Shopify store domain." Sending is blocked (unchanged from today). |
| An owner with no deliverable email (e.g. unclaimed store) | Not shown in the selector (FR-06), so it can't be chosen. |
| The email fails to send (mail service error) | "Couldn't send the connection link. Please try again." The error is logged; existing behaviour preserved. |
| Send pressed twice quickly | The link is sent once; the button is guarded while sending, as today. |
| Existing data | No stored records change. Store owners and their registered emails are untouched; only the selector's list and the recipient handling change. |

</details>

<details>
<summary><b>6. How we know it's done (9 acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given the admin opens "Send a connection link", when the page loads, then there is one "Store owner" field, no separate "Find store owner" box, and no "Send link to" field. | FR-01, FR-04 |
| AC-02 | Given the empty "Store owner" field, when nothing is typed the full owner list is shown, and when "brand" is typed the list narrows to owners matching "brand" by store, name or email. | FR-02 |
| AC-03 | Given an owner whose registered email is "someone@ree-unclaimed.internal", when the admin searches for it, then it does not appear in the selector. | FR-06 |
| AC-04 | Given the admin selects an owner, when selected, then the field shows "Store Owner A (owner@example.com)" — name with registered email. | FR-03 |
| AC-05 | Given "Store Owner A (owner@example.com)" is selected and domain "their-store.myshopify.com" is entered, when the admin clicks "Send connection link", then the link is sent to owner@example.com and a success confirmation is shown. | FR-05, FR-09 |
| AC-06 | Given no owner is selected, when the admin clicks "Send connection link", then sending is blocked and "Please select a store owner." is shown. | FR-08 |
| AC-07 | Given an owner is selected but the Shopify store domain is empty, when the admin clicks "Send connection link", then sending is blocked and "Please enter the Shopify store domain." is shown. | FR-07, FR-08 |
| AC-08 | Given the page, when the "Shopify store domain" field is compared to today, then its label, placeholder ("their-store.myshopify.com") and position are unchanged. | FR-07 |
| AC-09 | Given an owner is selected, when the admin looks at the form, then there is no field to type or change the recipient email. | FR-05 |

</details>

<details>
<summary><b>7. Safety & security (7 apply · 9 not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| User input / forms | The Shopify store domain is required (unchanged); an owner must be selected; there is no free-text recipient any more. |
| Login & permissions | Admin-only page; unchanged — only admins reach and use it. |
| Personal data & consent | Owner name and registered email are shown to admins only, as today; no new exposure, and the recipient email is no longer typed by hand. |
| Stored data | Nothing new is saved; existing owner records are unchanged. |
| Accessibility | The searchable owner field must be operable by keyboard — type to filter, arrow keys to move, Enter to select — like a standard select. |
| Breaking other features | The connection-link email flow and Shopify store connection must behave exactly as before; only the recipient is now fixed to the registered email. |
| Errors & logging | A failed send shows a friendly message and is logged; the admin never sees a crash. |

**Not involved (checked):** showing text safely (no user-authored text rendered as code) · legal/honesty (no claims or consent content) · secrets & keys (none exposed; unchanged) · payments (none) · deleting (nothing deleted) · performance (filters an owner list already loaded today) · mobile & browsers (admin desktop tool, unchanged) · SEO (admin page, not indexed) · rollback (revert the field change and redeploy).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing admin UI conventions and HeroUI components.
- Unclaimed-store emails (`@ree-unclaimed.internal`) are placeholders and must never receive a connection link (FR-06).

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- The admin "Send a connection link" page shows, top to bottom: a "Find store owner" search box ("Search by store name, name or email"); a separate "Store owner" dropdown showing the chosen owner as "name (email)"; a "Shopify store domain" field; and a "Send link to" field prefilled with the owner's registered email but editable. A "Send connection link" button sends the link.
- Two fields (Find store owner + Store owner) do the same job, and "Send link to" repeats the email already shown with the owner.

**Things that could break:** the connection-link email delivery (must still reach the registered email); the Shopify store domain validation; reaching owners of unclaimed stores (now intentionally excluded from the selector).

**Attachments:** `538.png` — the current "Send a connection link" form, with the two owner fields and the "Send link to" field red-boxed for change and removal.

</details>

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Full spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `538` · plan file: `.claude/plans/538-simplify-the-shopify-connection-page-in-admin.md` |
| **Type** | Feature |
| **Lessons that apply** | L1: check the recipient email shows correctly wherever it appears (the selected-owner field) after selecting. L3: keep the checks small — one check per place/stage, this is a one-screen task. |
| **Required for Risk Medium** | §5 all failure cases · §7 all 16 areas checked · §4.1 included (admin only) · no backup needed · rollback as written steps · test on staging · §14 filled in full. |
| **Also for this task** | Confirm where the recipient email is resolved server-side after "Send link to" is removed, so the link still goes to the registered email (FR-05/FR-09). Confirm how unclaimed stores are filtered out of the owner query (FR-06). |

## 13. Technical summary
**Plan:** `.claude/plans/538-simplify-the-shopify-connection-page-in-admin.md`
**Stack (proof):** Next.js 16 App Router, JS/JSX, React 19 client component (`src/app/admin/shopify-connections/page.jsx` — `"use client"`); route handler (`src/app/api/admin/shopify-connections/route.js`); Mongoose `User` lookup; Nodemailer send via `src/mails/shopifyConnectRequest.js`. No new dependencies.
**Risk:** unchanged — Medium.

**Layers**
| Layer | What changed |
|---|---|
| Frontend | Merged owner search + select into one custom combobox (native Tailwind, keyboard + ARIA); removed "Send link to"; excluded unclaimed owners; validation message aligned to AC-06. |
| Backend | Recipient forced to `targetUser.email`; dropped the `email` override param; added unclaimed-owner guard. |
| Data | None — no schema/model/migration. `ShopifyOAuthState.recipientEmail` now always equals the registered email. |
| Security | Admin-only (`requireAdmin`, unchanged); link can no longer be sent to an arbitrary or placeholder address. |
| Integrations | Nodemailer send + Shopify authorize-URL creation unchanged; only the recipient source changed. |
| Testing | `npm run build` is the compile check — see §14 (host OOM). No test runner in project. |
| Release | Vercel auto-deploy from `master`; rollback = `git revert`/redeploy. No backup needed. |

**Rows:** Database: none · API: `POST /api/admin/shopify-connections` body now `{ userId, shopDomain }` (dropped `email`) · Settings: none · Libraries: none added (`isUnclaimedEmail` reused from `src/lib/storeMatching.js`) · Permissions: admin/developer only, unchanged.

**Acceptance-check mapping:** see §14.

## 14. Done report

**Files changed**
- `src/app/admin/shopify-connections/page.jsx` — combobox merge, "Send link to" removal, unclaimed exclusion, validation wording, email dropped from POST bodies.
- `src/app/api/admin/shopify-connections/route.js` — recipient = registered email, `email` param removed, unclaimed guard, doc comment.

**Acceptance checks**

| AC | Status | Proof |
|---|---|---|
| AC-01 one "Store owner" field, no "Find store owner"/"Send link to" | ✅ | Code: single combobox at page.jsx:286–335; old blocks removed; grep for `ownerSearch`/`Send link to`/`form.email` → no matches. |
| AC-02 empty shows full list; typing filters by store/name/email | ✅ | Logic at page.jsx:98–108. Confirmed by developer in dev (localhost:3000, admin) 2026-10-29. |
| AC-03 unclaimed (`@ree-unclaimed.internal`) not listed | ✅ | Client filter page.jsx:70–74 + server guard route.js:194–199 (both via `isUnclaimedEmail`). Confirmed by developer in dev (localhost:3000, admin) 2026-10-29. |
| AC-04 selected shows "Name (email)" | ✅ | `ownerLabel` page.jsx:88–91, set on select (113). Confirmed by developer in dev (localhost:3000, admin) 2026-10-29. |
| AC-05 link sent to registered email + success msg | ✅ | Backend `recipientEmail = targetUser.email` route.js:201; `email` no longer sent (page.jsx:179–182); backend compiled & ran (dev 401). Send confirmed by developer in dev (localhost:3000, admin) 2026-10-29. |
| AC-06 no owner → "Please select a store owner." | ✅ | Code: page.jsx:165–167 (exact string). |
| AC-07 empty domain → "Please enter the Shopify store domain." | ✅ | Code: page.jsx:169–171 (unchanged guard). |
| AC-08 domain field label/placeholder/position unchanged | ✅ | Code: domain block untouched by the diff. |
| AC-09 no field to type/change the recipient | ✅ | Code: "Send link to" block removed; no email input remains (grep clean). |

**Test results**
- Lint: not run — same as the known-failures list.
- Build (`NODE_OPTIONS=--max-old-space-size=8192 npm run build`): ⏸ **could not complete on this host** — three attempts crashed in Turbopack's CSS pipeline (`globals.css`) with a segfault then two out-of-memory errors (heap/zone), none referencing the edited files. Recorded in `.claude/rules/known-failures.md`. The compile check must run on a higher-RAM machine or CI/Vercel.
- Dev server (an existing `next dev` already running on :3000, which hot-reloads these edits): `GET /api/admin/shopify-connections` → **HTTP 401 `{"error":"Unauthorized"}`**, so `route.js` (new `isUnclaimedEmail` import, recipient + guard changes) **compiled and executed cleanly** — a syntax/import error would be a 500 overlay. `GET /admin/shopify-connections` redirects to the login page (admin-auth middleware) and renders it with no Turbopack compile-error markers, so the app is healthy — but the admin `page.jsx` itself is **not** compiled by an unauthenticated request, so AC-02/03/04/05(UI) still need an authenticated run. `page.jsx` is otherwise inspection-verified.

**Deviations from plan:** none. All nine acceptance checks pass (AC-01/06/07/08/09 by code, AC-02–05 confirmed by the developer in the running dev server, backend also confirmed by a dev 401). The only gap is the full `npm run build` compile check, which can't complete on this host (OOM — see known-failures); it will run on Vercel at deploy.

## Quality check
**Blockers:** none (B1–B14 checked) · **Score:** 95 / 100
- Why and goals 5/5 · Requirements 15/15 · §4.4 10/10 · §5 15/15 · §6 20/20 · §7 15/15 · §9+§10 10/10 · §11 5/5 · Length & clarity 3/5 (−2: Part A carries the box plus an output preview, a touch dense for a one-screen task).
