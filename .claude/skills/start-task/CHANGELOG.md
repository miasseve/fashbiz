# Changelog — /start-task

**Version numbers:** `1.2.0` = big change · new feature · small fix

## 1.5.0 — 2026-10-23 · Flat attachments · no needless pending-work menu

- **One attachments folder for the whole project.** `.claude/attachments/<ID>.png`, and
  `<ID>-2.png`, `<ID>-3.png` for extra files, instead of a folder per task. The download script now
  takes the file's index instead of a name and takes the extension from the link. Every guard is
  unchanged: the `…/assets/` allowlist, the key never sent, 15 MB cap, magic-byte check, videos
  kept as links. `.claude/attachments/` is added to the git-ignore check.
- **No pending-work menu when you're on the base branch.** Starting a task from `main` (or whatever
  `.claude/base-branch` says) with work in progress is normal — the changes come along to the new
  branch. The menu still appears for uncommitted work on someone else's branch, which is the case
  it exists for. Reported from task #412, where it fired on every task.

## 1.4.1 — 2026-10-22 · Review fixes

- `log-step.sh`'s header comment claimed a skipped line gets marked `"superseded":true` when the
  step later happens. Nothing does that, and nothing needs to: readers take the newest line for
  each step. Comment corrected to match the code.
- The attachment lookup also accepts `detail.screenshots` and `detail.aiFiles`, which is the shape
  the Task Board sends today.
- Step 7's items renumbered 1–7 (there was a `1b`).

## 1.4.0 — 2026-10-22 · Attachments restored · no fake git ticks

- **Screenshots and PDFs are downloaded again**, with the restored
  `scripts/download-attachment.sh`: only `timesheetv2…/assets/` links, the key never sent, 15 MB
  cap, the file's first bytes checked so an error page can't be saved as a `.png`, videos kept as
  links. They land in `.claude/tasks/<ID>/attachments/` with `path` and `status` in `task.json`.
  `acceptance_criteria`, `project`, `type` and `priority` are read from the API again.
- **No git: nothing is faked and nothing is blank.** `pull_latest` and `create_branch` are recorded
  with `log-step.sh <ID> <step> --skip "no git set up, …"`, which posts nothing and writes the
  reason to `log.jsonl`. The reply shows `⊘ = not ticked: no git set up`. The before-copy snapshot
  from the earlier draft is gone — it ticked nothing and `/ship` no longer uses it.
- **New: "the project is on git now".** Re-run `/start-task <ID>` after setting git up on a task
  that started without it: the branch is created, `task.json` moves to `"vcs": "git"`, and
  `pull_latest` and `create_branch` are sent **normally** so each count lands at 1.
  `start_session` is not resent.
- `log-step.sh` gains `--skip "<reason>"`. It never posts, and `--retry` never resends a skipped
  step.
- Still never runs `git init` — it says what to run and stops.

## 1.3.0 — 2026-10-22 · Starts a task on a project that isn't on git

- **No longer stops when the folder isn't a git repo.** It asks: set up git first (recommended,
  and the developer runs `git init` themselves), carry on in **snapshot mode**, or cancel.
- **Snapshot mode** replaces Steps 4–6: no branch, no git commands. It confirms this folder is
  the latest copy, then saves `.snapshots/<date>-<ID>-<slug>-before/` so the work can be compared
  and undone. `.claude/settings.local.json`, `.snapshots/` and dependency folders are never
  copied, and the developer is warned once that the key file must stay out of shared copies.
- **The Setup steps are still ticked:** `pull_latest` once the developer confirms the folder is
  the latest, `create_branch` once the before-copy is saved and verified. The meanings are in
  `.claude/rules/task-workflow.md`, and the reply says them in plain words.
- `task.json` gains **`vcs`** (`"git"` or `"none"`) and, in snapshot mode, **`snapshot`**. A
  missing `vcs` means git.
- `AskUserQuestion` and the copy commands added to `allowed-tools`.

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
