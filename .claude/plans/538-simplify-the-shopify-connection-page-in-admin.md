# Plan — Simplify the Shopify connection page in admin (#538)

Spec: `.claude/specs/538-simplify-the-shopify-connection-page-in-admin.md` (Approved) · Type: Feature · Size: Small · Risk: Medium
Branch: `feature/538-simplify-the-shopify-connection-page-in-admin` (already on it — never create another)

## Context

The admin "Send a connection link" page (`/admin/shopify-connections`) lets an admin email a store owner a link to connect their Shopify store. Today the form has redundant fields:
- **"Find store owner"** (a search `<input>`) and **"Store owner"** (a separate `<select>`) do the same job in two controls.
- **"Send link to"** repeats the owner's registered email in an *editable* field, which also lets an admin send the link to any address.

The client wants one searchable store-owner field, the "Send link to" field removed, and the link always sent to the owner's **registered** email. During spec review we also decided: owners of **unclaimed stores** (placeholder `@ree-unclaimed.internal` emails, which can't receive mail) must be excluded from the selector, and the merged field shows the full list and filters as you type. Outcome: a simpler, less error-prone page where a connection link can never be sent to a mistyped or undeliverable address.

## Approach (recommended)

Two files change. No DB/model/schema changes, no new dependencies, no data migration.

### 1. Frontend — `src/app/admin/shopify-connections/page.jsx`

**a) Merge the two owner fields into one custom combobox** (keeps the page's existing native-Tailwind look — user's chosen approach).

Replace the "Find store owner" `<input>` block (lines 227–239) and the "Store owner" `<select>` block (lines 241–263) with a single labelled control — label stays **"Store owner"** (D1).

- Reuse the existing input Tailwind classes (`w-full border border-gray-300 rounded-lg px-3 py-2.5 ...`) so it looks identical to the Shopify-domain field.
- New state: `ownerQuery` (text shown in the input — doubles as search box and selected display), `ownerOpen` (dropdown open), `ownerHighlight` (keyboard highlight index). Keep `form.userId` as the selected id. Remove the old `ownerSearch` state.
- Helper `ownerLabel(u)` = `${u.storename || `${u.firstname||""} ${u.lastname||""}`.trim()} (${u.email})` — reuse the exact text the old `<option>` built (line 254) so the display and the search text stay the same (D3 / FR-03).
- Reshape `filteredOwners` (useMemo, lines 77–87): filter `storeOwners` by `ownerQuery` across `[storename, firstname, lastname, email]` (same fields as today). When the query is empty **or** equals the selected owner's label, return the full list (so focusing with nothing typed, or re-opening after a selection, shows everyone) — FR-02.
- Render below the input a `<ul role="listbox">` shown while `ownerOpen`, each owner an `<li role="option">` with `ownerLabel(u)`; clicking selects. Keep the empty-state hint "No store owners match "…"" when `filteredOwners.length === 0` and the query is non-empty (reuse lines 258–262 text).
- `handleSelectOwner(owner)`: set `form.userId = owner._id`, set `ownerQuery = ownerLabel(owner)`, close the dropdown. (Drop the old `email` prefill at line 97 — no email field any more.)
- Input handlers: `onFocus`/`onClick` → open; `onChange` → set `ownerQuery`, open, and clear `form.userId` if the text no longer equals the selected label (so a stale id isn't submitted after edits); reset highlight.
- **Accessibility (FR §7):** input gets `role="combobox"`, `aria-expanded={ownerOpen}`, `aria-controls`, `aria-activedescendant`; `onKeyDown` handles ArrowDown/ArrowUp (move `ownerHighlight` within `filteredOwners`), Enter (select highlighted), Escape (close). Close on outside click via a `ref` + `mousedown` listener (or `onBlur` with a short timeout).

**b) Remove the "Send link to" field** (lines 279–294) and everything feeding it:
- Remove `email` from `EMPTY_FORM` (line 17).
- Remove `email: form.email.trim()` from the `handleSubmit` POST body (line 123).
- Remove `email: target` from the `handleResend` POST body (line 164); keep the confirm dialog but base its text on `connection.userEmail` (the registered email, where it now goes) instead of `recipientEmail || userEmail`.
- Remove the now-unused `selectedOwner` (line 89) if nothing else uses it.
- On success, reset to `EMPTY_FORM` and clear `ownerQuery` (replaces the `setOwnerSearch("")` at line 135).

**c) Exclude unclaimed stores from the selector** (FR-06): in `fetchStoreOwners` (line 65), reuse the existing marker helper —
`import { isUnclaimedEmail } from "@/lib/storeMatching";` and filter `(u) => u.role === "store" && !isUnclaimedEmail(u.email)`.
Done client-side on purpose: the shared `/api/admin/users` endpoint also feeds the Stores & Users page, which *intentionally* shows unclaimed stores with a badge — so the filter must not go in that API.

