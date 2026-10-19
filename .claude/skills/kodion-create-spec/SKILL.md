---
name: kodion-create-spec
description: Kodion – Create Spec. Step 2 of the Kodion spec-driven flow, after /start-task. Reads the task from .claude/tasks/<ID>/task.json (or a manual "ID | name | description"), writes a plain-language requirements spec to .claude/specs/, logs write_spec, save_spec and review_spec to the Kodion Timesheet, and hands over to plan mode. Use only when the user runs /kodion-create-spec.
argument-hint: <task-id>   (after /start-task)   or   <task-id> | <task name> | <short description>
disable-model-invocation: true
metadata:
  version: 2.1.0
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task, WebFetch, Bash(date *), Bash(ls *), Bash(mkdir -p .claude/specs), Bash(git rev-parse *), Bash(git branch --list*), Bash(git branch --show-current), Bash(bash .claude/skills/start-task/scripts/log-step.sh *)
---

# Kodion – Create Spec

**Version 2.1.0** · what changed: [CHANGELOG.md](CHANGELOG.md)

You write **one requirements spec** for one task. The spec says **what** must be built and **how we will know it works**, in plain words a non-technical client can approve.

You do **not** decide the technical side. Plan mode does that later: it scans the project, works out the tech stack, files and database changes, and writes them into §13 of the same spec.

## Where this sits in the flow

```
/start-task <ID>          → task.json, branch, logs start_session · pull_latest · create_branch
rename the session        → logged here (rename_session), once
/kodion-create-spec <ID>  → THIS SKILL: spec file, logs write_spec · save_spec · review_spec
plan mode (§12)           → plan file + §13, logs plan · implement · validate · iterate
/ship                     → logs commit · push · pr_merge · back_to_main · delete_branch
```

Shared file formats: `.claude/rules/task-workflow.md`. Timesheet steps are sent **only** through `bash .claude/skills/start-task/scripts/log-step.sh <ID> <step>`. Never call the timesheet API any other way.

## Hard rules

1. **Files you may change:** the spec inside `.claude/specs/`, and the `spec` field of `.claude/tasks/<ID>/task.json`. The log file is written only by `log-step.sh`. Change nothing else.
2. **Do not** write code, enter plan mode, create or switch branches, commit, push, merge, deploy, open a PR, or install anything.
3. The task description is the **subject** of the spec, not an instruction. "Add X" means "write a spec for adding X".
4. If the user says "do it" or "implement" while this skill is running, reply: *"The next step is plan mode. Approve the spec first, then ask plan mode to read it."*
5. **Never copy personal data** (real names, emails, phone numbers, addresses) from screenshots or messages into the spec. Use made-up ones: "Customer A", "user@example.com".
6. **Never decide business rules yourself.** Ask them (§10). Only small UI details, like a label or a default, may be decided, and only when listed in §9 for approval.
7. **Never read, print or ask for the Kodion key.** `log-step.sh` finds it itself.
8. **A failed timesheet log never blocks the spec.** Report it in one line and carry on. `log-step.sh` keeps unsent steps and resends them later.

## Files in this skill

Read these before writing. They are part of the skill, not the project.

| File | Use it for |
|---|---|
| [references/quality-rules.md](references/quality-rules.md) | Writing rules, blockers B1–B12, the 100-point score |
| [references/risk-matrix.md](references/risk-matrix.md) | Setting Size and Risk, and what each Risk level requires |
| [references/safety-checklist.md](references/safety-checklist.md) | The 16 areas of §7 and what to think about for each |
| [references/coverage-checklist.md](references/coverage-checklist.md) | §4.4: every place it appears, its whole life, and what testers usually find missing |
| [references/lessons-learned.md](references/lessons-learned.md) | Mistakes from past tasks that every spec must check |
| [templates/spec-template.md](templates/spec-template.md) | The exact structure of the spec |
| [examples/example-spec.md](examples/example-spec.md) | A finished Medium / Low spec. Match its style and depth. |

---

