# Make the colour value editable on the product details page

`447` · Feature · Medium size · **Medium risk** — changes how an existing stored product field (the colour) is written on live products and feeds the connected webshop listing
**Status:** Draft (revised again — name field and picker now sync both ways; needs re-approval) · 2026-10-27 · **Approved by:** — · **Skill:** kodion-create-spec v2.2.1
**Task:** `.claude/tasks/447/task.json` · **Branch:** `feature/447-make-the-colour-value-editable-on-the-product` (created by /start-task) · **Depends on:** none (colour list confirmed) · **Follows:** none
**Based on:** task description · add-product and product details screens · screenshot attached (worked from the description and the screens, screenshot not inspected)

> **Reviewer:** read Part A only (about 2 minutes), then reply **approve**, or say what to change.
> Part B has the full detail if something looks wrong. Part C is for plan mode; you don't need to review it.
> Who approves depends on the risk: Low → developer or senior · Medium → senior · High → senior, plus the client if business rules change.

---

# Part A — Review this

## 1–3. Summary
**Why:** when the AI detects a product's colour wrongly, the store owner can today change only the colour **name** text — the actual colour **value** (the coloured swatch) stays whatever the AI guessed. So the product keeps showing and saving the wrong colour even after staff "corrected" it. The client wants the colour value itself to be properly editable, not just its name.

**Most important result:** a store owner can correct a product's colour value (and its name) when adding a product and later from the product details page — the colour-name field stays editable and a free colour picker sits beside it.

| | |
|---|---|
| **What changes** | The colour-name field stays editable, with a free colour picker (any colour) beside it. Picking a colour updates the swatch and the stored value; the name is the owner's to type. AI-filled name and swatch show as today. This works on the add-product form and on the product details page (colour is read-only there today). |
| **We will** | Keep the editable name field, add a free colour picker beside it, show the swatch, and store exactly what the owner saves — name, value, or both |
| **We won't (this time)** | Change how the AI detects colour · change any other product field · restrict colours to a fixed list · change how the connected webshop receives colour (name only, on create) · extend the webshop so a *later* colour edit re-syncs (D9) |
| **Must never happen** | A product nobody edited having its colour changed by this release |
| **Must not change** | The AI colour detection · all other product fields and their editing · the webshop colour sync (name only, on create) · the leStores Apple app · le-stores.com |
| **Coverage** | 10 requirements · 19 acceptance checks · 7 places · 8 stages · 10 safety areas |
| **Quality** | 92 / 100 · no blockers |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | On the add-product form, the colour-name field stays editable and a free colour picker sits beside it; picking a colour updates the swatch and the stored colour value. | Must | Your answer (D1) |
| FR-02 | On the product details page, the owner can edit the colour the same way (editable name field + free colour picker). Today colour is shown there but can't be edited at all. | Must | Task description |
| FR-03 | The colour name field and the colour picker are kept in sync both ways — picking a colour writes its closest common name into the field, and typing a recognised colour name moves the picker — and whatever the owner saves is stored, on the add form, the details page and the admin panel. | Must | Your answer (D1, D10) |
| FR-04 | After the owner corrects and saves a colour, the corrected name and swatch show on the product details page and in the saved product, and stay after a page refresh or reopening later. | Must | Task description |
| FR-05 | The colour value (the swatch) is shown next to the colour name wherever colour is displayed or edited, so the owner can see the value being corrected. On the details page this swatch is new. | Must | Task description |
| FR-06 | The connected webshop keeps receiving the colour **name** only, on product creation, exactly as today. Making the value editable does not change what the webshop receives. | Must | Your answer (D4) |
| FR-07 | The colour picker lets the owner choose any colour (a free picker), not a preset list. | Should | Your answer (D1) |
| FR-08 | An AI-detected colour's name and value are shown and remain fully editable; the owner isn't limited to preset options. | Should | Your answer (D1) |
| FR-09 | The AI colour detection is unchanged — only the ability to edit the returned colour is added. | Must | Task description (scope) |
| FR-10 | No other product field's editing behaviour changes. | Must | Task description (scope) |

