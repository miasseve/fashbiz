# Kodion task workflow: shared files

Every SDD skill reads and writes these files. Keep this format the same in all skills.
Matches: `/start-task` v1.2.1 · `/kodion-create-spec` v2.2.1 · `/ship` v1.1.0

```
.claude/base-branch        (optional, committed) one line: the project's base branch, e.g. main, master, develop
.claude/tasks/<ID>/        (git-ignored)
  raw.json      exact GET API response, saved by fetch-task.sh (/start-task)
  task.json     cleaned task info, the one file every skill reads
  log.jsonl     one line per workflow step, written only by log-step.sh
.claude/specs/<ID>-<slug>.md   the spec (small or full), written by /kodion-create-spec
.claude/plans/<ID>-<slug>.md   the plan, written by plan mode
```

## Who does what

| # | Step | Who | Timesheet step(s) sent |
|---|---|---|---|
| 1 | Start the task | `/start-task <ID>` | `start_session` · `pull_latest` · `create_branch` |
| 2 | Rename the session | developer, confirmed in `/kodion-create-spec` | `rename_session` |
| 3 | Write and save the spec | `/kodion-create-spec <ID>` | `write_spec` · `save_spec` |
| 4 | Approve the spec | reviewer says `approve` | `review_spec` |
| 5 | Plan | plan mode, following spec §12 | `plan` |
| 6 | Build and check | developer + Claude | `implement` · `validate` · `iterate` |
| 7 | Ship | `/ship` | `commit` · `push` · `pr_merge` · `back_to_main` · `delete_branch` |

The 16 step names are fixed by the timesheet. Any other name is refused (HTTP 422).

## Sending a step

```
bash .claude/skills/start-task/scripts/log-step.sh <ID> <step>
bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry
```
- It POSTs `{"step":"<step>"}` to `/api/dev-workflow/tasks/<ID>/logs` with the developer's `kdw_` key, and writes one line to `log.jsonl`.
- **Never call the timesheet API any other way, and never read or print the key.**
- Each step is sent once, when it becomes true. Sending again raises its count on the board (e.g. `save_spec` after a revision), so only repeat a step when the work really happened again. Limit: 100 per step per task; 60 requests a minute.
- If it prints `ERROR`, report it in one line and carry on. The step is still written to `log.jsonl` with `"posted":false`.
- **`--retry`** resends `"posted":false` lines in order (network, 429, 401, missing key). It leaves 404 (task not picked up) and 422 (bad step) as they are, because resending can't fix them. If the same step was posted later, the old line is marked `"superseded":true` instead of being sent again, so the board count doesn't go up twice.
- **When to run `--retry`:** every skill runs it once per run. `/start-task` runs it **right after sending `start_session`**; the other skills run it at their start.
- Only call it for timesheet tasks (`source: "api"`, digits-only ID). Manual tasks like `KOD-142` are never logged.

## Base branch

`/start-task` finds it in this order and saves it in `task.json.base`:
1. `.claude/base-branch`, if the team committed one
2. `origin`'s default branch (`git symbolic-ref`, then `git ls-remote --symref origin HEAD`)
3. `main` or `master`, whichever exists locally
4. Ask the developer once, and offer to save the answer to `.claude/base-branch`

A new task branch always starts from the latest `<base>`, never from the branch the developer happened to be on.

## task.json
```json
{
  "id": "316",
  "title": "Hide unfinished footer links.",
  "description": "Hide unfinished footer links.",
  "source": "api",
  "branch": "chore/316-hide-unfinished-footer-links",
  "base": "main",
  "base_commit": "676b51d",
  "remote": false,
  "started_at": "2026-10-16T13:20:00+05:30",
  "status": "in_progress",
  "spec": null,
  "plan": null,
  "pr": null
}
```
- Only `/start-task` fills `title` and `description`, copied exactly from `raw.json` (or manual input, `source: "manual"`). The GET API returns only `title` and `description`; no skill invents other task data.
- `/start-task` writes the whole file (new task, start again, or reopen). Each later skill updates **only its own field** with Edit, never rewrites the file:
  - `/kodion-create-spec` → `spec`
  - plan mode → `plan`
  - `/ship` → `pr`, `status: "shipped"`
- **`status`:** `"in_progress"` (set by `/start-task`, also on reopen) → `"shipped"` (set by `/ship` after the merge). A task counts as **finished** when `status` is `"shipped"` or `"done"`, or when its branch no longer exists locally or on `origin`.

## log.jsonl (written by log-step.sh only)
```json
{"step":"create_branch","at":"2026-10-16T13:20:41+0530","posted":true,"count":1}
{"step":"write_spec","at":"2026-10-16T13:41:02+0530","posted":true,"count":1}
{"step":"save_spec","at":"2026-10-16T13:41:05+0530","posted":false,"count":null,"error":"NETWORK"}
{"step":"save_spec","at":"2026-10-16T13:41:05+0530","posted":true,"count":1,"resent_at":"2026-10-16T14:02:10+0530"}
{"step":"start_session","at":"2026-10-15T10:00:00+0530","posted":false,"count":null,"error":"NETWORK","superseded":true}
```
Skills read it (for example, to see whether `rename_session` or `create_branch` was already posted) but never write it.

## Specs: small or full

`/kodion-create-spec` picks one:
- **Small spec** (`templates/spec-small.md`): Small size **and** Low risk. About 40 lines to review, short plan, blocker checks only.
- **Full spec** (`templates/spec-template.md`): everything else, including small changes that touch money, login, permissions, saved data or personal data.

Force one with `--small` or `--full` (`--small` is refused for Medium or High risk). Both keep the same section numbers (§4.3, §6, §10, §12, §13, §14), so plan mode always follows §12.

## Uncommitted changes

No skill ever commits, discards, resets or pops the developer's work. `/start-task` may only run the named stash `git stash push -u -m "start-task <ID>: from <branch>" -- . ":(exclude).gitignore" ":(exclude).claude/base-branch"`, and only when the developer picks it.

## Changes after a task is finished

| Situation | What to do |
|---|---|
| Not shipped yet (branch still exists) | Same task, branch and session. Update the spec (back to Draft, approve again), then update the plan. |
| Shipped (`status: "shipped"`, or branch gone) | New task on the Task Board → new Claude session → `/start-task <new ID>`. Write "Follow-up to #<old ID>" in the description; the new spec links back to it. |
| Must reuse the old task | `/start-task <old ID>` → **Reopen this task on a new branch** (`…-2`). Setup steps are sent again. |

## Rules for every skill
- Take the ID from the arguments (strip a leading `#`). Read `.claude/tasks/<ID>/task.json` first. If it's missing, stop: *"Run /start-task <ID> first."*
- If the task is finished (see `status` above), stop and point to the "Changes after a task is finished" table.
- Check `git branch --show-current` matches `task.json.branch`. If not, stop and say which branch to switch to.
- Only `/start-task` calls the GET API. Only `log-step.sh` calls the POST API.
- Never commit `.claude/tasks/` or `.claude/settings.local.json`.
