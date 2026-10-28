# Changelog — /ship

**Version numbers:** `1.1.0` = big change · new feature · small fix

## 1.3.0 — 2026-10-23 · Runs the full test suite, cleans up the screenshots

- **New Step 9b: run the project's checks once, after the merge.** Small-spec plans now run only
  the tests covering what changed, so the full suite runs here instead of twice in plan mode.
  Reads `.claude/rules/known-failures.md`: a listed failure is reported as "same as the
  known-failures list" and not investigated. An unlisted failure is real and is reported plainly.
  Skipped on a full spec, which already ran the suite before and after.
- **Step 10 deletes this task's downloaded screenshots** from `.claude/attachments/` once the merge
  is on `origin` — only `<ID>.*` and `<ID>-*.*`, nothing else. The images are still on the Task
  Board and the spec records what each showed. `.claude/tasks/<ID>/` stays as the record.

## 1.2.2 — 2026-10-22 · Review fixes

- **The workflow log no longer states a total it didn't count.** The no-git sample printed 8 ticks
  under a hard-coded "9 of 16", and `iterate` is often `—`, so no fixed total is right. It now
  counts the lines it prints.
- **`allowed-tools` cleaned:** `mkdir -p`, `cp -r` and `diff` were left over from the deleted
  snapshot flow, while the skill itself promises nothing is copied or moved.
- `assets/preflight.sh` had **Windows line endings**, so `bash` failed on it with a syntax error
  at line 22 — Step 1 would have broken on every `/ship`. Converted to LF.

## 1.2.1 — 2026-10-22 · No git: stop, don't improvise

- **Replaces the snapshot flow from the 1.2.0 draft.** On a project with no git, `/ship` now stops:
  there's nothing to commit, push or merge, so it ticks nothing, copies nothing, and prints the
  three commands that set git up (`git init` → first commit → `/start-task <ID>`). It never runs
  `git init` itself.
- The five Ship steps are recorded with `--skip "no git set up, …"`, so the board's reason survives
  the session instead of leaving five blank rows.
- The workflow log (Step 12) shows `⊘` for a skipped step with the reason under the block, and says
  `9 of 16 ticked`. A `⊘` is never treated as a failure and never offered for retry.
- Task feedback (Step 11) doesn't run when nothing was shipped.
- One line is offered, nothing logged: if the work is being handed over as files, `/ship` will
  check the changed files for keys and passwords first.

## 1.2.0 — 2026-10-22 · Works without git, and shows the log

- **Step 0 picks the mode.** `git rev-parse` decides: **git mode** (Steps 1–11, unchanged) or
  **snapshot mode** for a project that isn't a git repo. `/ship` no longer assumes git, and never
  runs `git init`.
- **Snapshot mode** (S1–S5): lists what changed since the task started, runs the **same mandatory
  security check**, saves a dated copy to `.snapshots/<date>-<ID>-<slug>/` with a `SHIPPED.txt`,
  then asks in one question whether the copy was handed over and whether it's live in the main
  copy — and ticks only the steps that were confirmed. Snapshots are archived, never deleted.
  `.claude/settings.local.json` is never copied into one.
- **Step 12 prints the task's workflow log** in both modes: all 16 steps in four lines, with ✅,
  ❌ or —, read from `.claude/tasks/<ID>/log.jsonl`. No need to open the Task Board to see what
  was ticked, and a missing step is obvious.
- **The task ID is found three ways**, so snapshot mode works with no branch name: `/ship <ID>`,
  the branch name, or the one task whose `status` is `"in_progress"`.
- **Fixed `allowed-tools`**, which only listed `log-step.sh` — every git command in the skill was
  outside it.
- What each timesheet step means in snapshot mode is written down in
  `.claude/rules/task-workflow.md`, and `/ship` reports them in plain words
  (`push ✅ (copy handed over)`).

## 1.1.0 — 2026-10-21 · Ship steps reach the Task Board

**Why:** `/start-task` ticked the Setup steps, but nothing ticked the Ship steps.

- On Kodion task branches (`<type>/<ID>-<slug>` with `.claude/tasks/<ID>/task.json`), `/ship` now sends:
  - `commit`: after the commit succeeds
  - `push`: after the branch is pushed
  - `pr_merge`: after the merge lands on `origin/main`
  - `back_to_main`: after you're back on `main`
  - `delete_branch`: after the feature branch is deleted
- It uses `/start-task`'s `scripts/log-step.sh`, so there's one key and one script. Every step is saved in `.claude/tasks/<ID>/log.jsonl`.
- At the end it runs `log-step.sh <ID> --retry` once, to resend any steps that failed earlier.
- A logging error never blocks or undoes the ship. It shows ❌ and the command to resend.
- Branches that aren't Kodion tasks: nothing is sent, and nothing changes.
- The final summary has a `Logged:` line.
- Version number added.

## 1.0.0 · First version

- Sync, branch, commit, security check, push, confirm, merge, clean up, task feedback
