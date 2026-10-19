# <Task name>

`<ID>` · <Feature | Bug fix | Refactor | Chore> · <Small | Medium | Large> size · **<Low | Medium | High> risk** — <one-line reason>
**Status:** Draft · <today> · **Approved by:** — · **Skill:** kodion-create-spec v<version>
**Task:** `.claude/tasks/<ID>/task.json` (or "manual, no timesheet task") · **Branch:** `<branch>` (<created by /start-task | not created yet>) · **Depends on:** <other tasks or client inputs needed first, or "none">
**Based on:** <task description · live site or screen · screenshots, or "no screenshots">

> **Reviewer:** read Part A only (about 2 minutes), then reply **approve**, or say what to change.
> Part B has the full detail if something looks wrong. Part C is for plan mode; you don't need to review it.
> Who approves depends on the risk: Low → developer or senior · Medium → senior · High → senior, plus the client if business rules change.

---

# Part A — Review this

## 1–3. Summary
**Why:** <2–4 plain sentences: the problem today, who it affects, what we want instead.>

**Most important result:** <one sentence>.

| | |
|---|---|
| **What changes** | <what users will see or be able to do> |
| **We will** | <...> |
| **We won't (this time)** | <...> |
| **Must never happen** | <...> |
| **Must not change** | <plain words, e.g. "the header, the checkout page"> |
| **Coverage** | <n> requirements · <n> acceptance checks · <n> places · <n> stages · <n> safety areas |
| **Quality** | <score> / 100 · <no blockers / list> |

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | <plain requirement> | <Must / Should / Could> | <Task description / Your answer / Client / Project rules / Standard / AI> |

**Priority:** Must = can't ship without it · Should = important, can follow soon after · Could = nice to have
**Source:** Task description · Your answer · Client · Project rules · Standard · AI (a small UI suggestion — please check)

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | <...> | <...> |

## 10. Questions for you
| # | Question | Blocks | Who answers |
|---|---|---|---|
| Q1 | <...> | <Planning / Coding / Going live / Nothing> | <Client / Senior / Dev> |

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| <user type> | <...> |

### 4.2 Key information
| Item | What it holds |
|---|---|
| <thing> | <plain description> |

</details>

<details>
<summary><b>4.4 Where it appears and its life (<n> places · <n> stages · tester checklist)</b></summary>

### 4.4 Where it appears and its life
**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| <screen or part, in user words> | <...> | AC-.. |

**Life of the item** (Medium / Large)
| Stage | What should happen | Check |
|---|---|---|
| <create / edit / each status / complete / history / delete / refresh / reports> | <...> | AC-.. |

**What testers usually find missing** (Medium / Large)
| # | Question | Answer |
|---|---|---|
| C1 | Still there after a page refresh or on another device? | |
| C2 | A new status or type has its own colour, badge, filter option and legend entry? | |
| C3 | No word or label shown twice? | |
| C4 | Timers, tracking, counters, notifications and emails start and stop when they should? | |
| C5 | Validation, empty state and error message covered? | See §5 |
| C6 | Same rules on every screen (who can see or edit it)? | |

</details>

