# Remove name fields from the sign-up form

`448` · Feature · Medium size · **High risk** — touches the registration flow, saved user data and personal data (owner names)
**Status:** Approved · 2026-10-27 · **Approved by:** navtej0110, 2026-10-27 · **Skill:** kodion-create-spec v2.6.0
**Task:** `.claude/tasks/448/task.json` · **Branch:** `feature/448-remove-name-fields-from-the-sign-up-form` (created by /start-task) · **Depends on:** none · **Follows:** none
**Based on:** task description · attachment `.claude/attachments/448.jpeg` (could not be opened — see §11)

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve, at
> any risk. If a row looks wrong, the tables below and Part B have the detail. Part C is for plan mode.

---

# Part A — Review this

```
┌─ AT A GLANCE ─────────────────────────────────────────────────────┐
│ Goal     A store owner can sign up without typing a name          │
│ Changes  leStores-AI Store sign-up drops First Name + Last Name   │
│ Won't    Brand and Consignor sign-up keep their name fields       │
│ Keep     Store Name, Country, Biz Reg No; auth/session/password   │
│ Danger   Breaking registration, or wiping an existing name        │
│ Size     8 reqs · 12 checks · 7 places · High risk                │
│ Needs    nothing (Q1 is a confirm only, blocks nothing)           │
│ Verdict  Ready to approve · check D1, D2, D3                      │
└───────────────────────────────────────────────────────────────────┘
```

Store sign-up form after this change (First/Last Name removed):

```
  ┌────────────────────────────────────────────────┐
  │  Store Name                                      │
  │  Country                      [ Select ▾ ]       │
  │  Business Registration Number (VAT/CVR)          │
  │  Phone                                           │
  │  Email                 Password          [ 👁 ]  │
  │              ( Create Account )                  │
  └────────────────────────────────────────────────┘

  The First Name / Last Name row is gone · all other fields unchanged
```

## 1–3. Summary
**Why:** The leStores-AI sign-up asks store owners for First Name and Last Name. The client wants
registration as short as possible, so a store owner can register with the fewest fields. Those two
fields add friction and aren't needed up front — Store Name already identifies the store.
**Quality:** 92 / 100 · no blockers

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | Remove the First Name and Last Name input fields from the **Store** sign-up form | Must | Task description |
| FR-02 | Remove the First/Last Name "required" validation on the store path, so the store form submits without a name | Must | Task description |
| FR-03 | Store registration succeeds on the backend with no name — saving a store user must not fail for a missing name | Must | Task description |
| FR-04 | A new store account is auto-filled with a non-blank placeholder owner name derived from the Store Name, so every downstream use (login session, admin screens, emails, Stripe customer, public SSO) stays non-blank and meaningful | Must | Your answer |
| FR-05 | Brand and Consignor sign-up forms still collect **and require** First/Last Name exactly as today | Must | Your answer |
| FR-06 | Existing accounts of every role keep their stored First/Last Name unchanged — nothing is cleared or overwritten | Must | Task description |
| FR-07 | The store owner Profile edit page no longer requires First/Last Name, so a store owner can save profile changes without one | Should | Your answer |
| FR-08 | A new store can register and then log in with no name provided | Must | Task description |

<sub>Must = can't ship without it · Should = soon after · Could = nice to have · Source "AI" = my suggestion, please check it</sub>

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Scope is the **Store** sign-up form only. Brand and Consignor forms are untouched, even though all three share one Yup schema and one User model — the schema/model change is scoped to role `store`. | Task is about the store owner; narrower change = lower risk. |
| D2 | New store accounts get a **placeholder name derived from the Store Name** (non-blank, because the User model marks name required, and the app already defaults admin/CSV stores to "Unclaimed"/"Store"). Exact wording of the placeholder is left to plan mode, but it must never be blank or a lone space. | Keeps emails, admin tables, Stripe, the login session and the public SSO payload working without rewriting ~20 screens. |
| D3 | The store Profile edit page also drops the First/Last Name requirement. | So a name-less store owner is never blocked from saving profile changes. |
| D4 | Set **High** risk. | Changes the registration flow, saved user data and personal data. |

