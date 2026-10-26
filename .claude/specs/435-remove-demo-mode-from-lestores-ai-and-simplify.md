# Remove demo mode from leStores-AI and simplify the page

`435` · Feature · Small size · **Low risk** — removes demo wording, the demo banner and some surrounding elements on two store screens, keeping one button; nothing is stored, no user input, no outside service, and no flow, permission or payment logic changes.
**Status:** Draft · 2026-10-26 · **Approved by:** — · **Skill:** kodion-create-spec v2.2.1
**Task:** `.claude/tasks/435/task.json` · **Branch:** `feature/435-remove-demo-mode-from-lestores-ai-and-simplify` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task description · three client screenshots (the annotated Connect-Stripe screen, a clean one, and the product-entry step with the demo banner) · the live store screens · the developer's final reduced-scope instruction (two screens only)

> **Reviewer:** read Part A only (about 1 minute), then reply **approve**, or say what to change.
> Part B has the full detail if something looks wrong. Part C is for plan mode; you don't need to review it.
> Who approves depends on the risk: Low → developer or senior · Medium → senior · High → senior, plus the client if business rules change.

---

# Part A — Review this

## 1–3. Summary
**Why:** Two store screens still show "demo mode" and extra clutter the client has asked to clear. On the product-entry screen there is an amber "Demo Mode Active" banner with an "Exit Demo Mode" control. On the "Connect Your Payment Gateway" screen the client has crossed out everything except the green "Go to Stripe Connect" button. This task removes exactly those elements on exactly those two screens, and changes nothing else.

**Most important result:** The amber demo banner is gone from the product-entry screen, and the Connect-Stripe screen shows only the green "Go to Stripe Connect" button.

| | |
|---|---|
| **What changes** | The amber "Demo Mode Active" banner and "Exit Demo Mode" control are removed from the product-entry screen. The Connect-Stripe screen is reduced to only the green "Go to Stripe Connect" button. |
| **We will** | Remove the demo banner + "Exit Demo Mode" on the product-entry screen; on the Connect-Stripe screen remove the heading, the red "Stripe connection required" line, the "OR" divider, the "Demo Mode" button, the demo sentence, and the "Secure / Fast Setup / Trusted" badges — keeping only the green button. |
| **We won't (this time)** | Change the product steps, the stepper, the cart, the public guest "try" page, the product limit, the consignor QR screen, or pricing / checkout / subscription handling. No flow change beyond what disappears with these elements. |
| **Must never happen** | Any demo banner, "Exit Demo Mode", or "Demo Mode" button still shows on these two screens after the change; the green "Go to Stripe Connect" button loses its action; the product steps stop rendering; any commit, push or merge goes to `master` instead of `feat/pricing-alignment`. |
| **Must not change** | The green "Go to Stripe Connect" button's action · the product steps and the stepper · the product limit · the cart · the consignor QR screen · the public "try" page · pricing, checkout and subscription handling · the "Book a demo with Mia" sales links. |
| **Coverage** | 5 requirements · 5 acceptance checks · 2 places · 16 safety areas (5 apply) |
| **Quality** | 96 / 100 · no blockers |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | On the product-entry screen, remove the amber "Demo Mode Active" banner and the "Exit Demo Mode" control. | Must | Task description · Your answer |
| FR-02 | On the "Connect Your Payment Gateway" screen, show **only** the green "Go to Stripe Connect" button. Remove the "Connect Your Payment Gateway" heading, the red "Stripe connection required to accept payments" line, the "OR" divider, the "Demo Mode" button, the demo sentence, and the "Secure / Fast Setup / Trusted" badges (including the demo-limit message and its upgrade link that belong to the same demo block). | Must | Client screenshots · Your answer |
| FR-03 | The green "Go to Stripe Connect" button keeps its existing action (it still opens the Stripe connect page), and the product steps still render as they do today. | Must | Your answer |
| FR-04 | No "demo", "demo mode", "demo limit", "test flows" or "free demo" wording or banner remains on these two screens. | Must | Task description |
| FR-05 | After the elements are removed, the Connect-Stripe screen and the product-entry screen still read correctly on a 375px phone and on desktop. | Must | Task description |

