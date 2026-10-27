# Remove demo mode from leStores-AI and simplify the page

`435` · Feature · Small size · **Low risk** — relabels one button and removes demo wording, the demo banner and surrounding clutter on the store Add Product and consignor QR screens; both buttons and their actions are kept, nothing is stored, no input, no outside service, and no flow, permission or payment logic changes.
**Status:** Approved · 2026-10-27 · **Approved by:** navtej0110 (developer), 2026-10-27 · **Skill:** kodion-create-spec v2.2.1
**Task:** `.claude/tasks/435/task.json` · **Branch:** `feature/435-remove-demo-mode-from-lestores-ai-and-simplify` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task description · three client screenshots (annotated Connect-Stripe screen, a clean one, and the product-entry step with the demo banner) · the live store and consignor screens · the client's sign-off on 2026-10-27 (keep the button and its action, remove only the demo naming and UI)

> **Reviewer:** read Part A only (about 1 minute), then reply **approve**, or say what to change.
> Part B has the full detail if something looks wrong. Part C is for plan mode; you don't need to review it.
> Who approves depends on the risk: Low → developer or senior · Medium → senior · High → senior, plus the client if business rules change.

---

# Part A — Review this

## 1–3. Summary
**Why:** The store Add Product screen and the consignor QR screen still show "demo mode" naming and clutter the client asked to clear: an amber "Demo Mode Active" banner with an "Exit Demo Mode" control, a "Demo Mode" button, a demo explanatory sentence, a heading, a red "Stripe connection required" line, and "Secure / Fast Setup / Trusted" badges. The client has confirmed the **functionality stays** — a store can still continue without connecting Stripe — only the demo **naming and extra UI** are removed, and the button is renamed.

**Most important result:** No "demo" naming or demo banner appears on the two screens; the button that lets a store continue without Stripe stays and works, now labelled **"Skip for now"**.

| | |
|---|---|
| **What changes** | The "Demo Mode" button is renamed to **"Skip for now"** (same action). The amber "Demo Mode Active" banner, "Exit Demo Mode", the heading, the red "Stripe connection required" line, the demo sentence, and the "Secure / Fast Setup / Trusted" badges are removed. The green "Go to Stripe Connect" button and the "OR" divider stay. The same treatment is applied to the consignor QR screen. |
| **We will** | Relabel the button to "Skip for now" keeping its action; keep "Go to Stripe Connect" + the "OR" divider; remove the amber banner, "Exit Demo Mode", the heading, the red line, the demo sentence and the badges — on both the store Add Product screen and the consignor QR screen; reword any kept message that still says "demo". |
| **We won't (this time)** | Change the product steps, the stepper, the cart, the public guest "try" page, the product limit, or pricing / checkout / subscription handling. No flow change — both ways forward (connect Stripe, or skip) stay. |
| **Must never happen** | Any "demo" naming or demo banner still shows on the two screens; the "Skip for now" button or the "Go to Stripe Connect" button loses its action; a store that skipped Stripe can no longer reach the Stripe Connect page to connect later; the product steps or the QR code stop rendering; any commit, push or merge goes to `master` instead of `feat/pricing-alignment`. |
| **Must not change** | The actions behind "Go to Stripe Connect" and "Skip for now" · the product steps, the QR code and the stepper · the product limit · the cart · the public "try" page · pricing, checkout and subscription handling · the "Book a demo with Mia" sales links · the "Stripe Connect" link in the dashboard sidebar. |
| **Coverage** | 7 requirements · 7 acceptance checks · 4 places · 16 safety areas (5 apply) |
| **Quality** | 95 / 100 · no blockers |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | On the store Add Product first-use screen, rename the "Demo Mode" button to **"Skip for now"**, keeping its existing action (the store still continues into the product steps). Keep the green "Go to Stripe Connect" button and the "OR" divider. | Must | Client · Your answer |
| FR-02 | On the store Add Product first-use screen, remove the "Connect Your Payment Gateway" heading, the red "Stripe connection required to accept payments" line, the demo sentence, and the "Secure / Fast Setup / Trusted" badges. | Must | Client screenshots |
| FR-03 | Remove the amber "Demo Mode Active" banner and the "Exit Demo Mode" control everywhere a store sees them (the first-use screen and the product-entry step). | Must | Client · Task description |
| FR-04 | On the consignor QR screen, apply the same treatment: rename the "Demo Mode" button to "Skip for now" (action kept), keep "Go to Stripe Connect" and the "OR" divider, and remove the amber banner, "Exit Demo Mode", the heading, the red line, the "Demo mode lets you generate QR codes…" and "Your demo period has ended…" sentences, and the badges. | Must | Client · Your answer |
| FR-05 | Both "Skip for now" buttons keep their existing action, so a store (Add Product) or consignor (QR) with no Stripe connected can still continue exactly as before. | Must | Client |
| FR-06 | No "demo", "demo mode", "demo limit", "test flows" or "free demo" naming remains visible on these two screens. Any kept message that named "demo" (for example the limit-reached message) is reworded to drop "demo" while keeping its meaning. | Must | Task description |
| FR-07 | After the changes, the Add Product screen and the consignor QR screen still read correctly on a 375px phone and on desktop. | Must | Task description |

