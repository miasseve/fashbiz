# <Task name>

`<ID>` · <Feature | Bug fix | Refactor | Chore> · **Small spec** · Low risk — <one-line reason>
**Status:** Draft · <today> · **Approved by:** — · **Skill:** kodion-create-spec v<version>
**Task:** `.claude/tasks/<ID>/task.json` (or "manual, no timesheet task") · **Branch:** `<branch>` (<created by /start-task | not created yet>) · **Follows:** <#ID of an earlier task this builds on, or "none">

> **Reviewer:** read everything above Part C (about 1 minute), then reply **approve**, or say what to change.
> This is a **Small spec**: one small, low-risk change. If it turns out bigger, ask for the full spec (`/kodion-create-spec <ID> --full`).

---

# Part A — Review this

## 1–3. Summary
**What and why:** <1–2 plain sentences: what changes, and why.>

| | |
|---|---|
| **Must not change** | <plain words, e.g. "the rest of the footer, other pages"> |
| **Safety** | <why it's low risk, e.g. "visual only: nothing saved, no login, no money, no personal data"> |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | <plain requirement, with real values> | Must | <Task description / Your answer / Client / Project rules / Standard / AI> |

## 4.4 Where it appears
| Place (screen or part, in user words) | What the user should see | Check |
|---|---|---|
| <...> | <...> | AC-01 |

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given <...>, when <...>, then <...> (real values) | FR-01 |

## 9. Decisions I made — please check
<"None", or one row per AI choice>
| # | Decision | Why |
|---|---|---|

## 10. Questions for you
<"None", or one row per question>
| # | Question | Blocks | Who answers |
|---|---|---|---|

## 11. What exists today
- <what a user sees today, in one line>
- <bugs only: steps to reproduce, as a user would do them>

**Could break:** <plain list, or "nothing else">

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode (short plan)</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**, or if any question in §10 blocks "Planning".
2. **This is a Small spec.** Keep the plan short: the files to change, one check per AC, nothing else.
   **If the code shows it's bigger than this spec says** (saved data, login or permissions, money, personal data, more than one screen, or more than about 3 files), stop and say: *"This needs a full spec. Run `/kodion-create-spec <ID> --full`."* Don't plan or code.
   **For this task type (<Type>):** <copy the line for this Type from the skill, Step 4>
   **Lessons that apply:** <e.g. "L3: one check per place", or "none">
3. **Detect the tech stack** from the project's own files, and **find this project's own checks** (lint, type check, build, tests) from its config and scripts. Run them and record the "before" results in §13. If a check doesn't exist, write "none". Never invent a command.
4. Write the plan to `.claude/plans/<ID>-<slug>.md`: the files to change, what changes in each, and one check per AC.
5. **Then fill §13 below.** Change nothing above Part C.
6. Ask for approval of the plan before coding.
   **Branch:** if the header says "created by /start-task", you're already on it. Check with `git branch --show-current`, and never create another branch. If it says "not created yet", create it only after plan approval, and only after the developer confirms.
   **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that later.
7. After coding, fill §14. Never write "Pass" without proof.
8. **Timesheet logging** (only when the header has a task file). Run each once, when it becomes true:
   - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh <ID> plan`
   - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh <ID> implement`
   - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh <ID> validate`
   - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh <ID> iterate`
   Also set `"plan": ".claude/plans/<file>"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on.

</details>

<details>
<summary><b>13. Technical summary (filled by plan mode)</b></summary>

## 13. Technical summary
*Filled by plan mode. Leave empty until then.*

**Plan file:** — · **Tech stack:** — · **Still small?** <yes / no, needs a full spec because …>

| Check (lint, type check, build, tests) | Command | Result before any change |
|---|---|---|
| | | |

| File | Add / change | What changes |
|---|---|---|
| | | |

**Database / settings / new libraries:** <none, or what>

| AC | Plan task | How it's checked |
|---|---|---|
| AC-01 | | |

**How to undo:** —
**Plan approved by:** —

</details>

<details>
<summary><b>14. Done report (filled after coding)</b></summary>

## 14. Done report
*Filled after coding. Leave empty until then.*

**Result:** ⏸ Not started — <Done / Done with gaps / Not done> · **Date:** — · **Branch / commit:** —

| AC | Result | Proof (command output, screenshot, or test name) |
|---|---|---|
| AC-01 | ⏸ | |

| File actually changed | In §13? | Change |
|---|---|---|
| | Yes / **No — explain** | |

| Check | Command | Result |
|---|---|---|
| Lint / build / tests | | |

**Different from the plan · not done:** —

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (blockers only)</b></summary>

## Quality check
*Filled by `/kodion-create-spec`. Small specs are checked for blockers only; there's no score.*

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | |
| B2 Every requirement has Priority and Source | |
| B3 Every AI choice is listed in §9 | |
| B4 No technical words above Part C | |
| B6 Risk has a reason | |
| B8 Every question says what it blocks | |
| B9 No leftover placeholders above Part C, or in §12 | |
| B10 Every place in §4.4 has a check | |
| B11 Everything asked in the task is covered | |
| B12 No vague words, no real personal data | |
| S1 Still Small and Low risk | |

</details>
