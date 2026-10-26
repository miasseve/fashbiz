# Footer text colour

`318` · Feature · **Small spec** · Low risk — visual only, one screen part, nothing saved
**Status:** Draft · 2026-10-21 · **Approved by:** — · **Skill:** kodion-create-spec v2.2.1
**Task:** `.claude/tasks/318/task.json` · **Branch:** `feature/318-footer-text-colour` (created by /start-task) · **Follows:** none

> **Reviewer:** read everything above Part C (about 1 minute), then reply **approve**, or say what to change.
> This is a **Small spec**: one small, low-risk change. If it turns out bigger, ask for the full spec (`/kodion-create-spec 318 --full`).

---

# Part A — Review this

## 1–3. Summary
**What and why:** The footer text is black, which looks heavy on the dark footer. It should be the design guide's "Mid grey", so it matches the rest of the site.

| | |
|---|---|
| **Must not change** | Where footer links go, their order, the footer layout, the logo, every other page section |
| **Safety** | Visual only: nothing saved, no login, no money, no personal data |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | All footer text (address, copyright line, link labels) is "Mid grey" instead of black. | Must | Task description |
| FR-02 | Footer links keep their hover colour. | Must | AI (D1) |

## 4.4 Where it appears
| Place (screen or part, in user words) | What the user should see | Check |
|---|---|---|
| Footer on every page, desktop | Mid grey text | AC-01 |
| Footer on a phone | Mid grey text | AC-02 |

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given the home page and the Pricing page on desktop, when you look at the footer, then the address, copyright line and link labels are "Mid grey", not black. | FR-01 |
| AC-02 | Given a 375 px wide phone, when you open the home page, then the footer text is "Mid grey". | FR-01 |
| AC-03 | Given the footer, when you move the mouse over "Contact", then it changes to the same hover colour as today. | FR-02 |

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Link hover colour stays as it is (FR-02) | The task only mentions the text colour. |

## 10. Questions for you
None.

## 11. What exists today
- Footer text is black on every page.

**Could break:** link hover colour (AC-03).

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode (short plan)</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**, or if any question in §10 blocks "Planning".
2. **This is a Small spec.** Keep the plan short: the files to change, one check per AC, nothing else.
   **If the code shows it's bigger than this spec says** (saved data, login or permissions, money, personal data, more than one screen, or more than about 3 files), stop and say: *"This needs a full spec. Run `/kodion-create-spec 318 --full`."* Don't plan or code.
   **For this task type (Feature):** Reuse existing parts (components, messages, patterns) before making new ones, and name them in §13. If it adds or changes an API, list in the plan: request, success and error responses, who can call it, input checks, and the app's existing error format.
   **Lessons that apply:** L3: one check per place the change appears.
3. **Detect the tech stack** from the project's own files, and **find this project's own checks** (lint, type check, build, tests) from its config and scripts. Run them and record the "before" results in §13. If a check doesn't exist, write "none". Never invent a command.
4. Write the plan to `.claude/plans/318-footer-text-colour.md`: the files to change, what changes in each, and one check per AC.
5. **Then fill §13 below.** Change nothing above Part C.
6. Ask for approval of the plan before coding.
   **Branch:** the header says "created by /start-task", so you're already on it. Check with `git branch --show-current`, and never create another branch.
   **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that later.
7. After coding, fill §14. Never write "Pass" without proof.
8. **Timesheet logging.** Run each once, when it becomes true:
   - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh 318 plan`
   - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh 318 implement`
   - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh 318 validate`
   - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh 318 iterate`
   Also set `"plan": ".claude/plans/318-footer-text-colour.md"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on.

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary
*Filled by plan mode. Leave empty until then.*

**Plan file:** — · **Tech stack:** — · **Still small?** —

| Check (lint, type check, build, tests) | Command | Result before any change |
|---|---|---|
| | | |

| File | Add / change | What changes |
|---|---|---|
| | | |

**Database / settings / new libraries:** —

| AC | Plan task | How it's checked |
|---|---|---|
| AC-01 | | |
| AC-02 | | |
| AC-03 | | |

**How to undo:** —
**Plan approved by:** —

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report
*Filled after coding. Leave empty until then.*

**Result:** ⏸ Not started · **Date:** — · **Branch / commit:** —

| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ⏸ | |
| AC-02 | ⏸ | |
| AC-03 | ⏸ | |

| File actually changed | In §13? | Change |
|---|---|---|
| | | |

| Check | Command | Result |
|---|---|---|
| Lint / build / tests | | |

**Different from the plan · not done:** —

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (blockers only · none found)</b></summary>

## Quality check
*Filled by `/kodion-create-spec`. Small specs are checked for blockers only; there's no score.*

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | ✅ |
| B2 Every requirement has Priority and Source | ✅ |
| B3 Every AI choice is listed in §9 | ✅ |
| B4 No technical words above Part C | ✅ |
| B6 Risk has a reason | ✅ |
| B8 Every question says what it blocks | N/A (no questions) |
| B9 No leftover placeholders above Part C, or in §12 | ✅ |
| B10 Every place in §4.4 has a check | ✅ |
| B11 Everything asked in the task is covered | ✅ ("footer text" and "grey" → FR-01) |
| B12 No vague words, no real personal data | ✅ |
| S1 Still Small and Low risk | ✅ |

</details>