**d) Validation wording** (FR-08 / D2 — already present): keep the two existing guards in `handleSubmit` (lines 106–113). Change line 107's message from "Please choose a store owner." to **"Please select a store owner."** to match AC-06 verbatim. The domain guard (line 111, "Please enter the Shopify store domain.") is unchanged (AC-07).

### 2. Backend — `src/app/api/admin/shopify-connections/route.js`

Make the recipient always the owner's registered email and stop honouring the removed field.
- Line 156: destructure `{ userId, shopDomain }` (drop `email`).
- Lines 190–191: replace `const recipientEmail = (email || "").trim() || targetUser.email;` with `const recipientEmail = targetUser.email;`. Update the comment. Keep the validity guard at lines 192–194.
- **Defense-in-depth (covers §5 edge + FR-06 server-side):** after the `role === "store"` check (line 188), reject unclaimed owners — `import { isUnclaimedEmail } from "@/lib/storeMatching";` then `if (isUnclaimedEmail(targetUser.email)) return json({ error: "This store owner has no registered email address, so a connection link can't be sent." }, 400);`
- Update the body-shape doc comment (line 142) from `{ userId, shopDomain, email? }` to `{ userId, shopDomain }`.

No change needed to `createShopifyAuthorizeUrl`, `ShopifyOAuthState` (its `recipientEmail` now simply always equals the registered email), the GET handler, or the email template.

## Reuse (no new code where it exists)
- `isUnclaimedEmail(email)` — `src/lib/storeMatching.js:28` (the single canonical `@ree-unclaimed.internal` marker). Used in both files.
- Existing admin auth guard `requireAdmin()` (route.js:16) — unchanged; admin-only stays as-is (§7 login).
- Existing owner-label text and multi-field search logic — preserved, just relocated into the combobox.

## Acceptance-check mapping

| AC | Covered by | How verified |
|---|---|---|
| AC-01 one "Store owner" field, no "Find store owner", no "Send link to" | Frontend a+b | Load page; visual + DOM |
| AC-02 empty shows full list; typing narrows by store/name/email | Frontend a (`filteredOwners`) | Type a store name, a surname, an email fragment |
| AC-03 unclaimed (`@ree-unclaimed.internal`) not listed | Frontend c (+ server guard) | Search a known unclaimed stub; absent |
| AC-04 selected shows "Name (email)" | Frontend a (`ownerLabel`) | Select an owner; input text |
| AC-05 send goes to registered email + success msg | Backend (recipientEmail) | Send; response `sentTo` = registered email; success banner |
| AC-06 no owner → "Please select a store owner." | Frontend d | Submit with nothing selected |
| AC-07 empty domain → "Please enter the Shopify store domain." | Frontend d (unchanged) | Submit owner-only |
| AC-08 domain field label/placeholder/position unchanged | (no change to that field) | Compare to before |
| AC-09 no field to type/change the recipient | Frontend b | DOM: no email input |

## §4.4 places/stages & §7 coverage
- One place (the admin page) and its stages (open / select / send / empty) all map to the ACs above.
- §7 rows: input/forms (owner + domain required), login & permissions (`requireAdmin`, unchanged), personal data (emails shown to admins only; no hand-typed recipient), stored data (none new), accessibility (combobox keyboard handlers above), breaking other features (email flow + Shopify connect unchanged; recipient now fixed), errors & logging (existing try/catch + friendly messages on page and route preserved).

## Risk (Medium) — release items
- **Backup:** not needed — no data or schema changes.
- **Rollback:** `git revert` the task commit (or redeploy the previous Vercel build). Two-file, UI+handler change; no data to undo.
- **Staging:** verify on a dev/preview deploy with a real-like admin account and at least one claimed and one unclaimed store before merge.

## Verification
1. **Compile:** `NODE_OPTIONS="--max-old-space-size=8192" npm run build` (memory flag required on this host). Must succeed — confirms the `@heroui/react` imports are untouched, the new `isUnclaimedEmail` import resolves, and no unused-var/JSX errors. (Lint can't run here — see `.claude/rules/known-failures.md`.)
2. **Manual, logged in as admin at `/admin/shopify-connections`:** walk AC-01 → AC-09 per the table above. For AC-05 confirm the POST body no longer contains `email` and the response `sentTo` equals the owner's registered address.
3. Confirm "Resend link" in the table still works and now reports the registered email.

## Out of scope
- No change to the connections table, the OAuth callback, the email template, or `/api/admin/users`.
- `ShopifyOAuthState.recipientEmail` schema/comment left as-is (now always equals the registered email); optional tidy only.

## Lessons applied
- **L1:** the recipient email is checked wherever it now shows — the combobox selection ("Name (email)") and the success message / response `sentTo` — after selecting.
- **L3:** checks kept small — one per place/stage; this is a one-screen change.
