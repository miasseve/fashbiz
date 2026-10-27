# Spec quality rules

Part of the `kodion-create-spec` skill. Used in Step 5 before the spec is saved.
Section 5 is copied into each spec's §12 and section 6 into §14, so plan mode doesn't need this file.

---

## 1. Writing rules

1. **Plain words.** A non-technical client can read and approve it. No code, file names, database tables, tool names or tech stack.
2. **No invention.** Every requirement comes from the task description, the user's answers, the client, project rules, a standard, or AI. "AI" is allowed **only for small UI details** (a label, a default, a timing) that don't change scope or business rules; these are listed in §9 for approval. Anything that adds scope or sets a business rule goes to §10 as a question.
3. **Decide or ask.** No "maybe", "if needed", "where relevant". Either decide it (and list it in §9) or ask it (in §10).
4. **Testable, and checkable here.** Every requirement has at least one pass/fail acceptance check in §6, and every check names what it covers. A requirement whose check can't actually be run in this project (it needs a device, a simulator, a designer's eye, or a tool the project doesn't have) is **not a requirement** — it belongs in §10 as a question. Never write a check you already know will end as ⏸.
5. **Say it once.** Each point lives in one section only. A row of the At a glance box (e.g. **Keep**, **Danger**) is never repeated in §1–§3 or in Part B.
6. **Link, don't copy.** Refer to project rules by name. Don't repeat them.
7. **Fit the size.** Use the length and sections set by the risk matrix. Length follows Size, not Risk.
8. **No guessing about the code.** §11 describes what a user sees today. Code facts belong to plan mode in §13.
9. **Keep everything asked.** Every part of the task description becomes a requirement. Never drop or weaken one. If one can't be done, keep it and ask about it in §10. If a Standard or Project rule changes part of it (e.g. "reduce motion" stops rotation), keep the requirement and note the exception in §9.
10. **Real example values.** Write "change estimate 2h → 3h; the card shows 3h", never "the estimate updates correctly".
   Banned words in requirements and checks: *works properly, correctly, as expected, appropriate, user-friendly, fast, smooth, etc., and so on*.