**Priority:** Must = can't ship without it · Should = important, can follow soon after · Could = nice to have
**Source:** Task description · Your answer · Client · Project rules · Standard · AI (a small UI suggestion — please check)

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Set **Risk = Low** and **Size = Small**. | Relabels one button and removes wording / a banner / clutter on two similar screens, keeping both buttons and their actions — nothing stored, no input, no outside service, no permission or payment logic change. |
| D2 | Button label is **"Skip for now"** (keeping its existing action). | Client-confirmed; shortest sensible non-demo label, clear next to "Go to Stripe Connect" with the "OR" divider. |
| D3 | The **consignor QR screen is in scope** and gets the same treatment as the store screen. | Your instruction on 2026-10-27 (previously it was out of scope). |
| D4 | The limit-reached message's **"free demo limit" wording is reworded to drop "demo"** (for example "free upload limit"); the "Limit reached" / "Expired" badge keeps its wording. | Satisfies "no demo naming remains" (FR-06) while keeping the message's purpose; the product-limit logic itself is not changed. |
| D5 | Removing "Exit Demo Mode" does **not** strand a store that skipped Stripe. | The dashboard sidebar has a permanent "Stripe Connect" link (shown to all dashboard users), so a store can still connect Stripe later; this was verified in the code (see §11). |
| D6 | **Keep the "Book a demo with Mia" sales links** unchanged. | They live in a separate popup, not on these screens, and are a sales-call booking, not the product's "demo mode". |
| D7 | Type kept as **Feature** to match the branch name. | Avoids renaming the branch created by /start-task. |

## 10. Questions for you
None — all scope decisions are confirmed by the developer and the client.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| Store owner | On Add Product: connect Stripe, or "Skip for now" to continue adding products without Stripe (same as the old "Demo Mode" button) |
| Consignor | On the QR screen: connect Stripe, or "Skip for now" to continue to the QR code without Stripe |

### 4.2 Key information
N/A: Small task — no information is shown or saved differently; only wording and elements change.

</details>

<details>
<summary><b>4.4 Where it appears and its life (4 places)</b></summary>

### 4.4 Where it appears and its life
**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| Store Add Product — first-use screen (no Stripe connected) | "Go to Stripe Connect" + "OR" + "Skip for now" (no "Demo Mode" text); no heading, no red "Stripe connection required" line, no demo sentence, no badges | AC-01, AC-02, AC-06 |
| Store Add Product — product-entry step | No amber "Demo Mode Active" banner, no "Exit Demo Mode" control; the steps work as today | AC-03 |
| Consignor QR screen | "Go to Stripe Connect" + "OR" + "Skip for now"; no amber banner, no "Exit Demo Mode", no heading, no red line, no demo sentences, no badges | AC-04, AC-06 |
| Dashboard sidebar | The "Stripe Connect" link still appears, so a store/consignor who skipped can connect Stripe later | AC-05 |

**Life of the item:** N/A: Small task — a one-time relabel and element removal, not a stored item with stages; see §6.
**What testers usually find missing:** N/A: Small task — covered by the places above and §6.

</details>