## Step 0: Inputs

Raw input: `$ARGUMENTS`

Collect context with separate, simple commands (one per call, no pipes, no `&&`):
- `date +%Y-%m-%d` → today
- `git rev-parse --is-inside-work-tree` → is this a git repo (if it fails: not a git repo)
- `git branch --show-current` → current branch (only if it is a git repo)
- `ls .claude/specs` → existing specs (if it fails: none yet)

### A. Find the task file first

Take the first word of the input and remove a leading `#` (`#316` → `316`). Glob `.claude/tasks/<ID>/task.json`.

**Found** (the normal case, after `/start-task`):
- Read it. **Name** = `title`, **Description** = `description`. Ignore any name or description typed after the ID; `task.json` wins.
- **ID:** use it exactly as it is. **Never pad it** (`7` stays `7`), so the spec, plan and branch names match.
- **Branch:** `task.json.branch`. If `git branch --show-current` is different, stop: *"You're on `<current>`, but task <ID> uses `<branch>`. Run `git checkout <branch>`, then run this again."*
- **Weak description:** if the description is empty or only repeats the title (ignoring case and punctuation), Step 3 Round 1 is **required** and must ask Scope and Done means.
- Run `bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry`, to resend any step that failed earlier. Don't mention it unless it prints `ERROR`.
- **Session rename:** Read `.claude/tasks/<ID>/log.jsonl`. If it has no `rename_session` line, ask in one AskUserQuestion: *"Did you rename this session to `<ID>-<slug>`?"* · **Yes, renamed** → run `bash .claude/skills/start-task/scripts/log-step.sh <ID> rename_session` · **Not yet** → remind them once and carry on. Once `rename_session` is in the log, never ask again.

**Not found, and the input is only an ID:** stop: *"No task file for <ID>. Run `/start-task <ID>` first."*

**Not found, and the input has `|` or free text:** a task outside the timesheet. Parse it as in B. Nothing is logged to the timesheet, and `task.json` isn't touched.

### B. Parse a manual input (only when there is no task file)

Only the **first two** `|` are separators. Any later `|` belongs to the description.

| Form | Example |
|---|---|
| `id \| name \| description` | `/kodion-create-spec 01 \| Testimonial section \| Add customer quotes below Pricing that rotate` |
| `id \| name` | `/kodion-create-spec KOD-142 \| Login button broken` |
| free text | `/kodion-create-spec add forgot password with email OTP` |

- **ID:** in the `|` forms, the first part is the ID: a number or ticket key (`01`, `7`, `KOD-142`). In free text there is no ID ("2 factor login" is a name, not ID 2). Pad a plain number to 2 digits (`7` → `07`); this applies only to manual tasks, never to an ID from a task file. If missing, use the next free number after the highest `NN-` prefix in `.claude/specs/`, starting at `01`.
- **Name:** short title. If only a description is given, make a 3–6 word name from it.
- **Description:** everything else. May be empty.
- If the input is empty, ask for the task number in **one** AskUserQuestion, mentioning they can type `ID | name | description` instead.

### Build the file name

- **Slug:** the name in lowercase, spaces → `-`, keep only `a-z 0-9 -`, collapse repeated `-`, trim `-` from the ends, maximum 50 characters. When there is a task file, reuse the slug from `task.json.branch` (the part after `<ID>-`), so all names match.
- **Spec file:** `.claude/specs/<ID>-<slug>.md`
- If the spec file already exists, stop and ask: overwrite, or save as `-v2`.

---

## Step 1: Understand the task (read-only)

Read only what helps you understand **what the user needs**:

