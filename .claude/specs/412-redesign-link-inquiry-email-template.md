# Redesign Link Inquiry email template to match leStores AI branding

`412` · Feature · Small size · **Medium risk** — changes a live transactional email sent to a real team inbox; a broken template means lost webshop-connection inquiries
**Status:** Approved · 2026-10-23 · **Approved by:** navtej0110 (senior), 2026-10-23 · **Skill:** kodion-create-spec v2.2.1
**Task:** `.claude/tasks/412/task.json` · **Branch:** `feat/pricing-alignment` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task description · the current Link Inquiry email · the project design guide (DESIGN.md) · existing email templates — no screenshots

> **Reviewer:** read Part A only (about 2 minutes), then reply **approve**, or say what to change.
> Part B has the full detail if something looks wrong. Part C is for plan mode; you don't need to review it.
> Who approves depends on the risk: Medium → senior.

---

# Part A — Review this

## 1–3. Summary
**Why:** When a customer submits the "Get it now" contact form on the pricing page, the team at `mia@le-stores.com` receives a plain, unstyled notification email built from a basic HTML table. It looks like a test message and doesn't reflect the leStores AI brand. We want that email redesigned to look professional and on-brand, so the inquiry is clear and the team can reply in one tap.

**Most important result:** The team receives a cleanly branded email that shows every detail the customer submitted and a one-tap way to reply to them.

| | |
|---|---|
| **What changes** | The look of the Link Inquiry notification email, and its subject line |
| **We will** | Add a branded header, a styled details card, a prominent reply button, and a standard footer; make it inline-styled, max 600px and mobile-friendly; change the subject line |
| **We won't (this time)** | Change the contact form, the data collected, the recipient, the reply-to behaviour, or any other email |
| **Must never happen** | A submitted inquiry fails to reach the team, or arrives missing a detail the customer entered |
| **Must not change** | The recipient (`mia@le-stores.com`), the reply-to address, the form and its fields, every other email template, every other API route, the existing "couldn't send" error the customer sees |
| **Coverage** | 9 requirements · 10 acceptance checks · 3 places · 0 stages (single email) · 7 safety areas |
| **Quality** | 99 / 100 · no blockers |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | The email has a branded header using the leStores AI brand colours (crimson-rose accent from the design guide) and the leStores AI logo. | Must | Task description |
| FR-02 | The customer's details — name, store/company, contact email, webshop URL, message — are shown inside one clean, styled details card. The contact email and webshop URL stay clickable. | Must | Task description |
| FR-03 | The email has a prominent action section with a styled "Reply" button that opens a reply addressed to the customer's contact email. | Must | Task description |
| FR-04 | The email has a professional, standardised footer consistent with other leStores AI emails. | Must | Task description |
| FR-05 | The subject line reads `New webshop connection request - {store name}` (e.g. "New webshop connection request - Vintage A"), replacing `Link inquiry from {name}`. | Must | Task description |
| FR-06 | All styling is applied with inline CSS (no `<style>` block or external stylesheet), for cross-client compatibility. | Must | Task description |
| FR-07 | The layout is max 600px wide and is readable with no horizontal scrolling on a 375px-wide phone. | Must | Task description |
| FR-08 | The template follows the structure and styling conventions of the project's existing email templates (e.g. the logo-header pattern used in the password-reset email). | Should | Task description |
| FR-09 | Customer-submitted text (name, store, URL, message) is shown as plain text, so markup inside a submission cannot break the layout. | Should | AI (D5) / Standard (output safety) |

