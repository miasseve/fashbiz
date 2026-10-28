# Kodion task workflow: shared files

Every SDD skill reads and writes these files. Keep this format the same in all skills.
Matches: `/start-task` v1.5.0 · `/kodion-create-spec` v2.6.0 · `/ship` v1.3.0 · `/task-feedback` v1.2.0

```
.claude/base-branch        (optional, committed) one line: the project's base branch, e.g. main, master, develop
.claude/spec-visuals       (optional, committed) one line: mermaid | mermaid+text — whether a spec's
                           drawing needs a plain-text copy under the diagram (missing: mermaid+text)
.claude/rules/plan-mode.md      (committed) the plan-mode instructions every spec's §12 points at
.claude/rules/known-failures.md (optional, committed) tests that already fail, so nobody triages
                           them twice
.claude/tasks/<ID>/        (git-ignored)
  raw.json      exact GET API response, saved by fetch-task.sh (/start-task)
  task.json     cleaned task info, the one file every skill reads
  log.jsonl     one line per workflow step, written only by log-step.sh
  attachments/  screenshots and PDFs from the task, downloaded by download-attachment.sh
.claude/specs/<ID>-<slug>.md   the spec (small or full), written by /kodion-create-spec
.claude/plans/<ID>-<slug>.md   the plan, written by plan mode
```

## Who does what

| # | Step | Who | Timesheet step(s) sent |
|---|---|---|---|
| 1 | Start the task | `/start-task <ID>` | `start_session` · `pull_latest` · `create_branch` |
| 2 | Rename the session | developer, confirmed in `/kodion-create-spec` | `rename_session` |
| 3 | Write and save the spec | `/kodion-create-spec <ID>` | `write_spec` · `save_spec` |
| 4 | Approve the spec | whoever reviews it says `approve` — no role check, at any risk level | `review_spec` |
| 5 | Plan | plan mode, following `.claude/rules/plan-mode.md` (spec §12 points there) | `plan` |
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

## Two kinds of project: with git and without

Every skill checks `git rev-parse --is-inside-work-tree` once, then works either way.

| | **With git** | **No git** (a local project) |
|---|---|---|
| `task.json` | `"vcs": "git"`, a real `branch` | `"vcs": "none"`, `"branch": null` |
| Branch | created by `/start-task` | none; no git command is ever run |
| In the spec header | `**Branch:** <branch> (created by /start-task)` | `**Branch:** none (no git set up)` |
| `/ship` | sync → branch → commit → security check → push → confirm → merge | **not used** — it stops and explains |
| Timesheet | all 16 steps | 9 steps; 7 skipped **with a written reason** |

**No skill ever runs `git init`.** `/start-task` offers it as advice and lets the developer do it.

### Which steps are sent when there is no git

| # | Group | Steps | No git |
|---|---|---|---|
| 1 | Setup | `start_session` | **sent** |
| 1 | Setup | `pull_latest` | skipped — *no git set up, nothing to pull* |
| 1 | Setup | `create_branch` | skipped — *no git set up, no branch created* |
| 2 | Rename | `rename_session` | **sent** |
| 3 | Spec | `write_spec` · `save_spec` | **sent** |
| 4 | Approve | `review_spec` | **sent** |
| 5 | Plan | `plan` | **sent** |
| 6 | Build | `implement` · `validate` · `iterate` | **sent** |
| 7 | Ship | `commit` · `push` · `pr_merge` · `back_to_main` · `delete_branch` | all skipped — *no git set up, nothing to commit, push or merge* |

Groups 2 to 6 are identical either way: writing a spec, approving it, planning and building don't
run a git command. **Never send a step that didn't happen**, and never invent a meaning for one.

**The reason must be visible.** A skipped step is never silently blank. Each skill records it with
`--skip` and prints the reason in its reply:

```
bash .claude/skills/start-task/scripts/log-step.sh <ID> pull_latest --skip "no git set up, nothing to pull"
```

That posts **nothing** to the API and writes one line, so the reason survives the session:

```json
{"step":"pull_latest","at":"<time>","posted":false,"count":null,"skipped":"no git set up, nothing to pull"}
```

- `--skip` **never posts.** It is only for a step that did not happen and will not happen for this
  task as it stands. A step that failed to post is a different thing: send it normally and let
  `--retry` deal with it.
- **`--retry` ignores skipped lines**, so a skipped step is never accidentally sent later.
- Reading the log: take the **newest line for each step**. A `"skipped"` line followed by a
  posted one means the step happened later (git was set up) — the posted line wins.

### When git is added to the project later

1. The developer runs `git init` and a first commit themselves.
2. They run `/start-task <ID>` again on the same task. It sees the folder is now a git repo while
   `task.json` still says `"vcs": "none"`, so it finds the base branch, creates the task branch,
   and updates `task.json` in place — `"vcs": "git"` plus `branch`, `base`, `base_commit` and
   `remote`, leaving every other field exactly as it is.