## 10. Questions for you
| # | Question | Blocks | Who answers |
|---|---|---|---|
| Q1 | ✅ Answered (2026-10-27): The screenshot shows First Name and Last Name crossed out, with Store Name, Country and Business Registration Number (VAT) kept; the remaining fields (Phone, Email, Password) are as found in the code. Kept Store fields confirmed. | Nothing | Client / Dev |

**To reply:** `approve` · or `D1 change: <what instead>` · or `Q1: <your answer>`
**Not sure?** Open Part B for the detail behind any row above.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| Store owner (new) | Registers without entering a name |
| Store owner (existing) | Unaffected — keeps their stored name |
| Brand / Consignor (new or existing) | Unaffected — still provide and keep a name |
| Admin | Sees the store owner's identity in admin screens (now a store-name–derived placeholder for new stores) |

### 4.2 Key information
| Item | What it holds |
|---|---|
| Store owner name | First/Last Name. No longer collected at store sign-up; auto-filled from Store Name instead |
| Store Name | Kept — the real identity of a store account |

</details>

<details>
<summary><b>4.4 Where it appears and its life (7 places · 5 stages · tester checklist)</b></summary>

### 4.4 Where it appears and its life

**Where it appears**
| Place | What the user should see | Check |
|---|---|---|
| leStores-AI Store sign-up form | No First/Last Name; other fields unchanged | AC-01 |
| Brand & Consignor sign-up forms | First/Last Name still present and required | AC-09 |
| Store Profile edit page | Can save without a name | AC-11 |
| Admin → Stores & Users (and other admin name displays) | New store shows a non-blank owner value | AC-05 |
| Store emails (subscription / reset / welcome) | Greeting is non-blank | AC-06 |
| Stripe customer + login session | Name is non-blank | AC-07, AC-08 |
| Public SSO exchange response | Still returns a valid payload | AC-12 |

**Life of the item**
| Stage | What should happen | Check |
|---|---|---|
| Register a store with no name | Account created with placeholder name | AC-02, AC-04 |
| Log in as the new store | Login succeeds; session name non-blank | AC-03, AC-08 |
| Edit profile as the new store | Saves without entering a name | AC-11 |
| Existing account (has a real name) | Name unchanged everywhere | AC-10 |
| Register a brand / consignor | Still requires a name | AC-09 |

**What testers usually find missing**
| # | Question | Answer |
|---|---|---|
| C1 | Still there after a page refresh or on another device? | Name is stored once at sign-up; placeholder persists. Yes |
| C2 | A new status or type has its own colour, badge, filter, legend? | N/A — no new status |
| C3 | No word or label shown twice? | N/A |
| C4 | Timers, tracking, counters, notifications and emails start and stop when they should? | Emails must still greet non-blank — AC-06 |
| C5 | Validation, empty state and error message covered? | See §5 |
| C6 | Same rules on every screen (who can see or edit it)? | Store-only; brand/consignor unchanged — AC-09 |

</details>