**Priority:** Must = can't ship without it · Should = important, can follow soon after · Could = nice to have
**Source:** Task description · Your answer · Client · Project rules · Standard · AI (a small UI suggestion — please check)

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Set **Risk = Low** and **Size = Small**. | Removes wording, a banner and some surrounding elements on two screens, keeping one button — nothing stored, no input, no outside service, no permission or payment logic change. |
| D2 | **Scope is exactly two screens** (the product-entry screen and the Connect-Stripe screen). The consignor QR screen, the public "try" page, the cart, the product limit, the stepper, and pricing / checkout / subscription are **left untouched** per your final instruction. | Your reduced-scope instruction. The consignor QR screen still shows demo wording after this task — left in place on purpose (see §11); raise a separate task if you want it removed too. |
| D3 | "Show only the green button" also removes the **demo-limit message and its "Upgrade" link** that appear in the same block on that screen. | They are part of the demo UI being cleared; this is screen wording only and does **not** change the product-limit logic or subscription handling. |
| D4 | **Keep the "Book a demo with Mia" sales links** unchanged (they live in a separate popup, not on these screens). | Confirmed by you (Q2); they are a sales-call booking, not the product's "demo mode". |
| D5 | Type kept as **Feature** to match the branch name. | Avoids renaming the branch created by /start-task. |

## 10. Questions for you
None — all scope decisions are confirmed. One consequence to be aware of (not a question): see §11.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
N/A: Small task — the same store owner uses these screens as today; only elements are removed.

### 4.2 Key information
N/A: Small task — no information is shown or saved differently.

</details>

<details>
<summary><b>4.4 Where it appears and its life (2 places)</b></summary>

### 4.4 Where it appears and its life
**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| Store Add Product — product-entry screen | No amber "Demo Mode Active" banner, no "Exit Demo Mode" control; the steps work as today | AC-01, AC-04 |
| Store Add Product — Connect-Stripe screen (no payment connected) | Only the green "Go to Stripe Connect" button; no heading, no "Stripe connection required" line, no "OR" divider, no "Demo Mode" button, no demo sentence, no "Secure / Fast Setup / Trusted" badges | AC-02, AC-03, AC-04 |

**Life of the item:** N/A: Small task — this is a one-time element removal, not a stored item with stages; see §6.
**What testers usually find missing:** N/A: Small task — covered by the places above and §6.

</details>