3. It sends **`pull_latest` and `create_branch` now**, normally — they were skipped, never posted,
   so each count lands at 1, exactly as if the task had started on git. `start_session` is **not**
   resent, so its count stays at 1. The earlier skipped lines stay in `log.jsonl` as a record; the
   newer posted line is the one that counts.
4. `/ship` then works normally and sends the 5 Ship steps. The board ends up complete.
5. The spec's `Branch:` line changes from `none` to the real branch the next time the spec is saved.

### POST API: no change needed

`POST /api/dev-workflow/tasks/<ID>/logs` is unchanged — it takes one step name, and a no-git task
simply sends fewer. The 16 fixed names, the 422 on an unknown name, the 100-per-step cap and the
60-requests-a-minute limit all stay as they are.

**Optional, only to show the reason on the Task Board:** the API could accept
`{"step":"pull_latest","skipped":true,"note":"no git set up"}` and the board could render
*"skipped — no git set up"* in place of an empty row. Until that exists, the reason lives in the
developer's session and in `log.jsonl`. Nothing in these skills depends on it.

## Base branch

With git only. `/start-task` finds it in this order and saves it in `task.json.base`:
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
  "acceptance_criteria": null,
  "project": null,
  "type": null,
  "priority": null,
  "attachments": [
    {"name": "task_316_shot.png", "url": "https://timesheetv2.kodionsoftwares.com/assets/task-screenshots/task_316_shot.png", "path": ".claude/attachments/316.png", "status": "ok"}
  ],
  "videos": [],
  "source": "api",
  "vcs": "git",
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
- Only `/start-task` fills `title`, `description`, `acceptance_criteria`, `project`, `type`, `priority`, `attachments` and `videos`, copied exactly from `raw.json` (or manual input, `source: "manual"`). **No skill invents task data:** a field the API didn't send stays `null`, and a list the API didn't send stays `[]`.
- **Attachments.** `/start-task` downloads each image or PDF with `download-attachment.sh` into `.claude/attachments/` and records `path` and `status` (`"ok"` · `"skipped: <reason>"` · `"error: <reason>"`). Only `https://timesheetv2.kodionsoftwares.com/assets/` links are downloaded, the key is never sent with them, and videos are kept as links only. `/kodion-create-spec` opens the `"ok"` files with Read and may retry one that's missing or failed on the network. What the GET API still needs to send is written up in `docs/API-CHANGE-task-attachments.md`.
- `/start-task` writes the whole file (new task, start again, or reopen). Each later skill updates **only its own field** with Edit, never rewrites the file:
  - `/kodion-create-spec` → `spec`
  - plan mode → `plan`
  - `/ship` → `pr`, `status: "shipped"`
- **`vcs`:** `"git"` or `"none"`. With no git, `branch`, `base`, `base_commit` and `pr` stay `null`. A missing `vcs` field means `"git"` (task files written before v2.4.0).
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
- **Small spec** (`templates/spec-small.md`): Small size **and** Low risk. Part A stays around 55 lines, short plan, blocker checks only.
- **Full spec** (`templates/spec-template.md`): everything else, including small changes that touch money, login, permissions, saved data or personal data. Part A stays around 70 lines.

**Both open the same way, so a review takes about a minute:** an `AT A GLANCE` box of **eight
rows** (Goal · Changes · Won't · Keep · Danger · Size · Needs · Verdict), always plain text, then
**at most one** drawing and nothing else visual. Only the box has to be read; the line caps above
are for everything in Part A.

**The drawing is a Mermaid block** — `graph LR` for a flow, `graph TD` for before → after,
`sequenceDiagram` for a journey — which renders as a real diagram in VS Code preview (with the
Markdown Preview Mermaid Support extension), on GitHub and in the Claude app, and as code in the
Claude Code session. A wireframe or a places list has no Mermaid form and stays plain text.

**`.claude/spec-visuals`** decides whether a plain-text copy goes under the diagram: `mermaid`
(diagram only) or `mermaid+text`. A missing file means `mermaid+text`, and the spec skill asks
once, offering to save the answer — the same pattern as `.claude/base-branch`. When
`mermaid-ascii` is installed the copy is **generated** (`mermaid-ascii -f <file>.mmd -x 2 -y 1
--max-width 70`) rather than hand-drawn, so the two can never disagree.

The rules and the limits are in the spec skill's `references/visuals.md`.

Force one with `--small` or `--full` (`--small` is refused for Medium or High risk). Both keep the same section numbers (§4.3, §6, §10, §12, §13, §14), so plan mode always follows §12.

## Uncommitted changes (with git)

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
- Check for git first (`git rev-parse --is-inside-work-tree`). With git, check `git branch --show-current` matches `task.json.branch`; if not, stop and say which branch to switch to. With no git, skip every branch and git check.
- Only `/start-task` calls the GET API. Only `log-step.sh` calls the POST API.
- Never commit, copy or share `.claude/tasks/` or `.claude/settings.local.json` — the second one holds the developer's key.
- Approval has no role gate: whoever reviews the spec or the plan can approve it, at any risk level. Risk decides how much care the work needs, not who signs it off.