11. **No personal data.** Never copy real names, emails, phone numbers or addresses from screenshots or messages. Use made-up ones: "Customer A", "user@example.com".
12. **Apply lessons learned.** Check `references/lessons-learned.md` (and the project's `.claude/rules/lessons-learned.md` if it exists). Copy every lesson that applies into §12.
13. **Short wins.** If a sentence doesn't change what gets built or how it's checked, delete it. Part A stays within its line cap (~70 lines Medium/Large, ~55 Small size), and §1–§3 is two lines rather than a table. Detail goes to Part B, never into shorter requirements.
14. **A visual must save words.** The "At a glance" box is always filled, all eight rows, always plain text. At most one drawing, and only when it replaces text: a Mermaid block (`graph LR`, `graph TD` or `sequenceDiagram`), plus a plain-text copy under it when `.claude/spec-visuals` says `mermaid+text`. 14 lines at most, any text copy 70 characters wide at most, and in the same plain words as the rest of the spec. See `references/visuals.md`.

---

## 2. Blockers

**Any one of these fails the spec, even with a high score.** The skill fixes them before saving.

| # | Blocker |
|---|---|
| B1 | A requirement without an acceptance check, **or an acceptance check that names no requirement** (its "Covers" column must name an FR, or the box's "Keep" row it protects) |
| B2 | A requirement without a Priority or a Source |
| B3 | An "AI" source or AI decision not listed in §9, or one that adds scope or sets a business rule |
| B4 | Code, file names, tables, tool names or tech stack anywhere in §1–§11 |
| B5 | One of the 16 safety areas missing from §7 (neither a row nor in the "Not involved" line), or "Not involved" without a reason |
| B6 | Risk missing from the header, or missing a reason |
| B7 | High risk without §4.1 "Who uses it", or without failure cases for existing data in §5 |
| B8 | A question in §10 without "Blocks" and "Who answers" |
| B9 | Leftover placeholder text (`...`, `<...>`, `TBD`) in Parts A or B, or in §12 |
| B10 | A place in §4.4 without an acceptance check. Medium / Large: also a stage without a check, or a C1–C6 row left blank |
| B11 | Something asked in the task description that no requirement covers, or that a requirement weakens |
| B12 | A banned vague word in §4.3 or §6, or real personal data anywhere in the spec |
| B13 | The "At a glance" box missing, any of its eight rows left blank, or "Verdict" saying "Ready to approve" while a §10 question blocks Planning |
| B14 | More than one drawing in Part A, a drawing over 14 lines (or a text copy over 70 characters wide), a Mermaid shape the text renderer can't draw (anything but a rectangle, a diagonal arrow, a class or state diagram), a drawing that repeats a sentence next to it, a Mermaid block used for the At a glance box, or any drawing outside Part A |

---

### Small specs (small track)

A small spec is checked for these blockers only. There's no score, and no builder subagent.

| # | Blocker |
|---|---|
| B1 · B2 · B3 | As above |
| B4 | Technical words anywhere above Part C |
| B6 | Risk missing from the header, or missing a reason |
| B8 | A question in §10 without "Blocks" and "Who answers" |
| B9 | Leftover placeholder text above Part C, or in §12 |
| B10 | A place in §4.4 without an acceptance check |
| B11 · B12 · B13 · B14 | As above |
| S1 | The task isn't really Small and Low risk (it saves data, touches login, permissions, money or personal data, or spans more than one screen). Switch to the full track instead. |

---

## 3. Score (target 85 / 100, full specs only)

| Area | Points | Full marks when |
|---|---|---|
| Why and goals | 5 | The box's **Goal**, **Changes**, **Keep** and **Danger** rows and the §1–§3 **Why** are clear in plain words: the problem, who benefits, what must not change and what must never happen |
| Requirements | 15 | Everything asked is covered, each with Priority and Source |
| Where it appears and its life (§4.4) | 10 | Every place and stage listed, tester checklist answered, each with a check |
| When things go wrong (§5) | 15 | Wrong input, empty, no permission, failure and boundary cases covered |
| Acceptance checks (§6) | 20 | Every requirement covered, pass/fail, real example values, including failure cases |
| Safety & security (§7) | 15 | All 16 areas checked, depth matches the risk level |
| Decisions and questions (§9, §10) | 10 | AI choices visible, questions say what they block |
| Today and what could break (§11) | 5 | Current behaviour and risks to other features named |
| Length and clarity | 5 | Part A stands on its own and stays within its cap (~55 lines Small size, ~70 Medium/Large), the "At a glance" box answers the review on its own, at most one drawing and it replaces text rather than adding to it, no repetition, readable by a non-technical person |

---

## 4. Quality check block (end of every spec)

Fill in the "Quality check" block at the end of `templates/spec-template.md`:
- **Score** per area, with the reason for every lost point. The rows must add up to the total.
- **Each blocker** marked ✅, ❌ or N/A (with the reason).
- **Before planning:** the §10 questions that block planning, or "nothing".

Only take points off for real gaps against the "Full marks when" column. Using AI as a Source is allowed, so it isn't a reason to lose points.

If the score is under 85, the skill lists what would raise it and asks the user before saving.

---

## 5. Quality of §13 (plan mode)

Plan mode checks these before asking for plan approval:

- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every acceptance check is mapped to a plan task and a check
- [ ] Every row in §7 (areas that apply) is covered by the plan
- [ ] Every place and stage in §4.4 is covered by the plan
- [ ] Every lesson listed in §12 is applied
- [ ] No step pushes, merges, deploys or opens a PR
- [ ] Database, data, API, settings, libraries and permissions: one row each, none blank
- [ ] Requirements needed by the risk level are planned (backup, rollback, staging)
- [ ] Any Risk change is explained

---

## 6. Quality of §14 (after coding)

- [ ] Every acceptance check is ✅, ❌ or ⏸ — none missing
- [ ] Every ✅ has proof. "Pass" without proof counts as ⏸.
- [ ] Every file changed but not in §13 is explained
- [ ] Anything different from the plan is listed
- [ ] Anything not done is listed with a reason
- [ ] High risk: backup and rollback test have proof