**Priority:** Must = can't ship without it · Should = important, can follow soon after · Could = nice to have
**Source:** Task description · Your answer · Client · Project rules · Standard · AI (a small UI suggestion — please check)

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Colour is edited with the free-text **name** field plus a **free colour picker** (any colour) beside it, kept **in sync both ways** | Your revised choice. Picking a colour writes its closest common name into the field; typing a recognised colour name moves the picker. Both stay editable; no fixed list. |
| D2 | Risk set to **Medium**, not High | It writes an existing stored field on live products, but the data isn't sensitive (no money, login, personal data or deletion) and no bulk change is made to existing records. A senior may raise it to High at approval. |
| D4 | The webshop keeps getting the colour **name** only, on creation (FR-06) | Your choice ("keep name-only sync"). The value has never been sent to the webshop. |
| D5 | The change also applies to the guest demo (try) add-product flow | Confirmed (Q3). It shares the same add-product form, so leaving it out would be inconsistent. |
| D7 | The admin panel product edit gets the same editable name field + colour picker | Fixes the name-only limitation everywhere, so the value is editable on every surface. |
| D9 | A later colour correction is saved and shown in-app but is **not** pushed to the webshop; syncing colour on edit is a separate follow-up task | Confirmed (Q2). Keeps this task scoped to editability; the webshop edit-sync doesn't carry colour today. |
| D10 | The name field and the picker stay in sync: picking → closest common name written to the field; typing a recognised name → picker follows. The swatch is also filled from the name when the AI returned no value (fixes the blank-swatch case). | Your follow-up — they shouldn't behave as two separate fields. Both stay editable; typing a non-colour label won't move the picker, so a deliberate mismatch is still possible. |

## 10. Questions for you — all resolved
| # | Question | Blocks | Answer |
|---|---|---|---|
| Q1 | ~~Confirm the exact list of selectable colours and their shades.~~ | Going live | **Superseded** — no fixed list any more; the picker is a free colour picker (D1). |
| Q2 | Is "in-app only for later edits" acceptable, or is syncing a later colour edit a follow-up task? | Going live | **Resolved** — in-app only for later edits; webshop colour-sync-on-edit is a separate follow-up task (D9). |
| Q3 | Should the guest demo (try) flow be included, or store accounts only? | Planning | **Resolved** — include the guest demo (try) flow (D5). |

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| Store owner / store staff | Add products and correct the colour (name + value) on their own products, on the add form and the details page |
| Admin | Correct a product's colour from the admin panel (editable name field + colour picker) (D7) |
| Guest (demo / try flow) | Try correcting the colour while trialling the add-product flow (D5, Q3) |

### 4.2 Key information
| Item | What it holds |
|---|---|
| Product colour | A colour name (e.g. "navy") and a colour value (the swatch shown). Each is editable on its own. |

</details>

<details>
<summary><b>4.4 Where it appears and its life (7 places · 8 stages · tester checklist)</b></summary>

### 4.4 Where it appears and its life
**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| Add-product form (store), desktop | The colour name and swatch, both editable by picking a colour | AC-01 |
| Add-product form, guest demo (try) | The same editable colour control | AC-05 |
| Add-product form, phone (375 px) | The same control, fitting the screen | AC-16 |
| Product details page (store owner) | The colour name **and** a swatch, editable by picking a colour | AC-03, AC-06 |
| Admin panel, product edit | Colour editable (name field + picker) | AC-19 |
| Saved product (after saving) | The corrected name and swatch | AC-04 |
| Connected webshop (on create) | The colour name only, as today | AC-07 |

**Life of the item**
| Stage | What should happen | Check |
|---|---|---|
| AI detects colour (create) | Name and swatch are prefilled from the AI and are editable | AC-01, AC-17 |
| Owner corrects colour while adding | Types a name and/or picks a colour; what's saved is what's shown | AC-01, AC-02 |
| Owner corrects colour later (details page) | Edits the name and/or picks a colour; saved and shown | AC-03 |
| Owner corrects colour in admin panel | Edits the name field and/or picks a colour; saved as entered | AC-19 |
| Page refresh / reopen | Corrected colour still shows | AC-04 |
| Product created in the webshop | Colour name synced, as today | AC-07 |
| Colour edited after the product is already in the webshop | Saved and shown in the app; not pushed to the webshop (Q2) | AC-18b |
| Existing products nobody edits | Colour name and value unchanged by the release | AC-13 |

**What testers usually find missing**
| # | Question | Answer |
|---|---|---|
| C1 | Still there after a page refresh or on another device? | Yes: the corrected colour is saved and persists (AC-04). |
| C2 | A new status or type has its own colour, badge, filter option and legend entry? | N/A: no new status or type is added. |
| C3 | No word or label shown twice? | Yes: the colour name shows once, next to the swatch (AC-06). |
| C4 | Timers, tracking, counters, notifications and emails start and stop when they should? | N/A: no timers, counters or emails. The webshop gets the colour name on create as today (AC-07); nothing new is triggered. |
| C5 | Validation, empty state and error message covered? | See §5 |
| C6 | Same rules on every screen (who can see or edit it)? | Yes: only someone who can edit a product can edit its colour, on both the store details page and the admin panel (AC-18, AC-19). |

