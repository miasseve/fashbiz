# Plan — Task #435: Remove demo-mode naming/UI from the two store screens

## Context
leStores-AI shows "demo mode" naming and clutter on the store **Add Product** first-use screen and the **consignor QR** screen (an amber "Demo Mode Active" banner, a "Demo Mode" button, a demo sentence, a heading, a red "Stripe connection required" line, and trust badges). Listing is now free, so the demo naming confuses store owners. The client signed off (2026-10-27) on: **keep the functionality, remove only the demo naming and UI, and rename the button to "Skip for now."** This plan implements the approved spec `.claude/specs/435-remove-demo-mode-from-lestores-ai-and-simplify.md` (Feature · Small · **Low risk**). Outcome: no "demo" naming/banner on the two screens; the button that lets a store continue without Stripe stays and works, labelled **"Skip for now"**.

**Branch:** `feature/435-remove-demo-mode-from-lestores-ai-and-simplify` (already on it; base `feat/pricing-alignment`; **never commit/merge to master** — CLAUDE.md). No new branch.

## Scope: two files, same treatment in each
Each screen has its **own inline copy** — there is no shared component — so every change below is made **twice**, once per file:
- `src/app/dashboard/add-product/Main.jsx` (store Add Product; gate conditional at line 203, product-entry branch 374–399)
- `src/app/dashboard/qr/ConsignorQR.jsx` (consignor QR; gate conditional at line 123, QR branch 273–286)

### Changes (both files)
1. **Remove the amber "Demo Mode Active" banner + "Exit Demo Mode" control.** `Main.jsx:157–202` · `ConsignorQR.jsx:75–120`. Gated by `isInDemoMode`, renders *above* the gate conditional, so removing it clears the banner on both the gate screen and the steps/QR branch.
2. **Remove from the gate screen:** the "Connect Your Payment Gateway" heading (`Main:206–208` · `Consignor:126–128`), the red "Stripe connection required…" pill (`Main:211–226` · `Consignor:131–146`), the demo explanatory sentence (`Main:296–301` · `Consignor:216–221`), and the "Secure / Fast Setup / Trusted" badges (`Main:333–372` · `Consignor:232–271`).
3. **Keep unchanged:** the green "Go to Stripe Connect" button (`Main:229–250` · `Consignor:149–170`) and the "OR" divider (`Main:253–259` · `Consignor:173–179`).
4. **Relabel the second button** "Demo Mode" → **"Skip for now"** — text node only: `Main.jsx:292` · `ConsignorQR.jsx:212`. Keep `onClick={handleDemoMode}`, the `enableDemoMode` action, and `disabled={demoLimitReached}` (spec FR-05).
5. **Keep the limit-reached block, reword the message to drop "demo"** (spec FR-06 / D4):
   - `Main.jsx:307`: "…your free **demo** limit…" → "…your free **upload** limit…". Keep the "Upgrade Now — Subscribe to Go Live" link (327) and the "Limit reached" badge (269–271).
   - `ConsignorQR.jsx:226`: "Your **demo period** has ended. Connect Stripe above to start accepting real payments." → "You've reached your free **upload** limit. Connect Stripe above to start accepting real payments." Keep the "Expired" badge (189–191).
6. **Clean up now-unused code** (keep `next lint` clean): remove `handleExitDemoMode` (`Main:63–66` · `Consignor:45–47`) and `isInDemoMode` (`Main:69–73` · `Consignor:67–70`); remove `stripedata` (`Main:25–27` · `Consignor:63–66`) only if unused after that. Leave `handleDemoMode`, the `enableDemoMode` import, `demoLimitReached` and the `isDemo` prop.

### Out of scope — do NOT touch (spec "Must not change")
"Book a demo with Mia" upsell links (`Main.jsx:102–115`), product steps, stepper, QR code/download, sidebar "Stripe Connect" link (`sidebar.jsx:146`), cart, `/try`, the 200-product limit logic, pricing/checkout/subscription, subscription "demo/trial" emails.

## AC coverage (spec §6)
- AC-01/02 store cleaned + "Skip for now" ← changes 1,2,4
- AC-03 "Skip for now" still enters product steps ← change 4 keeps action
- AC-04 consignor QR cleaned + "Skip for now" ← changes 1,2,4 in ConsignorQR
- AC-05 skipped store reaches Stripe Connect ← sidebar untouched
- AC-06 no "demo" naming remains ← changes 1,2,4,5 + grep
- AC-07 responsive 375px + desktop ← manual

## Verification (no test runner)
1. Before: screenshots (375px + desktop) + `npm run lint` + `npm run build` baseline.
2. After: `npm run lint` clean, `npm run build` succeeds.
3. Store no-Stripe: Add Product shows only green button + OR + "Skip for now"; click → product steps; no banner.
4. Consignor no-Stripe: same; click "Skip for now" → QR code.
5. AC-05: sidebar "Stripe Connect" opens `/dashboard/stripe-connect`.
6. AC-06: grep `src/` "demo" on these screens → only the two "Book a demo with Mia" upsell links remain.
7. AC-07: layout fits 375px + desktop, both buttons visible.

## Rollback
Revert this task's commits on `feat/pricing-alignment` and redeploy.