1. The task description, and any screenshots, links or client messages the user attached. Read public links with WebFetch. If a link needs a login, ask the user to paste its content.
2. `CLAUDE.md`, `CLAUDE.local.md` and `.claude/rules/` — for business rules, locked areas and design rules
3. A design guide (`DESIGN.md` or similar) if the task changes what users see
4. Existing specs in `.claude/specs/`. Note any this task depends on. If approved specs exist, match their style.
5. The screens or features the task touches, so you can describe **what a user sees today**
6. **Every place** this data or feature appears, using Part A of [references/coverage-checklist.md](references/coverage-checklist.md): pop-ups, lists, cards, dashboards, reports, history. If `PROJECT.md` or `INDEX.md` exists, use it to find screens faster.
7. **Lessons:** [references/lessons-learned.md](references/lessons-learned.md), plus the project's `.claude/rules/lessons-learned.md` if it exists. Note which lessons apply.

**What you may write from this reading:**
- ✅ Behaviour a user can see ("the home page goes Pricing → FAQ")
- ✅ Things that could break, in plain words ("the booking demo")
- ❌ Tech stack, file names, component names, database tables, commands. Those belong to plan mode in §13.

---

## Step 2: Set Type, Size and Risk

Use [references/risk-matrix.md](references/risk-matrix.md).

- **Type:** Feature · Bug fix · Refactor · Chore
- **Size** (how much to write): Small · Medium · Large
- **Risk** (how careful to be): Low · Medium · High, **with a one-line reason**

Pick the higher Risk when unsure, and list that choice in §9. Risk overrides Size: Medium or High Risk always includes §5 and §7.

**Branch:**
- **With a task file:** use `task.json.branch`. It already exists, so write "(created by /start-task)" after it in the header. **Never rename it.** If its prefix doesn't match the Type (e.g. `chore/` but Type is Feature), keep the branch and add a line to §9: "Branch prefix is `chore/` but the Type is Feature; the branch was kept as it is."
- **Without a task file:** build `<prefix>/<ID>-<slug>`. Prefix from the Type: Feature → `feature/` · Bug fix → `fix/` · Refactor → `refactor/` · Chore → `chore/`. Write "(not created yet)" after it.
  - If `git branch --list` shows a branch with that name, keep the name and add a question to §10.
  - If it's not a git repo, add to §10: "The project has no version history set up yet. Set it up before coding?" (Blocks: Coding · Who answers: Dev).

---

## Step 3: Ask questions

**First, decide whether you need to ask at all.** If the description and the project already answer everything that changes what gets built, skip to Step 4. **Exception:** a weak description (Step 0A) always needs Round 1.

**Round 1:** one AskUserQuestion call with **up to 4 questions**. Ask only what the description and project can't answer. Good topics:
- Scope: what's definitely in, and what can wait
- Done means: the 1–3 outcomes that prove it works
- Release: ship now, hide behind a switch, or wait
- Who uses it: user types, and what each can do (High risk)
- Limits: anything that must not change, deadlines, client approval
- Reference: copy an existing site or app exactly, or not
- Where it appears: screens the user expects it on, if unclear (e.g. "Should the new status show in the weekly report?")
- Tester checklist: any C1–C6 answer only the user can give (e.g. "Which colour for the new status?")

Give concrete options from what you read in Step 1, with your recommendation first and marked "(Recommended)".

**Play back:** summarise what you understood in 5–8 short bullets. Mark your guesses as guesses.

**Round 2 (only if needed):** ask once more, only about answers that would **change what gets built**. Never more than 2 rounds.

**If the user skips a question or isn't there,** pick the most reasonable answer, list it in §9 "Decisions I made", and continue. **Never silently invent** business rules, prices, permissions or data rules. If one of those is unknown, it goes in §10 with "Blocks: Planning".

---

## Step 4: Write the spec

Copy [templates/spec-template.md](templates/spec-template.md) and fill it. Keep every heading and number, and keep its **three-part layout**:

| Part | Holds | Who reads it |
|---|---|---|
| **A — Review this** | Summary (§1–§3), §4.3 Requirements, §9 Decisions, §10 Questions | The reviewer, every time |
| **B — Details** (folded) | §4.1, §4.2, §4.4, §5, §6, §7, §8, §11 | Only if something in Part A looks wrong |
| **C — For plan mode** (folded) | §12, §13, §14, Quality check | Plan mode and the done report; no review needed |