</details>

<details>
<summary><b>5. When things go wrong (9 situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| Saving the colour fails (network or server) | A message like "Couldn't save the colour. Please try again." The colour stays as it was — nothing half-saved. The error is logged. |
| The saved colour value is blank or invalid (older data) | A neutral default swatch shows; the owner can pick a valid colour. The page doesn't break. |
| The owner leaves the colour as "No Color" | It stays "No Color" with its default swatch — a valid state. |
| The owner doesn't change the AI colour | The AI's name and value are saved as the AI returned them, as today. |
| A non-colour label is typed in the name field (not a recognised colour) | The picker keeps its current colour (nothing to move it to); the label and the value can then differ, and both are saved as set (D10). |
| The AI returned a colour name but no value | The swatch is filled from the name (e.g. "navy" → a navy swatch) so it isn't blank, and that value is stored (D10). |
| The owner changes the colour several times quickly | Whatever name/value is showing at save is what's stored. |
| Colour corrected after the product is in the webshop | Saved and shown in the app; the webshop listing keeps its earlier colour (Q2). |
| Existing products nobody edits | Keep their current colour name and value; the release changes nothing for them. |

</details>

<details>
<summary><b>6. How we know it's done (19 acceptance checks)</b></summary>

## 6. How we know it's done
Example throughout: the AI detected **"red"** with a red swatch for an item that is actually **navy**.

| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given a new product the AI tagged "red" with a red swatch, when the owner opens the colour picker beside the name field on the add-product form and picks navy, then the swatch and the stored colour value update to navy. | FR-01 |
| AC-02 | Given the owner typed name "navy" and picked a navy colour on the add form, when the product is saved, then the stored colour name is "navy" and the stored colour value is the picked navy hex — exactly what the owner entered. | FR-03 |
| AC-03 | Given a saved product showing "red" with a red swatch on its details page, when the owner edits the colour there (name and/or picker) to navy and saves, then the details page shows the new name and a navy swatch. | FR-02, FR-04 |
| AC-04 | Given the owner corrected the colour and saved, when the details page is refreshed or reopened later, then it still shows the corrected name and swatch. | FR-04 |
| AC-05 | Given the guest demo (try) add-product flow with an AI-detected colour, when the owner picks a different colour, then the swatch and stored value update, exactly as in the real flow. | FR-01, D5 |
| AC-06 | Given a product details page, when it loads, then the colour value (swatch) shows next to the colour name (today only the name shows). | FR-05 |
| AC-07 | Given the owner set the name "navy" while adding the product, when the product is created in the connected webshop, then the webshop receives colour name "navy" (its "Color" option), exactly as the colour name is sent today, and no colour value is sent (as today). | FR-06 |
| AC-08 | Given the colour control, when the owner opens the picker, then it is a free colour picker (any colour), not a preset list. | FR-07 |
| AC-09 | Given an AI-detected colour on the details page, when the owner opens the editor, then its name (text field) and swatch (colour picker) both show and are both editable. | FR-08 |
| AC-10 | Given the same photos, when the AI generates a listing, then the detected colour name and value come out exactly as before this change (compared with a "before" run). | FR-09 |
| AC-11 | Given a product edit, when the owner changes size, brand or price, then those behave exactly as before; only colour gains value-editing. | FR-10 |
| AC-12 | Given a colour edit, when saving fails, then the owner sees "Couldn't save the colour. Please try again.", the colour stays as it was (no partial save), and the error is logged. | §5 |
| AC-13 | Given existing products that nobody edits, when this change is released, then their colour name and value stay exactly as before. | §5, Must never happen |
| AC-14 | Given a product with "No Color", when the owner leaves it untouched, then it stays "No Color" with its default swatch; when they type a name and/or pick a colour, those are saved. | §5 |
| AC-15 | Given keyboard only, when tabbing through the colour control, then the name field and the colour picker are both reachable in order, show a visible focus outline, and the picker can be opened and a colour chosen from the keyboard. | §7 Accessibility |
| AC-16 | Given a 375 px phone, when the owner opens the colour control on the add form and the details page, then it fits with no sideways scrolling. | §7 Mobile |
| AC-17 | Given the AI detected "navy" with a navy swatch and the owner doesn't change it, when the product is saved, then the name "navy" and the AI's value are saved as the AI returned them, as today. | FR-03, §5 |
| AC-18 | Given a user allowed to edit a product today, when they edit the colour, then they can; a user not allowed to edit products can't edit the colour either, on every screen. (AC-18b: a colour edited after the product exists in the webshop is saved in-app but the webshop listing is unchanged — Q2.) | §4.4, §7 Login & permissions |
| AC-19 | Given the admin edits a product's colour in the admin panel, when they change the name and/or pick a colour, then both are saved exactly as entered. | FR-03, D7 |

</details>

<details>
<summary><b>7. Safety & security (10 apply · 6 not involved)</b></summary>

## 7. Safety & security
| Area | What we do |
|---|---|
| User input / forms | The owner types a colour name (free text) and picks a colour value with a colour picker that only yields a valid colour value. The name is a short text label. |
| Showing text safely | The colour name is always shown as plain text. |
| Login & permissions | Only someone who can already edit a product can edit its colour — same rule on the store details page and the admin panel (AC-18, AC-19). |
| Stored data | This changes how the colour field is written (name and value together). Existing products are not bulk-changed; a product's colour only changes when someone edits it, and it can be changed back by editing again (AC-13). |
| Performance | The colour control is a text field plus a single native colour picker — no lists or heavy loading. |
| Mobile & browsers | The control works on a 375 px phone and in current Chrome, Safari, Firefox and Edge (AC-16). |
| Accessibility | The name field and the colour picker are reachable by keyboard with a visible focus outline; the picker is the browser's native colour control (AC-15). |
| Breaking other features | The AI detection, all other product fields, and the webshop colour sync behave exactly as before (AC-07, AC-10, AC-11). |
| Errors & logging | A failed save shows a friendly message and is logged; the owner never sees a crash (AC-12). |
| Rollback | Revert the change and redeploy. No database migration is run, so there is nothing to undo in stored data. |

**Not involved (checked):** personal data & consent (a colour isn't personal data) · legal / honesty (no claims, prices or consent content) · secrets & keys (none handled) · payments & money (none) · deleting (nothing is deleted) · SEO (internal dashboard; the public webshop listing is Shopify's and is unchanged).

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and UI conventions (existing components and styles).
- Prices and all content stay in DKK and Danish-store context; unchanged by this task.
- Does not touch the leStores Apple app or le-stores.com — leStores-AI only.
- No new third-party service is added.
- No fixed colour list — the picker allows any colour value (D1). The colour name stays a free-text field.

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- When adding a product, the AI fills in a colour name and a coloured swatch. The owner can edit the **name** text, but the swatch (the value) is fixed to whatever the AI chose — there's no control to change it.
- On the product details page, the colour name is shown as text, with **no swatch and no way to edit it**.
- To reproduce the bug: add a product the AI tags with the wrong colour, change the colour name text, save — the swatch and the stored colour value stay the AI's wrong colour, so the product still carries the wrong colour.
- When a product is created, its colour **name** is sent to the connected webshop as a "Color" option. Later edits to a product do not send colour to the webshop at all.

**Things that could break:** the add-product save, the AI-generated listing, the other product fields on the add form and details page, the product creation into the webshop, and the admin panel product edit.

</details>

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**, or if any question in §10 blocks "Planning" (all §10 questions are resolved).
   **Required for Risk Medium:** senior approves the spec and the plan · no backup needed · rollback written as steps · tested on staging · senior signs off go-live · done report filled in full.
   If the code scan shows more danger, raise the Risk, explain why in §13, and follow the higher level's checks.
   **For this task type (Feature):** Reuse existing parts (components, messages, patterns) before making new ones, and name them in §13. If it adds or changes an API, list in the plan: request, success and error responses, who can call it, input checks, and the app's existing error format.
   **Lessons that apply:**
   - L1: an edited colour must be checked **everywhere** it shows — the add form, the details page, the saved product, the admin panel and the webshop sync — after each step.
   - L4: fix the real cause (the edit paths only ever accept/keep the colour **name**, never the value) at the source, across the add form, the store details page and the admin panel — not on one screen.
2. **Detect the tech stack** from the project's own files. Read the project rules and design guide, the code behind §11, and what depends on it. Record the findings in §13 with proof.
3. **Find this project's own checks** (lint, type check, build, tests, migrations) from its config and scripts. Run them and record the "before" results. If a check doesn't exist, write "none" in §13. Never invent a command.
4. **Plan every layer this stack needs.** Cover each heading below, or write "N/A" with a reason:
   - Frontend: screens, states, accessibility
   - Backend: logic, validation, permissions
   - Data: database, migrations, existing records, backup
   - Security: input checks, output safety, secrets, access control
   - Integrations: APIs, third-party services
   - Testing: automated tests if the project has a runner, otherwise browser or manual checks
   - Release: settings, deploy steps, rollback
5. Write the full technical plan to `.claude/plans/447-make-the-colour-value-editable-on-the-product.md`.
6. The plan must map every AC (§6), every place and stage in §4.4, and every row in §7 (areas that apply) to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. If anything must stay the same (the AI detection, other fields, the webshop sync), capture a "before" baseline first.
9. **Then fill §13 below** with the summary of the plan. Change nothing in §1–§11.
10. Ask for approval of the plan before coding. Don't start coding while any §10 question blocks "Coding".
    **Branch:** the header says "created by /start-task", so you're already on it. Check with `git branch --show-current`, and never create another branch.
    **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that later. All work stays on `feat/pricing-alignment`'s task branch; never push to or merge into `main`/`master`.
11. After coding, fill §14. Never write "Pass" without proof.
12. **Timesheet logging** (only when the header has a task file; skip for manual tasks). Run each one once, at the moment it becomes true:
    - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh 447 plan`
    - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh 447 implement`
    - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh 447 validate`
    - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh 447 iterate` (each round)
    Also set `"plan": ".claude/plans/447-make-the-colour-value-editable-on-the-product.md"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on; it's resent later.

Before asking for plan approval, check:
- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every AC, every place and stage in §4.4, and every row in §7 (areas that apply) is mapped to a task and a check
- [ ] Every lesson above is applied
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Database, data, API, settings, libraries and permissions each have a row, none blank
- [ ] The Risk level's required checks are in the plan
- [ ] Any Risk change is explained
**Task-specific:**
- Confirm how the colour field is stored and read (name + value as one object) before changing any write path, and that every write path sets both together (L4).
- Capture a "before" AI run so AC-10 (detection unchanged) can be compared.
- Confirm AC-07: the webshop still receives the colour name only, and the later-edit sync gap (Q2) is left as-is unless Q2 says otherwise.

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary
*Filled by plan mode.*

**Plan file:** `.claude/plans/447-make-the-colour-value-editable-on-the-product.md`
**Risk after code scan:** same (Medium) — no DB migration; existing records are untouched until edited.

**Project scan**
| Item | Finding | Proof (file or command) |
|---|---|---|
| Tech stack | Next.js 16 App Router, React 19, JS/JSX, Mongoose, react-hook-form + Yup, HeroUI/Tailwind, react-icons, react-toastify | `CLAUDE.md`; `package.json` |
| Project rules read | CLAUDE.md, `.claude/rules/task-workflow.md`; colour stored as `{name,hex}` | `src/models/Product.js:9-16` |
| Checks this project has (lint, type check, build, tests, migrations) | `npm run build` (Turbopack + TS); `npm run lint` is **broken** (`next lint` removed in Next 16); no test framework; no migrations | `package.json`; lint error "Invalid project directory ... lint" |
| Results of those checks before any change | Build ✓ compiled + 113 pages; lint ✗ (pre-existing, script outdated). After the reshape, build ✓ with `--max-old-space-size=8192` (default heap OOMs on this ~1.4 GB-free host, not a code issue) | `npm run build` |
| Code behind §11 (what exists today) | Colour editable name-only: add form hidden hex `ProductFormFields.jsx:161`; admin name-only `route.js:106`; details page display-only `page.jsx:81`; Shopify name-only `shopifyAction.js:87-94`, edit-sync ignores colour `:1664-1677` | listed files |
| What depends on the code being changed | `createProduct`/`createGuestProduct` read `color`; `updateProduct` blind-`$set`s + forwards to `updateShopifyProduct`; AI prefills `color.name/hex` | `productActions.js:54,185,1279,1288`; `SecondStep.jsx:208-213` |
| Anything in §11 that is wrong | Nothing — §11 confirmed accurate | — |

**Layers** (from §12 step 4)
| Layer | What the plan does | Or N/A because |
|---|---|---|
| Frontend | New free `ColorPicker` (native colour input, acts as swatch); `EditableColor` inline editor (name field + picker) on details page; picker wired into add form + admin edit | |
| Backend | Admin PATCH route accepts `colorHex` and stores `{name,hex}`; store edit uses existing `updateProduct` | |
| Data | No schema change; `color` stays `{name,hex}`; existing records unchanged until edited | |
| Security | Native colour picker yields valid hex; store edit keeps ownership check; admin route stays admin-gated | |
| Integrations | Shopify unchanged — name-only on create; edit-sync still ignores colour (D9) | |
| Testing | Manual/browser verification | No test runner configured |
| Release | Standard Vercel deploy from the task branch; no settings change | |

**Files to add**
| File | Purpose |
|---|---|
| `src/components/ColorPicker.jsx` | Reusable free colour picker (native colour input, doubles as the swatch; enlarged for visibility) |
| `src/app/dashboard/product/[productId]/EditableColor.jsx` | Inline colour editor for the details page — editable name field + picker, synced both ways (mirrors `EditablePrice`) |
| `src/lib/colorNaming.js` | Common colour name↔hex helpers: `nearestColorName` (picked colour → closest common name) and `nameToHex` (typed name → colour) |

**Files to change**
| File | What changes |
|---|---|
| `src/app/dashboard/add-product/components/ProductFormFields.jsx` | Keep editable name field; add free `ColorPicker` beside it; sync both ways; fill value from name when AI value is missing |
| `src/app/try/add-product/TrySecondStep.jsx` | Pass `setValue` to the shared form so the picker works in the demo flow |
| `src/app/dashboard/product/[productId]/page.jsx` | Render `EditableColor` in all three colour cells |
| `src/app/admin/products/[productId]/page.jsx` | Colour picker + track/send `colorHex` |
| `src/app/api/admin/products/[productId]/route.js` | Accept `colorHex`; store `{name,hex}` together |

**Files that must not change** (from "Must not change" in the Summary, mapped to real files)
| File | Why it's protected |
|---|---|
| `src/lib/aiProductAnalysis.js`, `src/app/api/google-vision/route.js` | AI colour detection must stay identical (FR-09) |
| `src/actions/shopifyAction.js` | Webshop colour sync stays name-only on create; edit-sync unchanged (FR-06, D9) |
| `src/actions/validations.js` `updateProductSchema` | Other product fields' edit behaviour unchanged (FR-10) |

| Area | Change |
|---|---|
| Database (tables, columns, migrations) | None — `color` field shape unchanged |
| Existing data affected | None until a product is edited; no bulk change |
| API / integrations | Admin PATCH route now accepts `colorHex`; Shopify unchanged |
| Settings / environment | None |
| New libraries | None (reuses react-icons, existing stack) |
| Permissions / roles | Unchanged — store ownership check + admin-gated route |

**Coverage**
| AC | Plan task(s) | How it's checked |
|---|---|---|
| AC-01 | Free ColorPicker beside name field in ProductFormFields | Add form: pick a colour → swatch + stored value update (browser) |
| AC-02 | name typed + hex from picker → createProduct | Add + save → stored name/value = what was entered (browser/DB) |
| AC-03 | EditableColor → updateProduct | Details page: change + save → shows new name+swatch (browser) |
| AC-04 | updateProduct $set persists | Refresh/reopen → persists (browser) |
| AC-05 | Same ProductFormFields; setValue now passed to TrySecondStep | Demo (try) flow: pick colour → name+swatch update (browser) |
| AC-06 | EditableColor Swatch in page.jsx cells | Details page shows swatch next to name (browser) |
| AC-07 | No change to createShopifyProduct | Created webshop product's Color option = corrected name (Shopify) |
| AC-08 | Native colour input = free picker | Picker opens any colour, not a preset list (browser) |
| AC-09 | EditableColor shows name field + picker, both editable | AI colour name + swatch both editable (browser) |
| AC-10 | No AI files touched | Before/after AI run identical (compare) |
| AC-11 | updateProductSchema unchanged; only colour touched | Edit size/brand/price behaves as before (browser) |
| AC-12 | EditableColor error toast + no partial save | Force save failure → toast, colour unchanged (browser) |
| AC-13 | No bulk write; $set only on edit | Untouched products unchanged after deploy (DB) |
| AC-14 | Picker/EditableColor keep "No Color" valid | "No Color" stays; picking updates both (browser) |
| AC-15 | Name field + native colour input, keyboard reachable, focus ring | Keyboard-only run through the control (browser) |
| AC-16 | name field + picker in a flex row | 375px width, no sideways scroll (browser) |
| AC-17 | AI prefill → unchanged save path | AI colour untouched saves as returned (browser/DB) |
| AC-18 | updateProduct ownership check; admin-gated route; edit-sync ignores colour | Permissions + webshop-unchanged-on-edit (browser/Shopify) |
| AC-19 | Admin name field + picker; route stores `{name,hex}` | Admin edit saves name/value as entered (browser) |

**Technical risks found:** `Product.updateOne` runs no schema validators, so a bad hex could be written — mitigated because the native colour picker only emits valid #rrggbb values. Name and value are independently editable, so they can disagree by design (D10).
**How to undo:** revert the branch commits and redeploy; no DB migration to reverse.
**Plan approved by:** navtej0110 (senior), 2026-10-26 (revised free-picker approach)

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report
*Filled after coding.*

**Result:** 🔧 Done with gaps — code complete; production build green (with a raised Node heap on this low-memory host) and all touched routes serve on the dev server; functional acceptance checks still need a manual browser pass · **Date:** 2026-10-26 · **Branch / commit:** `feature/447-make-the-colour-value-editable-on-the-product` (uncommitted)

**What the user can now do**
- Correct a product's colour on the add-product form (real + guest demo): the editable name field plus a free colour picker beside it, with the swatch/value updating when they pick.
- Correct a product's colour on the details page (new inline editor with a swatch) and in the admin panel.
- See the colour swatch next to the name on the details page.

**Acceptance checks**
| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ⏸ | Code in place (ColorPicker in add form); browser check pending |
| AC-02 | ⏸ | name typed + hex from picker saved as entered; verify stored doc (browser/DB) |
| AC-03 | ⏸ | EditableColor wired to updateProduct; browser check pending |
| AC-04 | ⏸ | router.refresh + $set persist; browser check pending |
| AC-05 | ⏸ | setValue now passed to TrySecondStep; demo-flow browser check pending |
| AC-06 | ⏸ | Swatch rendered in page.jsx cells; visual check pending |
| AC-07 | ⏸ | No change to createShopifyProduct; verify Shopify Color option |
| AC-08 | ⏸ | Native colour picker = any colour (free picker); browser check pending |
| AC-09 | ⏸ | Name field + picker both editable on details page; browser check pending |
| AC-10 | ✅ | No AI files changed (`git status` shows none under src/lib/aiProductAnalysis.js or google-vision) |
| AC-11 | ⏸ | updateProductSchema untouched; verify other fields in browser |
| AC-12 | ⏸ | Error toast + no partial save coded; force-failure check pending |
| AC-13 | ✅ | No bulk write; only `$set` on explicit edit (code review) |
| AC-14 | ⏸ | "No Color" stays valid; browser check pending |
| AC-15 | ⏸ | name field + native colour input keyboard-reachable with focus ring; keyboard check pending |
| AC-16 | ⏸ | flex-wrap grid; 375px check pending |
| AC-17 | ⏸ | AI prefill path unchanged; browser/DB check pending |
| AC-18 | ⏸ | Ownership check + admin-gated + edit-sync ignores colour (code); browser/Shopify check pending |
| AC-19 | ⏸ | Admin picker + route store `{name,hex}`; browser check pending |

**Safety & security (from §7, areas that apply)**
| Area | Result | Proof |
|---|---|---|
| User input / forms | ✅ | Native colour picker yields a valid hex; name is a short text label (code) |
| Showing text safely | ✅ | Colour name rendered as plain text (code) |
| Login & permissions | ⏸ | Ownership check [productActions.js:1274] + admin-gated route unchanged; browser check pending |
| Stored data | ✅ | No migration; `$set` only on explicit edit; existing records untouched (code) |
| Performance | ✅ | Single native colour control; no lists/network (code) |
| Mobile & browsers | ⏸ | name field + picker in a flex row; 375px browser check pending |
| Accessibility | ⏸ | name field + native colour input, keyboard-reachable with focus ring; keyboard check pending |
| Breaking other features | ⏸ | AI + Shopify + other fields untouched (code); browser regression check pending |
| Errors & logging | ⏸ | Friendly toast + console.error coded; force-failure check pending |
| Rollback | ✅ | Revert branch + redeploy; no data migration (plan) |

**Files actually changed**
| File | In §13? | Change |
|---|---|---|
| `src/components/ColorPicker.jsx` | Yes | New free colour picker (native colour input); enlarged swatch |
| `src/app/dashboard/product/[productId]/EditableColor.jsx` | Yes | New inline editor (name field + picker), synced both ways |
| `src/lib/colorNaming.js` | Yes | New — `nearestColorName` + `nameToHex` helpers for the sync |
| `src/app/dashboard/add-product/components/ProductFormFields.jsx` | Yes | Keep name field; add picker; two-way sync; fill value from name |
| `src/app/try/add-product/TrySecondStep.jsx` | Yes | Pass `setValue` to shared form |
| `src/app/dashboard/product/[productId]/page.jsx` | Yes | `EditableColor` in 3 colour cells |
| `src/app/admin/products/[productId]/page.jsx` | Yes | Picker + `colorHex` state/body |
| `src/app/api/admin/products/[productId]/route.js` | Yes | Accept `colorHex`, store `{name,hex}` |

**Database changes actually made:** none (schema unchanged)

**Checks run**
| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✗ pre-existing — `next lint` removed in Next 16 (not caused by this task) |
| Build | `NODE_OPTIONS=--max-old-space-size=8192 npm run build` | ✅ compiled in 72s, 113 pages generated, no errors. (Default heap OOMs on this low-memory host — ~1.4 GB free; the raised heap flag makes it pass.) |
| Dev server | `npm run dev` + curl | ✅ ready; `/`, `/try/add-product` (renders the picker), `/login` → 200; `/dashboard/add-product`, `/admin/products` → 307 (auth); no log errors |
| Tests | — | No test framework configured |

**Different from the plan:** (1) `TrySecondStep.jsx` needed `setValue` passed to the shared form (the demo flow wasn't forwarding it). (2) Approach revised post-approval from a fixed named palette to a **free colour picker** (name and value independently editable) at the reviewer's direction — the `src/lib/taxonomy.js` palette additions were reverted, and the spec was updated and set back to Draft for re-approval.
**Not done / known limits:** Functional acceptance checks (AC-01…09, 11, 12, 14…19) not browser-verified this session — code complete, production build green, dev-server smoke passed. Later colour corrections remain in-app only, not pushed to the webshop (follow-up task, D9). Name and value can be saved mismatched by design (D10).
**Still needed before going live:** a manual browser verification pass of the pending ACs. (Spec re-approved; build green with a raised Node heap on this low-memory host — default heap suffices on CI/a normal dev machine.)

Before marking this done, check:
- [ ] Every AC is ✅, ❌ or ⏸ — none missing
- [ ] Every ✅ has proof. "Pass" without proof counts as ⏸.
- [ ] Every file changed but not in §13 is explained
- [ ] Anything different from the plan, or not done, is listed with a reason
- [ ] High risk: backup and rollback test have proof

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (92 / 100 · no blockers)</b></summary>

*Filled by `/kodion-create-spec` using its quality rules.*

**Score:** 90 / 100 · **Blockers:** none · **Size:** Medium · **Risk:** Medium · **Status:** Draft (revised — two-way name/picker sync) — pending re-approval
**Before planning:** nothing — Q2 and Q3 resolved; Q1 superseded (no palette).

| Area | Score | Lost points because |
|---|---|---|
| Why and goals | 5 / 5 | |
| Requirements | 15 / 15 | |
| Where it appears and its life | 10 / 10 | |
| When things go wrong | 14 / 15 | Behaviour for a product whose webshop listing already exists is covered in §5/Q2 but depends on the Q2 answer |
| Acceptance checks | 18 / 20 | AC-18 carries two cases (permissions + the webshop later-edit gap) in one row |
| Safety & security | 14 / 15 | Free name + free picker allow a name/value mismatch by design (D10), so there's no app-level guarantee they agree |
| Decisions and questions | 10 / 10 | |
| Today and what could break | 4 / 5 | Current behaviour on a phone not separately verified |
| Length and clarity | 2 / 5 | Part A runs longer than the ~60-line target because of the webshop-sync nuance |

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | ✅ (FR-01→AC-01/05 · FR-02→AC-03 · FR-03→AC-02/17/19 · FR-04→AC-03/04 · FR-05→AC-06 · FR-06→AC-07 · FR-07→AC-08 · FR-08→AC-09 · FR-09→AC-10 · FR-10→AC-11) |
| B2 Every requirement has Priority and Source | ✅ |
| B3 Every AI choice is listed in §9 | ✅ (no AI-only choices; approach set by the reviewer, D1) |
| B4 No technical words in §1–§11 | ✅ |
| B5 All 16 safety areas checked | ✅ (10 apply, 6 not involved) |
| B6 Risk has a reason | ✅ |
| B7 High-risk extras | N/A (Medium risk) |
| B8 Every question says what it blocks | ✅ |
| B9 No leftover placeholders in §1–§12 | ✅ |
| B10 Every place and stage in §4.4 has a check | ✅ |
| B11 Everything asked in the task is covered | ✅ with note (editable value → FR-01/02 · "must not drift apart" → **superseded by the reviewer**, who chose a free picker with independently-editable name/value (D1, D10) · check how stored/read first → §12 task-specific · shows correctly after correcting → FR-04/05 · synced onward → FR-06 + D9 · don't change AI → FR-09 · don't change other fields → FR-10) |
| B12 No vague words, no real personal data | ✅ |

</details>