<details>
<summary><b>5. When things go wrong (<n> situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| <wrong or missing input> | <...> |
| <nothing to show> | <...> |
| <no permission> | <...> |
| <something fails> | <...> |

</details>

<details>
<summary><b>6. How we know it's done (<n> acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given <...>, when <...>, then <...> | FR-01 |

</details>

<details>
<summary><b>7. Safety & security (<n> apply · <n> not involved)</b></summary>

## 7. Safety & security
Only the areas that apply get a row. Every other area is named in the "Not involved" line, with a short reason.

| Area | What we do |
|---|---|
| <area that applies> | <...> |

**Not involved (checked):** <area> (<reason>) · <area> (<reason>) · …

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and design guide.
- <task-specific limits>

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- <today's behaviour>
- <for bugs: steps to reproduce, as a user would do them>

**Things that could break:** <plain list>

</details>

---

# Part C — For plan mode (no review needed)

<details>
<summary><b>12. Instructions for plan mode</b></summary>

## 12. Instructions for plan mode
1. Stop if **Status** is not **Approved**, or if any question in §10 blocks "Planning".
   **Required for Risk <level>:** <copy the checks for this level from the risk matrix, section 3>
   If the code scan shows more danger, raise the Risk, explain why in §13, and follow the higher level's checks.
   **For this task type (<Type>):** <copy the line for this Type from the skill, Step 4>
   **Lessons that apply:** <copy each lesson that applies, e.g. "L1: check the edited value everywhere, including history", or "none">
2. **Detect the tech stack** from the project's own files (for example React, Laravel, Flutter, or a mix). Read the project rules and design guide, the code behind §11, and what depends on it. Record the findings in §13 with proof.
3. **Find this project's own checks** (lint, type check, build, tests, migrations) from its config and scripts. Run them and record the "before" results. If a check doesn't exist, write "none" in §13. Never invent a command.
4. **Plan every layer this stack needs.** Cover each heading below, or write "N/A" with a reason:
   - Frontend: screens, states, accessibility
   - Backend: logic, validation, permissions
   - Data: database, migrations, existing records, backup
   - Security: input checks, output safety, secrets, access control
   - Integrations: APIs, third-party services
   - Testing: automated tests if the project has a runner, otherwise browser or manual checks
   - Release: settings, deploy steps, rollback
5. Write the full technical plan to `.claude/plans/<ID>-<slug>.md`.
6. The plan must map every AC (§6), every place and stage in §4.4, and every row in §7 (areas that apply) to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. If anything must stay the same, capture a "before" baseline (screenshots, test results) first.
9. **Then fill §13 below** with the summary of the plan. Change nothing in §1–§11.
10. Ask for approval of the plan before coding. Don't start coding while any §10 question blocks "Coding".
    **Branch:** if the header says "created by /start-task", you're already on it. Check with `git branch --show-current`, and never create another branch. If it says "not created yet", create it only after plan approval, and only after the developer confirms.
    **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that later.
11. After coding, fill §14. Never write "Pass" without proof.
12. **Timesheet logging** (only when the header has a task file; skip for manual tasks). Run each one once, at the moment it becomes true:
    - plan approved and saved → `bash .claude/skills/start-task/scripts/log-step.sh <ID> plan`
    - code written and the edits reviewed → `bash .claude/skills/start-task/scripts/log-step.sh <ID> implement`
    - §14 filled, every AC checked with proof → `bash .claude/skills/start-task/scripts/log-step.sh <ID> validate`
    - fixes made after validation, then checked again → `bash .claude/skills/start-task/scripts/log-step.sh <ID> iterate` (each round)
    Also set `"plan": ".claude/plans/<file>"` in the task file once the plan is saved. If a log prints `ERROR`, report it in one line and carry on; it's resent later.

Before asking for plan approval, check:
- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every AC, every place and stage in §4.4, and every row in §7 (areas that apply) is mapped to a task and a check
- [ ] Every lesson above is applied
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Database, data, API, settings, libraries and permissions each have a row, none blank
- [ ] The Risk level's required checks are in the plan
- [ ] Any Risk change is explained
<task-specific lines, if any>

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

**Safety & security (from §7, areas that apply)**
| Area | Result | Proof |
|---|---|---|
| <each Yes row> | ⏸ | |

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
- [ ] High risk: backup and rollback test have proof

**Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason)

</details>

<details>
<summary><b>Quality check (<score> / 100 · <blockers>)</b></summary>

*Filled by `/kodion-create-spec` using its quality rules.*

**Score:** <n> / 100 · **Blockers:** <none / list> · **Size:** <…> · **Risk:** <…>
**Before planning:** <questions that block planning, or "nothing">

| Area | Score | Lost points because |
|---|---|---|
| Why and goals | / 5 | |
| Requirements | / 15 | |
| Where it appears and its life | / 10 | |
| When things go wrong | / 15 | |
| Acceptance checks | / 20 | |
| Safety & security | / 15 | |
| Decisions and questions | / 10 | |
| Today and what could break | / 5 | |
| Length and clarity | / 5 | |

| Blocker | Result |
|---|---|
| B1 Every requirement has a check | |
| B2 Every requirement has Priority and Source | |
| B3 Every AI choice is listed in §9 | |
| B4 No technical words in §1–§11 | |
| B5 All 16 safety areas checked | |
| B6 Risk has a reason | |
| B7 High-risk extras | |
| B8 Every question says what it blocks | |
| B9 No leftover placeholders in §1–§12 | |
| B10 Every place and stage in §4.4 has a check | |
| B11 Everything asked in the task is covered | |
| B12 No vague words, no real personal data | |

</details>