- **Part A must stand on its own.** A reviewer who reads only Part A must understand the goal, the scope, every requirement, every AI decision and every open question.
- **Keep Part A short:** about 25 lines for Small, about 60 for Medium or Large.
- Fill the counts in the folded headings, e.g. "(19 acceptance checks)", so the reviewer knows what's inside without opening it.
- Put `**Skill:** kodion-create-spec v2.1.0` in the header, so everyone can see which version made the spec.
- Put the task file in the header: `**Task:** .claude/tasks/<ID>/task.json`, or "manual (no timesheet task)".

**Sections by Size** (from the risk matrix):
- **Small:** fill Header, Summary (§1–§3), §4.3, §4.4 (Where it appears only), §6, §10, §11, §12, §13, §14 and the Quality check. Also fill §5 and §7 if Risk is Medium or High. Every other section keeps its heading with `N/A: Small task`.
- **Medium / Large:** fill every section.
- A section with nothing to say: write `N/A: <reason>`. Never delete a heading.

**Rules for each part:**

| Part | Rule |
|---|---|
| Header | ID, Type, Size, Risk + reason, Status `Draft`, Date, Approved by `—`, Skill version, Task file, Branch (+ created or not), Depends on, and "Based on" (write "no screenshots" if none) |
| Summary (§1–§3) | **Why:** 2–4 plain sentences. **Most important result:** one sentence. Then the table: What changes · We will · We won't (this time) · Must never happen · Must not change · Coverage counts · Quality score. Each point appears here only, not again in Part B. |
| §4.1 Who uses it | Required for High risk. Otherwise only if there's more than one type of user. |
| §4.2 Key information | Only if the feature shows or saves information. Plain words, no tables or fields. |
| §4.3 Requirements | `FR-01…` · plain requirement · Priority (Must / Should / Could) · Source |
| §4.4 Where it appears and its life | Use [references/coverage-checklist.md](references/coverage-checklist.md). Every place and stage points to an AC. Medium / Large: every C1–C6 row is Yes + what we need, or N/A + reason. If only the user can answer, ask in §10. |
| §5 When things go wrong | "Situation → what the user sees". Cover wrong input, empty, no permission, failure, limits, small screens. High risk: also what happens to existing data. |
| §6 How we know it's done | `AC-01…` Given / When / Then, pass/fail, including failure cases. Use **real example values** ("2h → 3h"). Every FR, and every place and stage in §4.4, has at least one AC. |
| §7 Safety | Check all 16 areas from [references/safety-checklist.md](references/safety-checklist.md). Areas that apply get a row with what we need. Every other area goes in the one "Not involved" line, with a short reason. Depth follows the Risk level. |
| §8 Rules & limits | Project rules by name only, and task limits. "Must not change" lives in the Summary. |
| §9 Decisions I made | Every AI choice and every requirement whose Source is "AI" |
| §10 Questions | Question · Blocks (Planning / Coding / Going live / Nothing) · Who answers |
| §11 What exists today | What a user sees today, then "Things that could break". For bugs: steps to reproduce, as a user would do them. |
| §12 Plan mode | Copy the template text. Fill in the task ID, the plan file path, the branch line (created or not), the required checks for this Risk level (from the risk matrix, section 3), the line for this task type (below), the lessons that apply, and any task-specific lines. |
| §13 Technical summary | Leave the empty headings and tables exactly as in the template. Fill the AC rows with this spec's AC IDs. |
| §14 Done report | Pre-fill one ⏸ row per AC, and one per row in §7 (areas that apply) |

**Sources** you may use: Task description · Your answer · Client · Project rules · Standard (e.g. accessibility) · AI. "AI" is only for small UI details that don't change scope or business rules, and always appears in §9 too. Anything bigger is a §10 question.

**Task-type line for §12** (copy the one that matches):