<details>
<summary><b>5. When things go wrong (3 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| A store with no payment connected opens the Connect-Stripe screen | Only the green "Go to Stripe Connect" button; clicking it opens the Stripe connect page, exactly as today |
| A store that was in the no-payment / demo state opens the product-entry screen | The steps show with no amber "Demo Mode Active" banner and no "Exit Demo Mode"; the store can still use the steps |
| The two screens are opened on a small phone after the elements are removed | The green button (and the steps) still fit with no overlap or cut-off |

</details>

<details>
<summary><b>7. Safety & security (5 apply · 11 not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| Mobile & browsers | The two screens are checked on a 375px phone and current desktop browsers after the elements are removed (AC-05). |
| Accessibility | The kept green button stays keyboard-reachable with a visible focus outline and readable contrast. |
| Breaking other features | The green button keeps its action and the product steps still render (AC-03); the stepper, the cart, the public "try" page, the product limit and the consignor QR screen are left exactly as today. |
| Errors & logging | The green button's action is unchanged; removing the surrounding elements must not remove the product-steps branch of the screen. |
| Rollback | Undo by reverting this task's commits on `feat/pricing-alignment` and redeploying. |

**Not involved (checked):** User input / forms (no fields change) · Showing text safely (text is only removed, none added from users) · Login & permissions (who reaches these screens is unchanged) · Personal data & consent (none shown or saved) · Legal / honesty (no claims change) · Secrets & keys (none touched) · Stored data (nothing saved differently) · Payments & money (the payment-connection action and payment taking are unchanged) · Deleting anything (no records deleted) · Performance (no lists or queries change) · SEO (no public pages change).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and the `DESIGN.md` guide for the store screens.
- Scope guard (your final instruction): only the product-entry screen and the Connect-Stripe screen change. Do not change the product steps, the stepper, the cart, the public "try" page, the product limit, the consignor QR screen, or pricing / checkout / subscription handling.
- Branch and release rule from the task: all commits, pushes and the final merge go to `feat/pricing-alignment`; never to `main` or `master`.

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- On the store Add Product first-use screen (no payment connected), the store sees a "Connect Your Payment Gateway" heading, a red "Stripe connection required to accept payments" line, a green "Go to Stripe Connect" button, an "OR" divider, a "Demo Mode" button, the sentence "Demo mode lets you add products and test flows without real payments. Perfect for testing your setup!", and "Secure / Fast Setup / Trusted" badges. When the old demo limit was reached, a "You've reached your free demo limit…" message and an "Upgrade Now" link also show here.
- Once a store is in the no-payment / demo state, an amber "Demo Mode Active" banner with an "Exit Demo Mode" button shows on the product-entry screen.

**Consequence to be aware of (not a question):** today, clicking "Demo Mode" is what let a store with no Stripe into the product steps. With that button removed and the gate kept, a store with no Stripe connected will reach the Connect-Stripe screen and can only connect Stripe to continue — the demo shortcut into the steps is gone. This matches the client's screenshot (only the green button kept). It is noted here so it is visible at approval, per your "no flow changes" instruction.

**Things that could break:** the green button's action; the product-steps branch of the screen (it must keep rendering — only the demo/clutter branch is trimmed); the product-entry screen's layout once the banner is removed.

</details>

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**. No question in §10 blocks planning or coding.
   **Required for Risk Low:** cover the main failure cases in §5; check all 16 safety areas in §7 (short reasons are fine); one-line rollback; staging check optional; developer or senior may approve.
   If the code scan shows more danger, raise the Risk, explain why in §13, and follow the higher level's checks.
   **For this task type (Feature):** reuse the existing screen; remove elements only; do not add components. No API or backend changes are expected — do not touch the action behind the green button or the demo/limit logic.
   **Lessons that apply:** L3 — keep the checks small; this is a Small task, one check per place the change appears.
2. **Detect the tech stack** from the project's own files (Next.js App Router, React — confirm) and read the project rules and `DESIGN.md`. Record findings in §13 with proof.
3. **Find this project's own checks** (`npm run lint`, `npm run build`; no test runner is configured). Run them and record "before" results. Never invent a command.
4. **Plan every layer this stack needs**, or write "N/A" with a reason:
   - Frontend: the Connect-Stripe screen (trim to only the green button) and the product-entry screen (remove the amber banner + "Exit Demo Mode"); mobile + desktop; accessibility of the kept button.
   - Backend: N/A — do not change the action behind the green button or any demo/limit logic.
   - Data: N/A — nothing stored changes; the product limit and the demo/live setting are left as they are.
   - Security: N/A — who reaches these screens is unchanged.
   - Integrations: N/A — the Stripe-connect action is unchanged.
   - Testing: no runner — browser / manual checks for each AC, on phone and desktop.
   - Release: deploy to `feat/pricing-alignment`; rollback by reverting this task's commits.
   **Task-specific guard:** change **only** the Connect-Stripe branch and the amber demo banner on the product-entry screen. Keep the product-steps branch, the stepper, the green button's action, the cart, the public "try" page, the product limit, the consignor QR screen, and all pricing / checkout / subscription code untouched. Do not touch subscription "demo / trial" email wording.
5. Write the full technical plan to `.claude/plans/435-remove-demo-mode-from-lestores-ai-and-simplify.md`.
6. The plan must map every AC (§6), every place in §4.4, and every row in §7 (areas that apply) to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. Capture a "before" baseline (screenshots of the two screens on phone + desktop, and lint/build results) first, because §7 says these must not visibly regress.
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
- [ ] The green button keeps its action and the product steps still render (AC-03); only the demo/clutter elements are removed
- [ ] The stepper, cart, "try" page, product limit, consignor QR screen and pricing/checkout/subscription code are untouched
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Any Risk change is explained

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary
*Filled by plan mode. Leave empty until then.*

**Plan file:** —
**Risk after code scan:** <same / raised to … because …>

**Project scan**
| Item | Finding | Proof (file or command) |
|---|---|---|
| Tech stack | — | |
| Project rules read | — | |
| Checks this project has (lint, type check, build, tests, migrations) | — | |
| Results of those checks before any change | — | |
| Code behind §11 (what exists today) | — | |
| What depends on the code being changed | — | |
| Anything in §11 that is wrong | — | |

**Layers** (from §12 step 4)
| Layer | What the plan does | Or N/A because |
|---|---|---|
| Frontend | | |
| Backend | | |
| Data | | |
| Security | | |
| Integrations | | |
| Testing | | |
| Release | | |

**Files to add**
| File | Purpose |
|---|---|
| | |

**Files to change**
| File | What changes |
|---|---|
| | |

**Files that must not change** (from "Must not change" in the Summary, mapped to real files)
| File | Why it's protected |
|---|---|
| | |

| Area | Change |
|---|---|
| Database (tables, columns, migrations) | — |
| Existing data affected | — |
| API / integrations | — |
| Settings / environment | — |
| New libraries | — |
| Permissions / roles | — |

**Coverage**
| AC | Plan task(s) | How it's checked |
|---|---|---|
| AC-01 | | |

**Technical risks found:** —
**How to undo:** —
**Plan approved by:** —

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report
*Filled after coding. Leave empty until then.*

**Result:** ⏸ Not started — <Done / Done with gaps / Not done> · **Date:** — · **Branch / commit:** —

**What the user can now do**
- —

**Acceptance checks**
| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ⏸ | |
| AC-02 | ⏸ | |
| AC-03 | ⏸ | |
| AC-04 | ⏸ | |
| AC-05 | ⏸ | |

**Safety & security (from §7, areas that apply)**
| Area | Result | Proof |
|---|---|---|
| Mobile & browsers | ⏸ | |
| Accessibility | ⏸ | |
| Breaking other features | ⏸ | |
| Errors & logging | ⏸ | |
| Rollback | ⏸ | |

**Files actually changed**
| File | In §13? | Change |
|---|---|---|
| | Yes / **No — explain** | |

**Database changes actually made:** —

**Checks run**
| Check | Command | Result |
|---|---|---|
| Lint | | |
| Build | | |
| Tests | | |

**Different from the plan:** —
**Not done / known limits:** —
**Still needed before going live:** —

Before marking this done, check:
- [ ] Every AC is ✅, ❌ or ⏸ — none missing
- [ ] Every ✅ has proof. "Pass" without proof counts as ⏸.
- [ ] Every file changed but not in §13 is explained
- [ ] Anything different from the plan, or not done, is listed with a reason

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (96 / 100 · no blockers)</b></summary>

*Filled by `/kodion-create-spec` using its quality rules.*

**Score:** 96 / 100 · **Blockers:** none · **Size:** Small · **Risk:** Low
**Before planning:** nothing blocks planning or coding.

| Area | Score | Lost points because |
|---|---|---|
| Why and goals | 5 / 5 | — |
| Requirements | 15 / 15 | — |
| Where it appears and its life | 10 / 10 | — |
| When things go wrong | 14 / 15 | Low-risk task: only the main failure cases are covered (as the risk level allows). |
| Acceptance checks | 19 / 20 | AC-04 ("no demo wording remains") is a text review of two screens; proof depends on the final rendered screens. |
| Safety & security | 15 / 15 | — |
| Decisions and questions | 10 / 10 | — |
| Today and what could break | 5 / 5 | — |
| Length and clarity | 3 / 5 | Kept the full template rather than the small-spec template (no `--small` given), so it's longer than a small change strictly needs. |

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | ✅ FR-01→AC-01, FR-02→AC-02, FR-03→AC-03, FR-04→AC-04, FR-05→AC-05 |
| B2 Every requirement has Priority and Source | ✅ |
| B3 Every AI choice is listed in §9 | ✅ no AI-sourced requirements; D3 documents the demo-limit-message removal |
| B4 No technical words in §1–§11 | ✅ file / field names kept to Part C |
| B5 All 16 safety areas checked | ✅ 5 apply, 11 in the "Not involved" line with reasons |
| B6 Risk has a reason | ✅ |
| B7 High-risk extras | N/A — Low risk |
| B8 Every question says what it blocks | ✅ no open questions (§10 is "none") |
| B9 No leftover placeholders in §1–§12 | ✅ |
| B10 Every place in §4.4 has a check | ✅ |
| B11 Everything asked in the task is covered | ✅ for the final scope: demo banner + Connect-Stripe cleanup (FR-01/02/04). The task's wider removal (consignor QR, `/try`, the product limit) and the "first-time flow" line were explicitly de-scoped by the developer — kept visible in D2 and §11, not silently dropped. |
| B12 No vague words, no real personal data | ✅ no personal data |

</details>