**Priority:** Must = can't ship without it · Should = important, can follow soon after · Could = nice to have
**Source:** Task description · Your answer · Client · Project rules · Standard · AI (a small UI suggestion — please check)

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Risk set to **Medium**, not Low | It changes a live transactional email to a real inbox; if it breaks, the team loses inquiries. The design guide's own example rates "a contact form that emails the team" as Medium. When unsure, the higher level is chosen. |
| D2 | The header uses the leStores AI logo image, the same one used in the password-reset email, on a brand-colour band. | Reuses the existing email branding pattern instead of inventing a new header. |
| D3 | The "Reply" button opens a reply addressed to the customer's contact email (a mailto link). | The email already sets the customer as the reply-to address; a one-tap reply matches that intent. |
| D4 | Brand colours are taken from the project design guide (crimson-rose `primary`, warm rose tints), applied to this email. | The design guide is scoped to the pricing page; reusing its brand colours for this email keeps one consistent brand. Confirm that's wanted. |
| D5 | Customer-submitted text is escaped / shown as plain text (FR-09). | The current template inserts the message straight into the HTML; showing it as plain text keeps a submission from breaking the layout. |
| D6 | The footer mirrors the sign-off and branding used in existing emails (e.g. "leStores AI Team") plus a short standard note. | Keeps footers consistent across the product's emails. |

## 10. Questions for you
None. Everything needed to build is in the task description and the project; the choices above are small presentation details for you to confirm at approval.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
N/A: Small task. One recipient type — the leStores AI team inbox (`mia@le-stores.com`). The email is not shown to customers.

### 4.2 Key information
N/A: Small task. The information shown (customer name, store/company, contact email, webshop URL, message) is listed in FR-02 and checked in §6.

</details>

<details>
<summary><b>4.4 Where it appears (3 places)</b></summary>

### 4.4 Where it appears
**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| The email in the team inbox list (subject line) | "New webshop connection request - {store name}" | AC-01 |
| The email body, opened on a desktop client | Branded header, details card, reply button, footer | AC-02, AC-03, AC-05, AC-06 |
| The email body, opened on a 375px phone | The same, fitting the width with no horizontal scroll | AC-08 |

**Life of the item:** N/A: Small task (a one-off email, no stages).

</details>