<details>
<summary><b>5. When things go wrong (6 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| Store submits with no name | Allowed — account is created, no "First name is required" error (this is the change) |
| Store leaves a still-required field empty (Store Name, Country, Biz Reg No, Phone, Email, Password) | Same validation error as today |
| Backend saves a store user with no name | Must not throw a Mongoose "firstname required" error (model relaxed for store, and/or placeholder set) |
| Brand / Consignor submits with no name | Still blocked with the name-required error (unchanged) |
| Existing store / brand / consignor record | Stored First/Last Name is preserved — never cleared or overwritten by this change |
| Store owner edits profile without a name | Save succeeds (profile schema no longer requires a store name) |

</details>

<details>
<summary><b>6. How we know it's done (12 acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given the leStores-AI Store sign-up tab, when it loads, then no First Name or Last Name field is shown, and Store Name, Country, Business Registration Number, Phone, Email and Password are all still present | FR-01 |
| AC-02 | Given a new store filling Store Name "Nordic Vintage", Country DK, Biz No 12345678, a valid phone, email store@example.com and a valid password, when they submit with no name, then the account is created (status 200) with no "First name is required" error | FR-02, FR-08 |
| AC-03 | Given that new store, when they open /login and sign in, then login succeeds and the dashboard loads | FR-08 |
| AC-04 | Given store registration with no name, when the backend saves the user, then no Mongoose "firstname/lastname required" validation error is thrown | FR-03 |
| AC-05 | Given the new name-less store, when an admin opens Stores & Users, then the owner/name cell shows a non-blank value (store-name–derived), not blank or a lone space | FR-04 |
| AC-06 | Given the new store, when a subscription or reset email is generated, then the greeting is non-blank (not "Hi ," or "Hello,  ") | FR-04 |
| AC-07 | Given the new store, when its Stripe customer is created, then the customer name is non-blank | FR-04 |
| AC-08 | Given the new store logged in, when the session is read, then `session.user.name` is non-blank (not a single space) | FR-04 |
| AC-09 | Given the Brand sign-up tab and the Consignor sign-up tab, when each loads, then First Name and Last Name are still present, and submitting them empty still shows the required error | FR-05 |
| AC-10 | Given an existing store/brand/consignor that already has a name, when they log in and the profile/admin views are opened after this change, then the stored name is unchanged | FR-06 |
| AC-11 | Given a store owner, when they edit and save their profile without entering a First/Last Name, then the save succeeds with no "First name is required" error | FR-07 |
| AC-12 | Given the public SSO exchange endpoint for a name-less store, when the response is returned, then it is still a valid payload and the external site is not broken by the missing name | FR-04 |

</details>

<details>
<summary><b>7. Safety & security (7 apply · 9 not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| 1 User input / forms | Store form stops requiring First/Last Name; all other store fields keep their current validation. Brand/Consignor name validation is unchanged. |
| 3 Login & permissions | Change sits in the registration/login flow. Auth, session strategy and password handling must not change. The login session name must stay non-blank after the change. |
| 4 Personal data & consent | We collect **less** personal data (good). No existing names are exposed or changed. The placeholder is derived from Store Name, not real personal data. |
| 7 Stored data | New store users store a placeholder name; existing records are untouched. The User model's `required` on name is relaxed only for the store path (or satisfied by the placeholder). No data migration. |
| 14 Breaking other features | Name feeds admin tables, 5+ emails, the Stripe customer, the NextAuth session and a public SSO response (full map in §11). Each must stay non-blank/valid for a name-less store — the main reason for the placeholder. |
| 15 Errors & logging | Registration errors shown as today; no raw crash surfaced to the user. |
| 16 Rollback | Revert the branch and redeploy. Safe because no existing data is modified; new stores created meanwhile simply have a placeholder name. |

**Not involved (checked):** showing text safely (names already rendered as plain text) · payments/money (no amounts change; only the Stripe customer's display name) · deleting (nothing deleted) · secrets/keys (none touched) · legal/consent (no consent wording) · performance (form is smaller) · mobile & browsers (two fields removed, layout reflows, nothing new) · accessibility (no new interaction) · SEO (auth page, not indexed).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules (CLAUDE.md): JS/JSX only, Yup schemas in `src/actions/validations.js`, the Mongoose `models.X || model(...)` pattern, HeroUI components, DKK pricing.
- Store sign-up form only — do not remove or change Store Name, Country or Business Registration Number.
- Do not change authentication, session or password handling.
- Do not touch the leStores Apple app or le-stores.com — this is leStores-AI only.
- All commits/merges stay on `feat/pricing-alignment`; never to `main`/`master`.

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- The leStores-AI sign-up page has a Store tab asking for **First Name, Last Name**, Store Name, Country, Business Registration Number, Phone, Email, Password. First/Last Name are required.
- A store owner never sees their own name as a greeting in the store dashboard, but the name they typed at sign-up is stored and surfaces elsewhere.

**Things that could break** (the name is read/displayed in many places — a name-less store would otherwise show blanks):
- Login session name becomes `" "` (a single space) — flows into bug-report reporter name and an admin audit field.
- Admin **Stores & Users**, Live Activity and Store Details render a blank/whitespace owner name.
- Emails render "Hi ," / "Hello,  " / "Welcome, !".
- The Stripe customer is created with name `" "`.
- The store Profile edit page currently **requires** First/Last Name — a name-less owner could be blocked from saving.
- The public SSO exchange endpoint returns `firstname`/`lastname` to an external site.
- All of the above are addressed by D2 (placeholder derived from Store Name).

**Attachments:** `.claude/attachments/448.jpeg` — could not be opened (the server returned an error page, not an image, on two attempts). The form layout in Part A was reconstructed from the written description and **confirmed by the client (2026-10-27, Q1)**: First Name and Last Name crossed out; Store Name, Country and Business Registration Number (VAT) kept; remaining fields as in the code.

</details>

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Full spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `448` · plan file: `.claude/plans/448-remove-name-fields-from-the-sign-up-form.md` |
| **Type** | Feature — reuse existing parts before making new ones. The registration **server action** (`registerUser`) and its request shape change; list the before/after request, who calls it, input checks, and the existing error format. |
| **Lessons that apply** | L1 — a value that changes must be checked **everywhere** it shows; the name surfaces in admin screens, 5+ emails, Stripe, the session and the public SSO payload (full map below). Size checks per place (L3). |
| **Required for Risk High** | §5 covers all failure cases **plus what happens to existing data**; §7 covers all 16 areas in detail; §4.1 is filled; **take a DB backup before coding, written as a plan step**; **rollback written and tested**; **test on staging with real-like data**; §14 done report is full **with proof of the backup and the rollback test**. |
| **Also for this task** | Scope the shared `registerSchema` (`src/actions/validations.js:5-6`) and the `User` model `required` (`src/models/User.js:8-9`) to the store path **only** — brand/consignor must keep requiring a name. Verify each dependency from the map below stays non-blank for a name-less store. Confirm the placeholder is non-empty (model marks name `required`; precedent: admin/CSV stores default to "Unclaimed"/"Store"). Also drop the name requirement in the store **Profile** edit schema (`src/app/dashboard/profile/Profile.jsx:43-44` and `profileSchema` in `validations.js:93-94`). Key files: `src/app/(auth)/register/StoreForm.jsx`, `src/actions/authActions.js` (`registerUser`), `src/auth.config.js:34`. Dependency map to re-check: admin `stores-users` / `live-activity` / `store-details`, `src/mails/forgotPassword.js`, `src/mails/emailSubscription.js`, `src/lib/subscriptionService.js`, `src/app/api/stripe/addon-checkout/route.js`, `src/app/api/public/auth/exchange/route.js`, `src/auth.js` (session name). |

## 13. Technical summary
**Plan:** `.claude/plans/448-remove-name-fields-from-the-sign-up-form.md`

**Stack confirmed:** Next.js 16 App Router + React 19, JS/JSX · NextAuth v5 (credentials, JWT) · Mongoose 8 (`User` model) · Yup (`src/actions/validations.js`) · react-hook-form. **Layers touched:** Frontend (store sign-up form, store profile form), Backend (`registerUser` action, register + profile Yup schemas), Data (`User` model `required` rule — **no migration, no bulk write**). Auth/session/password untouched (`auth.config.js`/`auth.js` not edited). Scope confirmed store-only: Brand tab is commented out; Consignor shares `registerSchema` and stays name-required.

**Risk:** High (unchanged from plan).

**Acceptance-check table (how each was proven):**
| AC | How verified | Result |
|---|---|---|
| AC-01 name fields gone, others intact | Code: name row removed from `StoreForm.jsx`; Store Name/Country/VAT/Phone/Email/Password remain; build compiles | ✅ (code + build) |
| AC-04 backend save no required error | Code: `registerSchema` + `User` model now store-optional; store path writes a placeholder name; build compiles | ✅ (code + build) |
| AC-09 Consignor still requires names | Code: `.when("role")` `otherwise`→required; `ConsignorForm.jsx` untouched; Brand dormant | ✅ (code) |
| AC-10 existing names unchanged | Code/reasoning: no migration, no bulk update; validators run on write only | ✅ (code) |
| AC-02 register with no name succeeds | Needs a running app + DB | ⏸ staging (see §verification) |
| AC-03 new store can log in | Needs a running app + DB | ⏸ staging |
| AC-05 admin shows non-blank owner | Needs a running app + DB | ⏸ staging |
| AC-06 email greeting non-blank | Needs email trigger on staging | ⏸ staging |
| AC-07 Stripe customer name non-blank | Needs subscription flow on staging | ⏸ staging |
| AC-08 session.user.name non-blank | Needs a logged-in session | ⏸ staging |
| AC-11 store profile saves without a name | Needs a running app + DB | ⏸ staging |
| AC-12 public SSO payload still valid | Needs the SSO exchange on staging | ⏸ staging |

## 14. Done report
**Status:** Code complete and compiling; runtime acceptance checks pending staging (this environment has no test runner and no safe writable DB — verification is designed for a Vercel preview deploy, plan §verification).

**What was done:** all five planned changes implemented exactly as planned (store form name row removed; `registerSchema` + `profileSchema` names made store-optional via `.when("role")`; `User` model `firstname`/`lastname` conditionally required for non-store; `registerUser` writes a store-name placeholder in both the claim and new-user paths; store `profileSchema` relaxed + hidden `role` field added so the rule resolves on client and server).

**Files changed:** exactly the five in §13/plan — `StoreForm.jsx`, `validations.js`, `User.js`, `authActions.js`, `Profile.jsx`. Plus workflow files (`.claude/specs`, `.claude/plans`, `.claude/tasks`, `.gitignore`, `.claude/rules/known-failures.md`) — no other source files.

**Deviation from plan (role handling):** the plan proposed a hidden `register("role")` input to feed the `.when("role")` rules. During the ship security check that was found to introduce a **privilege-escalation vector** — a DOM-editable `role` that `updateUser` would persist. Replaced with a safer design: the client injects the real role from the loaded user into its explicit `profileSchema.validate` call (not an editable field), and the **server derives `role` from the session** for validation and **strips any client-supplied `role` before the DB write** (`delete dataToSave.role`). Net result also closes a pre-existing role mass-assignment gap in `updateUser`.

**Checks:**
- Build: `NODE_OPTIONS=--max-old-space-size=8192 npm run build` → **✓ Compiled successfully**, 113/113 pages, exit 0 (re-run after each fix). Only warnings are the pre-existing Mongoose "duplicate index on productIds" (unrelated).
- Lint: cannot run in this environment — **same as the known-failures list** (`next lint` removed in Next 16; `npx eslint` needs `typescript`, not installed).
- **Security review (mandatory ship gate):** secret/sensitive-file greps clean; `security-review` pass over the scoped diff found **no findings** at the reporting threshold and confirmed the role hardening above. Registration `role` is constrained to `["store","consignor","brand"]` and `new User({...})` is an explicit field allow-list (no mass-assignment).
- **Correctness fix from review:** the model's `required` function was changed from `this.role !== "store"` to `this.role != null && this.role !== "store"`. Under Mongoose update validators (`updateUser` uses `runValidators: true`) `this` is the query and `role` is absent; the original form evaluated to `true` and would have **blocked a nameless store from saving its profile** (AC-11). The new form treats an unknown role as not-required (matching the other role-gated fields); the Yup schema with the session role remains the authoritative gate on updates.

**Runtime ACs (⏸):** AC-02, 03, 05, 06, 07, 08, 11, 12 — to be verified on a Vercel preview deploy with real-like data per plan §verification, before/at ship.

**High-risk items still owed at deploy:** (1) take a MongoDB snapshot before deploying to a shared/staging DB; (2) run the staging verification; (3) record the rollback test (`git revert` + build). These are deploy-time steps, not code, so they are recorded here as outstanding.

## Quality check
**Blockers:** none · **Score:** 92 / 100
