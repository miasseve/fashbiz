# Risk matrix

Part of the `kodion-create-spec` skill. Used in Step 2 to set Size and Risk.
The skill copies the required checks for the chosen Risk level (section 3) into each spec's §12, so plan mode doesn't need this file.

Every spec has **two separate labels** in its header:

| Label | Answers | Decides |
|---|---|---|
| **Size** | How much work is it? | How much the spec writes |
| **Risk** | How bad is it if it goes wrong? | How careful we must be |

They are separate because a small job can be dangerous. Changing one word on the payment button is **Small**, but it's **High** risk.

---

## 1. Size: how much to write

| Size | When | Sections to fill | Length (§1–§11) |
|---|---|---|---|
| Small | One screen or a tiny change: text, colour, one field | Header, Summary (§1–§3), §4.3, §4.4 (Where it appears only), §6, §10, §11, §12, §13, §14, Quality check | ~30 lines |
| Medium | A new section, form or feature on a few screens | All | ~150 lines |
| Large | Many screens, several user types, or more than one part of the system | All, with a deeper §4, §5 and §7 | ~250 lines |

Sections a Small spec doesn't fill keep their heading with `N/A: Small task`. §13 and §14 are always included.

**Risk overrides Size:** if Risk is Medium or High, §5 and §7 are always included, even in a Small spec.

---

## 2. Risk: how careful to be

Pick the **highest** row that matches anything in the task.

| Risk | Triggers (any one is enough) |
|---|---|
| **High** | Saves, changes or deletes stored data · login, passwords, permissions or roles · payments, prices, invoices, money · personal data (names, phones, emails, addresses) · deleting anything · emails or messages sent to real users · legal or consent content |
| **Medium** | Changes something shared by many screens (header, layout, buttons, design rules) · new form or user input · connects to an outside service · changes what search engines see |
| **Low** | Visual or text change on one screen · new content hidden behind a switch · nothing stored, no user input, no outside service |

**Write it in the header with a reason**, e.g.
`Risk: Low — display only, nothing stored, hidden until switched on`

If unsure between two levels, pick the higher one and add it to §9 "Decisions I made".

---

## 3. What each risk level requires

| | Low | Medium | High |
|---|---|---|---|
| **§5 When things go wrong** | Main failure cases | All failure cases | All failure cases + what happens to existing data |
| **§7 Safety checklist** | All 16 areas checked; short "Not involved" reasons are fine | All 16 areas checked | All 16 areas checked, rows in detail |
| **§4.1 Who uses it** | Optional | If more than one user type | Required |
| **Spec approval** | Developer or senior | Senior | Senior, plus the client if business rules change |
| **Plan approval** | Developer or senior | Senior | Senior |
| **Backup before coding** | No | No | **Yes**, written as a plan step |
| **Rollback plan** | One line | Written steps | Written and tested steps |
| **Tested on staging** | Optional | Yes | Yes, with real-like data |
| **Go-live sign-off** | Developer | Senior | Senior + client |
| **Done report §14** | AC table + files changed | Full | Full + proof of backup and rollback test |

---

## 4. Rules

1. The spec skill sets Size and Risk. Plan mode can **raise** Risk if the code scan shows more danger, but never lower it without senior approval.
2. Any change to Risk is written in §13 with the reason.
3. Any open §10 question that blocks "Coding" → no coding starts, at any Risk level.
4. The Git branch is never created, merged or deleted without the developer confirming.

---

## 5. Examples

| Task | Size | Risk | Why |
|---|---|---|---|
| Change footer text colour | Small | Low | One screen, visual only |
| Testimonial section, hidden until switched on | Medium | Low | Display only, nothing stored |
| Redesign the site header | Medium | Medium | Shared by every page |
| Contact form that emails the team | Medium | Medium | User input, sends email |
| Add phone number to user profile | Medium | High | Personal data saved |
| Change the price shown on the payment button | Small | High | Money |
| Admins can delete user accounts | Medium | High | Deleting + permissions |
| Online payment at checkout | Large | High | Money + outside service + personal data |