<details>
<summary><b>5. When things go wrong (4 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| A store with no Stripe clicks "Skip for now" on Add Product | It continues into the product steps, exactly as the old "Demo Mode" button did — no demo wording or banner anywhere |
| A consignor with no Stripe clicks "Skip for now" on the QR screen | It reaches the QR code, exactly as before, with no demo wording or banner |
| A store that skipped Stripe later wants to connect Stripe | It uses the "Stripe Connect" link in the dashboard sidebar (or "Go to Stripe Connect" on the screen) and completes Stripe onboarding |
| The old product limit is reached | The message shows with no "demo" wording (reworded from "free demo limit"); the limit behaviour itself is unchanged |

</details>

<details>
<summary><b>7. Safety & security (5 apply · 11 not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| Mobile & browsers | Both screens are checked on a 375px phone and current desktop browsers after the changes (AC-07). |
| Accessibility | The renamed "Skip for now" button stays keyboard-reachable with a visible focus outline and readable contrast. |
| Breaking other features | Both buttons keep their actions (AC-03, AC-04, AC-05); the product steps, the QR code, the stepper, the cart, the public "try" page, the product limit and the sidebar "Stripe Connect" link are left working. |
| Errors & logging | No screen loses the action behind either button; the demo action behind "Skip for now" is unchanged; existing error behaviour is kept. |
| Rollback | Undo by reverting this task's commits on `feat/pricing-alignment` and redeploying. |

**Not involved (checked):** User input / forms (no fields change) · Showing text safely (text is only removed or renamed, none added from users) · Login & permissions (who reaches these screens is unchanged) · Personal data & consent (none shown or saved) · Legal / honesty (no claims change) · Secrets & keys (none touched) · Stored data (nothing saved differently) · Payments & money (the connect action and payment taking are unchanged) · Deleting anything (no records deleted) · Performance (no lists or queries change) · SEO (no public pages change).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and the `DESIGN.md` guide for the store screens.
- Scope guard: only the store Add Product screen and the consignor QR screen change. Do not change the product steps, the stepper, the cart, the public "try" page, the product limit, or pricing / checkout / subscription handling.
- The words "demo" and "trial" in subscription emails are part of subscription handling and are out of scope — do not change them.
- Branch and release rule from the task: all commits, pushes and the final merge go to `feat/pricing-alignment`; never to `main` or `master`.

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- On the store Add Product first-use screen (no Stripe connected), the store sees a "Connect Your Payment Gateway" heading, a red "Stripe connection required to accept payments" line, a green "Go to Stripe Connect" button, an "OR" divider, a "Demo Mode" button, the sentence "Demo mode lets you add products and test flows without real payments. Perfect for testing your setup!", and "Secure / Fast Setup / Trusted" badges. Clicking "Demo Mode" takes the store into the product steps. When the old limit is reached, a "You've reached your free demo limit…" message and an "Upgrade Now" link show here.
- Once a store is in the no-payment / demo state, an amber "Demo Mode Active" banner with an "Exit Demo Mode" button shows on the product-entry screen. ("Exit Demo Mode" just navigates to the Stripe Connect page; it does not actually turn demo off.)
- The consignor QR screen shows the same heading, red line, green button, "OR", "Demo Mode" button, amber banner, "Exit Demo Mode", demo sentences ("Demo mode lets you generate QR codes…", "Your demo period has ended…") and badges.
- The dashboard sidebar shows a "Stripe Connect" link for all dashboard users (not role-gated), so a store/consignor can open the Stripe Connect page at any time — this is independent of the "Exit Demo Mode" control being removed.

**Things that could break:** the action behind the renamed "Skip for now" button (it must keep doing what the old "Demo Mode" button did); the "Go to Stripe Connect" action; the product-steps / QR-code branch of each screen (only the demo/clutter elements are removed); the layout after the elements are removed.

</details>

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**. No question in §10 blocks planning or coding.
   **Required for Risk Low:** cover the main failure cases in §5; check all 16 safety areas in §7 (short reasons are fine); one-line rollback; staging check optional; developer or senior may approve.
   If the code scan shows more danger, raise the Risk, explain why in §13, and follow the higher level's checks.
   **For this task type (Feature):** reuse the existing screens and buttons; relabel and remove only; do not add components. No API or backend changes are expected — do not touch the action behind either button or the product-limit logic.
   **Lessons that apply:** L3 — keep the checks small; this is a Small task, one check per place the change appears. L4 — the demo naming appears on two near-identical screens; remove it on both, not just one.
2. **Detect the tech stack** from the project's own files (Next.js App Router, React — confirm) and read the project rules and `DESIGN.md`. Record findings in §13 with proof.
3. **Find this project's own checks** (`npm run lint`, `npm run build`; no test runner is configured). Run them and record "before" results. Never invent a command.
4. **Plan every layer this stack needs**, or write "N/A" with a reason:
   - Frontend: the store Add Product first-use screen and product-entry step, and the consignor QR screen — relabel the button to "Skip for now", keep its action and the "Go to Stripe Connect" button and "OR" divider, remove the amber banner + "Exit Demo Mode" + heading + red line + demo sentence(s) + badges, and reword the limit-reached "free demo limit" message to drop "demo"; mobile + desktop; accessibility of the renamed button.
   - Backend: N/A — do not change the action behind "Skip for now" (the existing demo-enable action) or the product-limit logic.
   - Data: N/A — nothing stored changes.
   - Security: N/A — who reaches these screens is unchanged; the sidebar "Stripe Connect" link stays.
   - Integrations: N/A — the Stripe-connect action is unchanged.
   - Testing: no runner — browser / manual checks for each AC, on phone and desktop.
   - Release: deploy to `feat/pricing-alignment`; rollback by reverting this task's commits.
   **Task-specific guard:** **relabel, do not remove, the button** (keep the action it calls) on both screens, so no store/consignor is blocked. Keep the "Go to Stripe Connect" button, the "OR" divider, the product steps, the QR code, the stepper, the sidebar "Stripe Connect" link, the cart, the public "try" page, the product limit, and all pricing / checkout / subscription code. Do not touch subscription "demo / trial" email wording.
5. Write the full technical plan to `.claude/plans/435-remove-demo-mode-from-lestores-ai-and-simplify.md`.
6. The plan must map every AC (§6), every place in §4.4, and every row in §7 (areas that apply) to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. Capture a "before" baseline (screenshots of both screens on phone + desktop, and lint/build results) first, because §7 says these must not visibly regress.
9. **Then fill §13 below** with the summary of the plan. Change nothing in §1–§11.
10. Ask for approval of the plan before coding.
    **Branch:** the header says "created by /start-task" — you're already on it. Check with `git branch --show-current`, and never create another branch. **Never commit, push, merge, deploy or open a PR** — `/ship` does that later, to `feat/pricing-alignment`.
11. After coding, fill §14. Never write "Pass" without proof.
12. **Timesheet logging** (this task has a task file). Run each once, when it becomes true:
    - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh 435 plan`
    - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh 435 implement`
    - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh 435 validate`
    - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh 435 iterate` (each round)
    Also set `"plan": ".claude/plans/435-remove-demo-mode-from-lestores-ai-and-simplify.md"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on; it's resent later.

Before asking for plan approval, check:
- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every AC and every place in §4.4 and row in §7 (areas that apply) is mapped to a task and a check
- [ ] Both buttons keep their actions (AC-03/04/05); only the demo naming/banner/clutter is removed
- [ ] The product steps, QR code, stepper, sidebar link, cart, "try" page, product limit and pricing/checkout/subscription code are untouched
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Any Risk change is explained

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary

**Plan file:** `.claude/plans/435-remove-demo-mode-from-lestores-ai-and-simplify.md`
**Risk after code scan:** same (Low) — change confined to two client components; no data, auth or payment logic touched.

**Project scan**
| Item | Finding | Proof (file or command) |
|---|---|---|
| Tech stack | Next.js 16 App Router, React 19; both targets are `"use client"` components | `Main.jsx:1`, `ConsignorQR.jsx:1` |
| Project rules read | CLAUDE.md (conventions, base branch), DESIGN.md | repo root |
| Checks this project has | `npm run build` (next build). `npm run lint` = `next lint` is **broken pre-existing** (Next 16 removed the command → "Invalid project directory …\lint"); `npx eslint` also fails pre-existing (eslint-config-next needs the `typescript` module, not installed) | package.json; build output; eslint error |
| Results of those checks before any change | Lint unavailable (pre-existing breakage). Build baseline not captured. | — |
| Code behind §11 | Inline gate/banner blocks on the two screens | Main.jsx, ConsignorQR.jsx |
| What depends on the code being changed | `enableDemoMode` action (kept, unchanged); sidebar "Stripe Connect" link (untouched) | `accountAction.js:164`, `sidebar.jsx:146` |
| Anything in §11 that is wrong | No | — |

**Layers** (from §12 step 4)
| Layer | What the plan does | Or N/A because |
|---|---|---|
| Frontend | Remove amber banner + "Exit Demo Mode", heading, red line, demo sentence, badges on both screens; relabel button → "Skip for now"; reword limit messages; remove now-unused handlers/vars/imports | |
| Backend | | N/A — `enableDemoMode` / `handleDemoMode` unchanged |
| Data | | N/A — nothing stored changes |
| Security | | N/A — who reaches the screens is unchanged |
| Integrations | | N/A — Stripe-connect flow unchanged |
| Testing | `npm run build` + full code review + developer dev-app check | |
| Release | Deploy to `feat/pricing-alignment`; rollback by reverting commits | |

**Files to add**
| File | Purpose |
|---|---|
| (none) | — |

**Files to change**
| File | What changes |
|---|---|
| `src/app/dashboard/add-product/Main.jsx` | Remove amber banner + "Exit Demo Mode"; remove heading, red line, demo sentence, badges; relabel "Demo Mode" → "Skip for now"; reword "free demo limit" → "free upload limit"; remove unused `stripedata`, `isInDemoMode`, `handleExitDemoMode`; update a comment |
| `src/app/dashboard/qr/ConsignorQR.jsx` | Same treatment; reword the error toast (drop "demo"); remove now-unused `useRouter` import + `router` const |

**Files that must not change**
| File | Why it's protected |
|---|---|
| `src/app/dashboard/sidebar.jsx` | Keeps the "Stripe Connect" link (AC-05) |
| `src/actions/accountAction.js` | `enableDemoMode` action preserved (functionality behind "Skip for now") |
| `src/app/try/*`, cart, product-limit logic, pricing/checkout/subscription | out of scope |

| Area | Change |
|---|---|
| Database (tables, columns, migrations) | None |
| Existing data affected | None |
| API / integrations | None |
| Settings / environment | None |
| New libraries | None |
| Permissions / roles | None |

**Coverage**
| AC | Plan task(s) | How it's checked |
|---|---|---|
| AC-01 | Main.jsx removals + relabel | code read + build |
| AC-02 | banner removal (both files) | code + grep |
| AC-03 | button action unchanged | code |
| AC-04 | ConsignorQR removals + relabel | code + build |
| AC-05 | sidebar untouched | `sidebar.jsx:146` |
| AC-06 | all demo naming removed | grep + build |
| AC-07 | removals only (fewer elements) | manual visual (pending) |

**Technical risks found:** None significant — UI-only; `npm run build` passes.
**How to undo:** revert this task's commits on `feat/pricing-alignment` and redeploy.
**Plan approved by:** navtej0110 (developer), via plan mode, 2026-10-27.

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report

**Result:** ✅ Done with one pending check — code complete, `npm run build` passes; AC-07 (responsive visual) + a dev-app click-through still to be eyeballed by the developer. · **Date:** 2026-10-27 · **Branch / commit:** `feature/435-remove-demo-mode-from-lestores-ai-and-simplify` — not committed yet (uncommitted on branch; `/ship` commits).

**What the user can now do**
- On Add Product with no Stripe: sees only "Go to Stripe Connect" + "OR" + "Skip for now" — no demo banner, heading, red line, demo sentence or badges. "Skip for now" continues into the product steps (same action as before).
- On the consignor QR screen with no Stripe: same cleanup; "Skip for now" continues to the QR code.
- A store/consignor that skipped Stripe can still connect it later via the sidebar "Stripe Connect" link.

**Acceptance checks**
| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ✅ | `Main.jsx:144–211` — gate screen renders only green CTA + OR + "Skip for now"; heading/red line/sentence/badges removed; `npm run build` passes |
| AC-02 | ✅ | amber banner block removed (Main was 157–202, Consignor was 75–120); grep: no "Demo Mode Active" / "Exit Demo Mode" in either file |
| AC-03 | ✅ (code) | button keeps `onClick={handleDemoMode}` → `enableDemoMode` (`Main.jsx:181`); action unchanged. Runtime click not executed in this environment |
| AC-04 | ✅ (code) | `ConsignorQR.jsx` cleaned; button action unchanged (`ConsignorQR.jsx:97`); build passes. Runtime click not executed in this environment |
| AC-05 | ✅ | `sidebar.jsx:146` unchanged — "Stripe Connect" link present, not role-gated |
| AC-06 | ✅ | grep of both screens: no user-visible "demo" naming remains (only internal `console.log` + the `enableDemoMode` action name); ConsignorQR error toast reworded |
| AC-07 | ⏸ | Requires a 375px + desktop visual check; cannot screenshot in this (non-interactive) environment |

**Safety & security (from §7, areas that apply)**
| Area | Result | Proof |
|---|---|---|
| Mobile & browsers | ⏸ | visual check pending (AC-07) |
| Accessibility | ✅ | kept control is a native `<button>` (unchanged) — keyboard-reachable with default focus |
| Breaking other features | ✅ | build passes; sidebar/steps/QR/limit logic/`enableDemoMode` untouched; grep clean |
| Errors & logging | ✅ | `handleDemoMode`/`enableDemoMode` unchanged; ConsignorQR error toast reworded (no "demo") |
| Rollback | ✅ | revert this task's commits on `feat/pricing-alignment` |

**Files actually changed**
| File | In §13? | Change |
|---|---|---|
| `src/app/dashboard/add-product/Main.jsx` | Yes | removals + relabel + reword + unused-symbol cleanup + comment |
| `src/app/dashboard/qr/ConsignorQR.jsx` | Yes | same + error-toast reword + removed `useRouter`/`router` |

**Database changes actually made:** None.

**Checks run**
| Check | Command | Result |
|---|---|---|
| Lint | `next lint` / `npx eslint` | Unavailable — pre-existing: Next 16 removed `next lint`; `eslint-config-next` needs the `typescript` module (not installed). Not caused by this change. |
| Build | `npm run build` | ✅ Pass — compiled; all routes incl. `/dashboard/add-product` and `/dashboard/qr` generated |
| Tests | — | No test runner configured |

**Different from the plan:** Minor, within plan intent — also reworded the ConsignorQR error toast (it was user-visible demo naming) and removed the now-unused `useRouter` import + `router` const in ConsignorQR; updated two code comments.
**Not done / known limits:** AC-07 visual check and a manual "Skip for now" click-through in a running app were not performed (non-interactive environment, no auth/DB/browser).
**Still needed before going live:** `validate` logged 2026-10-27 on the developer's direction (build + code review). AC-07 (responsive visual) and a "Skip for now" click-through remain a recommended quick eyeball in `npm run dev` before/at `/ship`.

Before marking this done, check:
- [ ] Every AC is ✅, ❌ or ⏸ — none missing
- [ ] Every ✅ has proof. "Pass" without proof counts as ⏸.
- [ ] Every file changed but not in §13 is explained
- [ ] Anything different from the plan, or not done, is listed with a reason

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (95 / 100 · no blockers)</b></summary>

*Filled by `/kodion-create-spec` using its quality rules.*

**Score:** 95 / 100 · **Blockers:** none · **Size:** Small · **Risk:** Low
**Before planning:** nothing blocks planning or coding.

| Area | Score | Lost points because |
|---|---|---|
| Why and goals | 5 / 5 | — |
| Requirements | 15 / 15 | — |
| Where it appears and its life | 10 / 10 | — |
| When things go wrong | 14 / 15 | Low-risk task: only the main failure cases are covered (as the risk level allows). |
| Acceptance checks | 18 / 20 | AC-06 ("no demo naming remains") is a text review across two screens, and the reworded limit-message copy is finalised at build time. |
| Safety & security | 15 / 15 | — |
| Decisions and questions | 10 / 10 | — |
| Today and what could break | 5 / 5 | — |
| Length and clarity | 3 / 5 | Kept the full template rather than the small-spec template (no `--small` given), so it's longer than a small change strictly needs. |

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | ✅ FR-01→AC-01, FR-02→AC-02, FR-03→AC-03, FR-04→AC-04, FR-05→AC-03/AC-04/AC-05, FR-06→AC-06, FR-07→AC-07 |
| B2 Every requirement has Priority and Source | ✅ |
| B3 Every AI choice is listed in §9 | ✅ no AI-sourced requirements; D4 documents the limit-message rewording |
| B4 No technical words in §1–§11 | ✅ file / field names kept to Part C |
| B5 All 16 safety areas checked | ✅ 5 apply, 11 in the "Not involved" line with reasons |
| B6 Risk has a reason | ✅ |
| B7 High-risk extras | N/A — Low risk |
| B8 Every question says what it blocks | ✅ no open questions (§10 is "none") |
| B9 No leftover placeholders in §1–§12 | ✅ |
| B10 Every place in §4.4 has a check | ✅ |
| B11 Everything asked in the task is covered | ✅ demo naming/banner removed on both screens (FR-01/02/03/04/06), functionality kept (FR-01/04/05), Stripe reachable after skip (FR-05 / AC-05), responsive (FR-07). The `/try` page, cart and product limit remain out of scope per the developer. |
| B12 No vague words, no real personal data | ✅ no personal data |

</details>
