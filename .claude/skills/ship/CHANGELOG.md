# Changelog — /ship

**Version numbers:** `1.1.0` = big change · new feature · small fix

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
