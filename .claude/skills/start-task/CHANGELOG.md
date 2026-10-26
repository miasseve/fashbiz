# Changelog — /start-task

**Version numbers:** `1.2.0` = big change · new feature · small fix

## 1.2.1 — 2026-10-21 · Matches task-workflow.md

- No longer writes its own `task_started` line to `log.jsonl`. Only `log-step.sh` writes that file.
- A task with `"status": "shipped"` (set by `/ship`) counts as finished, as well as `"done"`.

## 1.2.0 — 2026-10-21 · Right base branch, safe uncommitted changes, Setup logs

**Why:** team feedback. Developers started tasks while on another branch with uncommitted changes, some projects use `master`, and the Pull and Branch steps weren't ticked on the Task Board.

- **Base branch found automatically**, in this order: `.claude/base-branch` (team setting) → `origin`'s default branch → `main` or `master`, whichever exists → ask once and offer to save it. Works for `main`, `master` and others (e.g. `develop`).
- **Always starts from the latest base**, even when you're on another branch. The confirmation shows "You're on X; the new branch starts from the latest main, not from X."
- **Uncommitted changes handled safely.** Instead of just stopping, it lists the files and offers:
  - keep them on the current branch and stop (commit them yourself)
  - bring them into the new task branch (only when you're on the base, i.e. you started the work there by mistake)
  - set them aside in a named stash, with the exact command to get them back
  - cancel

  It never commits, discards or pops anything.
- **Setup steps ticked on the Task Board:** `start_session`, `pull_latest`, `create_branch`, through `scripts/log-step.sh`.
  - `pull_latest` is also ticked when there's no remote, since the local base is already the latest.
  - `create_branch` is ticked on resume too, if it was never ticked before.
  - Failed steps are resent with `--retry` on the next run.
- **Finished tasks detected.** If the task's branch is gone (shipped), it recommends a new task for extra changes, or lets you reopen on a new branch (`…-2`).
- **New section: "Changes after a task is finished"** explains when to continue a task and when to create a new one.
- The reply shows the version and a `Logged:` line.

## 1.1.0 — 2026-10-16

- `scripts/log-step.sh` added: sends workflow steps to the timesheet, keeps `log.jsonl`, and `--retry` resends failures.

## 1.0.0 · First version

- Fetch the task, safety checks, pull `main`, create the branch, save `task.json`