<details>
<summary><b>5. When things go wrong (4 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| The customer left the name and/or message empty | The card still renders; the message area shows a clear placeholder (e.g. "No message provided") and no row looks broken or empty-and-unlabelled. |
| A submitted field contains markup, e.g. a message like `<b>hi</b>` | It appears as the literal text `<b>hi</b>`, is not rendered as formatting, and the layout stays intact (FR-09). |
| The email fails to send (SMTP error) | Unchanged from today: the customer sees the existing "couldn't send, please try again" response on the form, and the error is logged on the server. |
| The email client blocks remote images (logo doesn't load) | The header still reads as leStores AI (brand colour band and/or alt text), so the email is still recognisable and usable. |

</details>

<details>
<summary><b>6. How we know it's done (10 acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given a submission with store "Vintage A", when the email arrives, then its subject is exactly "New webshop connection request - Vintage A" (not "Link inquiry from …"). | FR-05 |
| AC-02 | Given the email opened on a desktop client, when you look at the top, then there is a leStores AI branded header using the brand crimson-rose colour and the logo. | FR-01 |
| AC-03 | Given a submission (name "Customer A", store "Vintage A", email "a@example.com", webshop "https://example.com", message "Hi there"), when you open the email, then all five details appear inside one styled card, and the email and webshop URL are clickable links. | FR-02 |
| AC-04 | Given a submission with no name and no message, when you open the email, then the card still renders, the message area shows "No message provided", and no row is broken. | FR-02 |
| AC-05 | Given the email, when you look at the action section, then there is a prominent styled "Reply" button that, when clicked, opens a reply addressed to a@example.com. | FR-03 |
| AC-06 | Given the email, when you scroll to the bottom, then there is a professional footer consistent with other leStores AI emails. | FR-04 |
| AC-07 | Given the email's HTML source, when you inspect it, then all styling is inline (no `<style>` block or external stylesheet), and it still renders styled in Gmail. | FR-06 |
| AC-08 | Given the email opened on a 375px-wide phone, when you view it, then the content fits the width (max 600px, no horizontal scroll) and the text is readable. | FR-07 |
| AC-09 | Given the finished template, when compared with existing emails, then it uses the same brand patterns (logo header like the password-reset email, brand colours from the design guide). | FR-08 |
| AC-10 | Given a submission whose message is `<b>hi</b>`, when you open the email, then it shows the literal text `<b>hi</b>`, not bold text, and the layout is intact. | FR-09 |

</details>

<details>
<summary><b>7. Safety & security (7 apply · 9 not involved)</b></summary>

## 7. Safety & security
Only the areas that apply get a row. Every other area is named in the "Not involved" line, with a short reason.

| Area | What we do |
|---|---|
| 1. User input / forms | The email renders values the customer submitted. Required fields (store, email, URL) are already validated by the existing route; optional name and message are handled gracefully when empty (§5). The spec adds no new input. |
| 2. Showing text safely | Customer-submitted text is shown as plain text, so markup in a submission can't change the email or break the layout (FR-09, AC-10). |
| 4. Personal data & consent | The email contains the customer's name and contact email. It continues to go only to the internal team inbox; nothing new is stored and no one new can see it. |
| 11. Mobile & browsers | Inline CSS and a max-600px responsive layout for common email clients (Gmail, Apple Mail, Outlook) and a 375px phone (FR-06, FR-07, AC-07, AC-08). |
| 14. Breaking other features | Only this template changes (and, if needed, the subject it sends). Every other email template and API route is left exactly as it is. |
| 15. Errors & logging | The existing send-failure behaviour (customer sees "couldn't send", error logged) is unchanged (§5). |
| 16. Rollback | Revert the template file (and the one-line subject change) to restore the previous email. |

**Not involved (checked):** login & permissions (internal notification, no auth) · legal/honesty (no claims or consent wording) · secrets & keys (SMTP credentials stay server-side, unchanged) · stored data (nothing saved) · payments (none) · deleting (none) · performance (one short email) · accessibility (email content, not an interactive page; the brand text colours meet AA contrast per the design guide) · SEO (email, not indexed).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing email conventions and the design guide (DESIGN.md) for brand colours.
- Changes are limited to the Link Inquiry email template and, only if the subject change needs it, the link-inquiry API route. No other templates or routes.
- All prices/currency conventions are unaffected (this email shows none).

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- When a customer submits the "Get it now" form on the pricing page, the team inbox receives an email titled "Link inquiry from {name or store}".
- The body is a plain black-and-white HTML table: a heading "New Link Plan Inquiry", rows for Name, Store/Company, Contact Email, Webshop URL and Message, and a small grey note. No logo, no brand colour, no reply button.
- The customer's contact email is already set as the reply-to address.

**Things that could break:** the email arriving at all; any detail going missing from the email; the reply-to address; other emails that share patterns; the customer-facing "couldn't send" error.

</details>

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**, or if any question in §10 blocks "Planning".
   **Required for Risk Medium:** cover all failure cases in §5; check all 16 safety areas (§7); senior approval for both spec and plan; write rollback steps; test on staging (send a real test email and view it on desktop and a phone); go-live sign-off by a senior; full done report (§14). No pre-coding backup is required at this level.
   If the code scan shows more danger, raise the Risk, explain why in §13, and follow the higher level's checks.
   **For this task type (Feature):** Reuse existing parts (components, messages, patterns) before making new ones, and name them in §13. If it adds or changes an API, list in the plan: request, success and error responses, who can call it, input checks, and the app's existing error format.
   **Lessons that apply:** L3: keep checks small for a Small task — one check per place the change appears.
2. **Detect the tech stack** from the project's own files. Read the project rules and the design guide, the code behind §11 (the current template and the route that calls it), and what depends on it. Record the findings in §13 with proof.
3. **Find this project's own checks** (lint, build, tests) from its config and scripts. Run them and record the "before" results. If a check doesn't exist, write "none". Never invent a command.
4. **Plan every layer this stack needs.** Cover each heading below, or write "N/A" with a reason:
   - Frontend: N/A (email HTML, not a screen) — but cover rendering on desktop and a 375px phone, and image-blocked fallback.
   - Backend: where the subject line is built and sent; the values passed in.
   - Data: N/A (nothing stored).
   - Security: plain-text rendering of submitted values (FR-09); SMTP credentials stay server-side.
   - Integrations: the SMTP/email send; confirm the recipient and reply-to are unchanged.
   - Testing: send a real test email (staging/SMTP) and view it on a desktop client and a phone; check the subject, the five details, the reply button target, the empty-field case and the markup-in-message case.
   - Release: rollback = revert the template (and subject) change.
5. Write the full technical plan to `.claude/plans/412-redesign-link-inquiry-email-template.md`.
6. The plan must map every AC (§6), every place in §4.4, and every applicable row in §7 to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. If anything must stay the same, capture a "before" baseline (the current email, the recipient, the reply-to) first.
9. **Then fill §13 below** with the summary of the plan. Change nothing in §1–§11.
10. Ask for approval of the plan before coding. Don't start coding while any §10 question blocks "Coding".
    **Branch:** the header says "created by /start-task", so you're already on it. Check with `git branch --show-current` (expect `feat/pricing-alignment`), and never create another branch.
    **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that later.
11. After coding, fill §14. Never write "Pass" without proof.
12. **Timesheet logging.** Run each once, when it becomes true:
    - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh 412 plan`
    - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh 412 implement`
    - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh 412 validate`
    - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh 412 iterate` (each round)
    Also set `"plan": ".claude/plans/412-redesign-link-inquiry-email-template.md"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on.

Before asking for plan approval, check:
- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every AC, every place in §4.4, and every applicable row in §7 is mapped to a task and a check
- [ ] Every lesson above is applied
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Database, data, API, settings, libraries and permissions each have a row, none blank
- [ ] The Medium-risk required checks (staging test, rollback steps, senior approvals) are in the plan
- [ ] Any Risk change is explained

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary

**Plan file:** `.claude/plans/412-redesign-link-inquiry-email-template.md`
**Risk after code scan:** same (Medium).

**Project scan**
| Item | Finding | Proof (file or command) |
|---|---|---|
| Tech stack | Next.js 16 (Turbopack), React 19, plain JS; email via Nodemailer | `package.json` (next ^16.0.10, nodemailer ^6.10.0) |
| Project rules read | CLAUDE.md, DESIGN.md (brand tokens) | DESIGN.md §2 colours |
| Checks this project has | `next build`; `next lint` (stale) | `package.json` scripts |
| Results of those checks before any change | `npm run lint` already broken (Next 16 removed the `next lint` subcommand → "Invalid project directory … /lint"); build not separately captured (change is isolated to one template) | `npm run lint` output |
| Code behind §11 | `src/mails/linkInquiry.js` (template + subject), called by `src/app/api/link-inquiry/route.js` | the two files |
| What depends on the code being changed | Only the link-inquiry route; grep for `linkInquiry` returns just those two files | `grep linkInquiry` |
| Anything in §11 that is wrong | No | — |

**Layers** (from §12 step 4)
| Layer | What the plan does | Or N/A because |
|---|---|---|
| Frontend | N/A | Email HTML, not a screen — but rendered and checked on desktop width and 375px fluid layout |
| Backend | Subject line built in `linkInquiry.js` from `storeName`; sender unchanged | — |
| Data | — | Nothing stored or read |
| Security | Customer values escaped (`esc`) and shown as plain text; `encodeURI` on the webshop href; SMTP creds untouched | — |
| Integrations | SMTP send unchanged; recipient `mia@le-stores.com` and `replyTo` unchanged | — |
| Testing | `npm run build` + rendered-HTML assertions for all ACs; real staging SMTP send before go-live | — |
| Release | Rollback = revert the template file | — |

**Files to add**
| File | Purpose |
|---|---|
| none | — |

**Files to change**
| File | What changes |
|---|---|
| `src/mails/linkInquiry.js` | New branded HTML body (header, details card, reply button, footer), inline CSS, fluid max-600px; new subject line; `esc()` for safe display; HTML builder split into exported `renderLinkInquiryHtml()` |

**Files that must not change** (from "Must not change" in the Summary, mapped to real files)
| File | Why it's protected |
|---|---|
| `src/app/api/link-inquiry/route.js` | Recipient, validation and the data passed must stay the same (not changed — subject lives in the template) |
| other `src/mails/*.js` | Only this template is in scope |

| Area | Change |
|---|---|
| Database (tables, columns, migrations) | none |
| Existing data affected | none |
| API / integrations | none — SMTP send, recipient and reply-to unchanged |
| Settings / environment | none — reuses existing `NEXT_PUBLIC_FRONTEND_LIVE_URL` |
| New libraries | none |
| Permissions / roles | none |

**Coverage**
| AC | Plan task(s) | How it's checked |
|---|---|---|
| AC-01 | New subject line | Source: `subject: \`New webshop connection request - ${storeName}\`` |
| AC-02 | Crimson header + logo | Render assertion (crimson bg, logo src + alt) |
| AC-03 | Details card, email + URL links | Render assertion (5 labels, mailto + webshop links) |
| AC-04 | Empty-field fallbacks | Render assertion ("—", "No message provided") |
| AC-05 | Reply button | Render assertion (mailto button "Reply to …") |
| AC-06 | Footer | Render assertion (footer text + "leStores AI") |
| AC-07 | Inline CSS only | Render assertion (no `<style>`/stylesheet) + build pass |
| AC-08 | Fluid max-600px | Render assertion (`max-width:600px`, width 100%) |
| AC-09 | Brand conventions | Inspection vs `forgotPassword.js` + DESIGN.md tokens |
| AC-10 | Escaped user text | Render assertion (`<b>hi</b>` → `&lt;b&gt;…`) |

**Technical risks found:** Email-client rendering quirks (e.g. Outlook) can't be fully proven locally — covered by the staging send before go-live.
**How to undo:** `git checkout src/mails/linkInquiry.js` (revert the one file).
**Plan approved by:** navtej0110, 2026-10-23

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report

**Result:** ✅ Done (pending a staging SMTP send before go-live) · **Date:** 2026-10-23 · **Branch / commit:** `feat/pricing-alignment` (uncommitted)

**What the user can now do**
- The team receives a branded, on-brand Link Inquiry email with a crimson header + logo, a styled details card, a one-tap Reply button, and a standard footer; the subject reads "New webshop connection request - {store name}".

**Acceptance checks**
| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ✅ | Source: `subject: \`New webshop connection request - ${storeName}\`` (linkInquiry.js) |
| AC-02 | ✅ | preview-412.mjs: "AC-02 crimson header" + "AC-02 logo" PASS |
| AC-03 | ✅ | preview-412.mjs: "AC-03 all 5 labels" + "AC-03 email link" + "AC-03 webshop link" PASS |
| AC-04 | ✅ | preview-412.mjs: "AC-04 empty name dash" + "AC-04 empty message placeholder" PASS |
| AC-05 | ✅ | preview-412.mjs: "AC-05 reply button mailto" PASS |
| AC-06 | ✅ | preview-412.mjs: "AC-06 footer text" PASS |
| AC-07 | ✅ | preview-412.mjs: "AC-07 no <style> block" + "inline styles present" PASS; `npm run build` ✓ |
| AC-08 | ✅ | preview-412.mjs: "AC-08 max-width 600px" PASS (fluid width:100% + max-width:600px) |
| AC-09 | ✅ | Inspection: logo-header pattern matches `forgotPassword.js`; brand tokens from DESIGN.md §2 |
| AC-10 | ✅ | preview-412.mjs: "AC-10 markup escaped" PASS (`<b>hi</b>` → `&lt;b&gt;hi&lt;/b&gt;`) |

**Safety & security (from §7, areas that apply)**
| Area | Result | Proof |
|---|---|---|
| 1. User input / forms | ✅ | Empty name/message handled (AC-04); required fields still validated by the unchanged route |
| 2. Showing text safely | ✅ | `esc()` on every customer value; AC-10 PASS |
| 4. Personal data & consent | ✅ | Still only to `mia@le-stores.com`; nothing stored; recipient/reply-to unchanged |
| 11. Mobile & browsers | ✅ | Inline CSS, fluid max-600px (AC-07, AC-08); full client matrix deferred to staging send |
| 14. Breaking other features | ✅ | Only `linkInquiry.js` changed; `grep linkInquiry` = 2 files; build ✓ |
| 15. Errors & logging | ✅ | Route's try/catch and 500 response unchanged |
| 16. Rollback | ✅ | `git checkout src/mails/linkInquiry.js` |

**Files actually changed**
| File | In §13? | Change |
|---|---|---|
| `src/mails/linkInquiry.js` | Yes | New branded HTML body + subject; `esc()` helper; HTML split into exported `renderLinkInquiryHtml()` |

**Database changes actually made:** none

**Checks run**
| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` / `npx eslint` | ⚠️ Both broken pre-existing (Next 16 removed `next lint`; eslint config needs the `typescript` package, not installed). Not caused by this change. |
| Build | `npm run build` | ✅ Compiled successfully; TypeScript check passed; `/api/link-inquiry` built |
| Tests | — | No test runner configured |
| Render checks | `node scratchpad/preview-412.mjs` | ✅ 13/13 assertions PASS |

**Different from the plan:** HTML builder was split into an exported `renderLinkInquiryHtml()` (same file) so the output could be rendered and asserted without sending email — a small, additive refactor within the in-scope file.
**Not done / known limits:** No automated proof of real email-client rendering (Outlook/Gmail/Apple Mail) locally.
**Still needed before going live:** Send a real test email on staging and view it on a desktop client and a phone (Medium-risk requirement, §12).

Before marking this done, check:
- [ ] Every AC is ✅, ❌ or ⏸ — none missing
- [ ] Every ✅ has proof. "Pass" without proof counts as ⏸.
- [ ] Every file changed but not in §13 is explained
- [ ] Anything different from the plan, or not done, is listed with a reason

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (99 / 100 · no blockers)</b></summary>

*Filled by `/kodion-create-spec` using its quality rules.*

**Score:** 99 / 100 · **Blockers:** none · **Size:** Small · **Risk:** Medium
**Before planning:** nothing blocks planning.

| Area | Score | Lost points because |
|---|---|---|
| Why and goals | 5 / 5 | — |
| Requirements | 15 / 15 | — |
| Where it appears and its life | 10 / 10 | — (single email; no stages for a Small task) |
| When things go wrong | 14 / 15 | Email-client quirks (e.g. Outlook table rendering) are left to plan mode's staging test rather than enumerated here. |
| Acceptance checks | 20 / 20 | — |
| Safety & security | 15 / 15 | — |
| Decisions and questions | 10 / 10 | — |
| Today and what could break | 5 / 5 | — |
| Length and clarity | 5 / 5 | — |

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | ✅ |
| B2 Every requirement has Priority and Source | ✅ |
| B3 Every AI choice is listed in §9 | ✅ (D5 → FR-09) |
| B4 No technical words in §1–§11 | ✅ |
| B5 All 16 safety areas checked | ✅ (7 apply · 9 not involved) |
| B6 Risk has a reason | ✅ |
| B7 High-risk extras | N/A (Medium risk) |
| B8 Every question says what it blocks | N/A (no questions) |
| B9 No leftover placeholders in §1–§12 | ✅ |
| B10 Every place and stage in §4.4 has a check | ✅ |
| B11 Everything asked in the task is covered | ✅ (header, details card, reply button, footer, subject, inline CSS, 600px/responsive, conventions) |
| B12 No vague words, no real personal data | ✅ (made-up "Customer A", "a@example.com") |

</details>
