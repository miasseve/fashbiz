# Coverage checklist (§4.4)

Part of the `kodion-create-spec` skill. Used in Step 1 (to find the places) and Step 4 (to fill §4.4).

**Why it exists:** the most common tester comment is "it works on one screen but not another" or "it's gone after a refresh". This checklist finds those gaps **before** coding.

**Rules**
- Use screen names a user would say ("task card", "weekly report"). Never file or component names.
- Only list places that exist in this app. Don't add a phone check to a desktop-only app.
- Every place and every stage gets an acceptance check in §6.
- If something needs a decision only the user can make (which colour, should it show in reports?), ask it in §10. Small UI details (a label, a default) can go in §9 for approval. **Never decide business rules yourself.**

**How much to fill (by Size)**

| Size | Fill |
|---|---|
| Small | Part A only, one row per place the change appears |
| Medium / Large | Parts A, B and C |

---

## Part A: Where it appears

List **every** place a user can see this data or feature. Think about:

| Place | Examples |
|---|---|
| The main screen | the page where it's created or changed |
| Pop-ups and detail views | task pop-up, edit form, preview |
| Lists and tables | task list, search results |
| Cards and boards | task card, Kanban board |
| Dashboards and counters | totals, badges, "3 overdue" counters |
| Reports and exports | weekly report, CSV / PDF export |
| History and completed views | completed tasks, activity log |
| Filters, search and legends | filter dropdowns, colour legends |
| Messages | emails, notifications, in-app alerts |
| Other apps or devices | phone app, admin panel (only if they exist) |

---

## Part B: The life of the item

Check what should happen at **every stage**, not just when it's created:

| Stage | Question to answer |
|---|---|
| Create | Is it shown everywhere from Part A right away? |
| Edit | Does every place update, not just the one being edited? |
| Each status | In progress, waiting, paused: does each stage show the right label and value? |
| Complete | Is it still right after the item is completed? |
| History | Is it right in the completed / history view? |
| Delete or undo | What happens to it everywhere? |
| Page refresh | Is it still there after a refresh? |
| Log out / another device | Is it still there? |
| Reports | Do totals and reports include it, with the right value? |

Skip a stage that doesn't exist for this feature, with a reason.

---

## Part C: What testers usually find missing

Answer each question **Yes + what we need**, or **N/A + reason**:

| # | Question |
|---|---|
| C1 | Is it **saved**, and still there after a page refresh or on another device? |
| C2 | A new **status, type or category**: does it have its own colour, badge, filter option and legend entry? |
| C3 | Is any **word or label shown twice** (e.g. "Waiting" in the badge and again in the text next to it)? |
| C4 | **Side effects**: do timers, tracking, counters, notifications and emails start and stop when they should? |
| C5 | **Validation, empty state and error message**: covered in §5? |
| C6 | **Same rules on every screen**: can the same people see or edit it everywhere? |