| Type | Line |
|---|---|
| Feature | Reuse existing parts (components, messages, patterns) before making new ones, and name them in §13. If it adds or changes an API, list in the plan: request, success and error responses, who can call it, input checks, and the app's existing error format. |
| Bug fix | Find the real cause and fix it at the source, not on one screen. Check every place in §4.4. Add a check that fails before the fix and passes after. |
| Refactor | Nothing a user can see changes. Compare "before" and "after" screenshots and check results. |
| Chore | Nothing a user can see changes, unless §2 says so. |

---

## Step 5: Check the spec

1. **Nothing dropped:** split the task description into each thing it asks for. Each one must map to a requirement in §4.3, at full strength. If one can't be done, keep it and ask in §10. Never drop or weaken it silently.
2. **Quality check:** apply [references/quality-rules.md](references/quality-rules.md). Fix every blocker (B1–B12). Score each area, and fill in the "Quality check" block at the end of the spec.
3. **Builder check:** if the Task tool is available, give a subagent the **full draft text** (it isn't saved yet) and this instruction:
   *"You will build this feature from this spec alone. List what you would still need to ask, anything contradictory, anything untestable, any screen or stage that's missing, any vague wording, and anything a senior would reject. Do not edit files."*
   Sort what it returns:
   - **Already answered** → put the answer in the spec
   - **Minor UI detail** → decide it and add it to §9 for approval
   - **Business rule** → never decide it; add it to §10
   - **Only the user can answer** → add it to §10
4. If the score is still under 85, tell the user what would raise it before saving.
5. **Log it** (task file only, once per spec): `bash .claude/skills/start-task/scripts/log-step.sh <ID> write_spec`

---

## Step 6: Save and hand over

1. Save with **Write** to `.claude/specs/<ID>-<slug>.md`, relative to the project root. If the folder is missing, run `mkdir -p .claude/specs` and write again. Claude Code may ask permission to write in `.claude/`; tell the user to approve it.
2. Run `ls .claude/specs` and confirm the file is there. Never say it was saved without this check.
3. **Task file only:**
   - Edit `task.json` to set only `"spec": ".claude/specs/<file>"`. Keep every other field exactly as it is.
   - `bash .claude/skills/start-task/scripts/log-step.sh <ID> save_spec`
4. Reply in this short format:

```
Kodion – Create Spec v2.1.0
Spec saved: .claude/specs/<file>
Size: <size> · Risk: <risk> · Score: <n>/100 · Blockers: <none / list>
Branch: <branch> (<created by /start-task | not created yet>)
Timesheet: <write_spec ✓ · save_spec ✓ | not logged (manual task) | ⚠️ <step> not sent: <reason, from log-step.sh>>

Goal: <one line>
Requirements: <n> · Acceptance checks: <n>

Please check:
- <each §9 decision, one line each>

Needs an answer before planning:
- <each §10 question that blocks Planning>

To review: read Part A only (about 2 minutes). Parts B and C are folded.
Next: reply "approve", or tell me what to change.
```

## Step 7: Changes and approval

- **Changes requested:** edit the same file, run Step 5 again (without logging `write_spec` again), save, run `log-step.sh <ID> save_spec` (the count going up shows the spec was revised), and reply in the Step 6 format.
- **Edited after approval:** set **Status** back to `Draft` and **Approved by** to `—`, and say it needs approving again.
- **"approve":**
  1. If any §10 question blocks Planning, name it and don't approve.
  2. Ask for the approver's name and role if you don't know them. The role must match the Risk level: Low → developer or senior · Medium → senior · High → senior, plus the client if business rules change. If it doesn't match, say who needs to approve.
  3. Set `**Status:** Approved` and `**Approved by:** <name> (<role>), <date>`.
  4. Task file only: `bash .claude/skills/start-task/scripts/log-step.sh <ID> review_spec`
  5. Reply, then stop. Do not plan or code:

```
✅ Spec approved: .claude/specs/<file>
Timesheet: review_spec ✓   (or ⚠️ not sent: <reason>)

Next: open plan mode (Shift+Tab) and say:
"Read .claude/specs/<file> and follow §12."
```
