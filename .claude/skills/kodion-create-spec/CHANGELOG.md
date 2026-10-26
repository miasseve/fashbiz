# Changelog — Kodion – Create Spec

Every spec shows the version that made it, in its header (`Skill: kodion-create-spec v2.0.0`).

**Version numbers:** `2.0.0` = big change · new feature · small fix
- **Big change** (2.0.0): the spec looks different, and old specs may not match the new layout
- **New feature** (1.2.0): new checks or sections; old specs still work
- **Small fix** (1.2.1): wording or bug fixes only

---

## 2.2.1 — 2026-10-21 · Matches task-workflow.md

- A task with `"status": "shipped"` (set by `/ship`) counts as finished, as well as `"done"`.

## 2.2.0 — 2026-10-21 · Small specs, faster, simpler approval

**Why:** team feedback. Specs took too long even for tiny tasks, and `approve` asked who was approving every time.

- **Two formats:**
  - **Small spec** (`templates/spec-small.md`) for Small size **and** Low risk: about 40 lines to review, a short plan, and blocker checks only.
  - **Full spec** (unchanged) for everything else.
  - Force one with `--small` or `--full`. `--small` is refused for Medium or High risk.
  - The skill switches up to a full spec if a task turns out bigger. Plan mode stops on a small spec whose code turns out bigger.
- **Faster:**
  - The track is picked before reading.
  - Small specs read only the screen they touch, ask at most 2 questions, and skip the play-back, the score and the builder subagent.
  - The builder subagent now runs only for Large size or High risk.
  - New speed rules: no extra WebFetch, one question call, write once and check once.
- **Simpler approval:**
  - Your name comes from `git config user.name`; it never asks.
  - Low risk is approved straight away.
  - Medium or High risk asks one yes/no ("approving as the senior?"). `approve as senior` skips it.
- **Follow-ups:**
  - A shipped task (branch gone, or status done) stops with "create a new task".
  - A new task that mentions "Follow-up to #N" gets **Follows: #N** in the header and links to the old spec.
  - The README has a "Changes after a task is finished" table.
- New `examples/example-spec-small.md`. Tests 51–63 added, and tests 1, 20, 27 and 28 updated.
- Old specs still work. Full specs only changed their header version.

## 2.1.0 — 2026-10-16 · Connected to /start-task and the timesheet

**Why:** the skill didn't know about `/start-task`. `/kodion-create-spec 316` treated "316" as a task name, built its own branch name, and §12 told plan mode to create the branch again. Nothing reached the timesheet's Developer Workflow Logs.

- **Reads `.claude/tasks/<ID>/task.json`** when it exists. `/kodion-create-spec 316` is enough; title and description come from the task file. Without one, a bare ID stops with "Run /start-task first". `ID | name | description` still works for tasks outside the timesheet.
- **IDs from a task file are never padded**, and the slug comes from the branch, so spec, plan and branch names match.
- **Uses the branch from `/start-task`**, checks you're on it, and never renames it. A Type and branch-prefix mismatch is noted in §9.
- **Logs to the timesheet** through the shared `.claude/skills/start-task/scripts/log-step.sh`: `rename_session` (asked once), `write_spec`, `save_spec` (again on each revision), `review_spec` on approval. Failed logs never block the spec, and are resent on the next run.
- **Sets `task.json.spec`** after saving.
- **Weak descriptions** (empty, or only the title) always get Round 1 questions.
- **§12** tells plan mode not to create a second branch, to leave commits to `/ship`, and to log `plan`, `implement`, `validate` and `iterate`.
- **Header** shows the task file and whether the branch already exists.
- 11 new tests (40–50).
- Old specs still work. Only the header line and §12 changed.

## 2.0.0 — 2026-10-16 · Review layout

**Why:** reviewing a spec took too long, because the reviewer had to read the whole file (about 420 lines).

- **New three-part layout:**
  - **Part A — Review this** (about 60 lines): summary, requirements, decisions, questions
  - **Part B — Details** (folded): everything else in the requirements
  - **Part C — For plan mode** (folded): §12, §13, §14 and the quality check
- **Summary table** replaces §1–§3: what changes, we will, we won't, must never happen, must not change, coverage counts, quality score.
- **Safety (§7)** shows only the areas that apply. The others go in one "Not involved" line, with reasons.
- **Version number** in the skill, in every spec header, and in the skill's reply.
- Nothing was removed: every section, check and rule from 1.2.0 is still there.

## 1.2.0 — 2026-10-16 · Coverage and lessons

- New §4.4: every place it appears, the whole life of the item, and what testers usually find missing
- New `lessons-learned.md`, read before every spec
- New rules: never drop what was asked, use real example values, no personal data from screenshots
- §12 tells plan mode never to push, merge, deploy or open a PR, and adds a line per task type

## 1.1.0 — 2026-10-15 · Reviewer fixes

- Fixed 33 contradictions found in two independent reviews
- Approval role must match the risk level

## 1.0.0 — 2026-10-15 · First version

- Plain-language requirements spec, with Size and Risk, a safety checklist, quality rules, §12 for plan mode, and §13 / §14 filled later in the same file
