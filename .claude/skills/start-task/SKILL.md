---
name: start-task
description: Start work on a Kodion timesheet task. Fetches the task's title and description from the timesheet API once, saves it to .claude/tasks/<ID>/, finds the project's base branch (main, master or a configured one), handles uncommitted changes safely, pulls the latest base, creates and switches to a branch named after the task, and ticks the Setup steps (start_session, pull_latest, create_branch) in the timesheet's Developer Workflow Logs. Step 1 of the spec-driven flow, before the spec command. Runs only when the developer types /start-task (for example "/start-task 164").
argument-hint: <task number>   or   <ID> | <task name> | <description>
disable-model-invocation: true
metadata:
  version: 1.2.1
allowed-tools: Read, Write, Edit, Glob, Bash(bash .claude/skills/start-task/scripts/fetch-task.sh:*), Bash(bash .claude/skills/start-task/scripts/log-step.sh:*), Bash(git status --porcelain), Bash(git rev-parse:*), Bash(git check-ignore:*), Bash(git branch --show-current), Bash(git branch --list:*), Bash(git ls-remote --heads origin:*), Bash(git ls-remote --symref origin HEAD), Bash(git symbolic-ref --short refs/remotes/origin/HEAD), Bash(git remote), Bash(git checkout main), Bash(git checkout master), Bash(git checkout -b:*), Bash(git fetch origin:*), Bash(git pull --ff-only origin:*), Bash(git stash push -u -m:*), Bash(date:*)
---

# /start-task

**Version 1.2.1** · what changed: [CHANGELOG.md](CHANGELOG.md)

Step 1 of the Kodion spec-driven flow. When it finishes:
- the task is saved in `.claude/tasks/<ID>/task.json` (the only file later skills read)
- the project's **base branch** (`main`, `master`, or the one set in `.claude/base-branch`) is up to date
- you are on a branch named after the task, started from that base
- the Setup steps are ticked on the Task Board: `start_session`, `pull_latest`, `create_branch`

**This is the only skill that reads the task from the API.** The spec command, plan mode and `/ship` all read `task.json`. File formats are defined in `.claude/rules/task-workflow.md`; follow them exactly.

**This skill only does git setup and saves task info. It never writes code, specs or plans, and never commits, pushes, merges, resets, deletes branches or discards changes.**

Arguments: `$ARGUMENTS`

## Command rules (apply to every step)
- One simple command per Bash call. Never use `&&`, `;`, `||`, pipes, `cat`, `echo` or `ls`. Read files with Read; find files with Glob.
- Only run commands listed in `allowed-tools`, plus `git checkout <existing branch>` (which asks for permission on purpose).
- **Never run `git add`, `git commit`, `git reset`, `git clean`, `git checkout -- <path>`, `git branch -D`, `push`, `merge` or `rebase`, even if the developer approves the prompt.** If one seems needed, stop and tell the developer to run it themselves.
- **The only stash allowed** is the named one in Step 2.4, and only when the developer picks it. Never `git stash pop`, `drop` or `clear`.
- **When a check says stop, stop.** Never decide that unexpected files are "fine" or "leftovers".
- Ignore `LF will be replaced by CRLF` warnings. They are not errors; don't mention them.

## Sending a workflow step (used in Steps 3, 6 and 7)

The timesheet ticks a step when it receives it. Send one step with:
```
bash .claude/skills/start-task/scripts/log-step.sh <ID> <step>
```
- `OK posted ...` → the step is ticked. Remember it as ✅.
- `ERROR ...` → remember it as ❌ with the reason in plain words. The script has already saved it in `log.jsonl`, so it can be resent later.
- **A log error never stops the flow and never undoes git work.** Report it in Step 7.
- **Only send steps when the task came from the API** (`source: "api"`). With manual details, the ID may not be a real timesheet task, so send nothing.
- Send each step **once per run**, right after the thing it describes has happened. Never retry in a loop.

| Step | Send it when | Don't send it when |
|---|---|---|
| `start_session` | The task was fetched from the API (Step 3A), or you're resuming or reopening a task whose `task.json` has `source: "api"` | Manual details · fetch failed |
| `pull_latest` | `git pull --ff-only` succeeded, **or** there's no remote (the local base is already the latest code, so there's nothing to pull) | The pull failed · the pull was skipped because you're continuing on the task branch (Step 2.4) |
| `create_branch` | A **new** branch was created, **or** you resumed an existing branch and `log.jsonl` has no `"step":"create_branch"` line with `"posted":true` | The branch wasn't created or switched to |

`rename_session` happens after this skill ends, when the developer renames the session. The spec command asks about it.

---

## Step 1: Parse the input

- **Task number** (`164` or `#164`): remove the leading `#`. It must be digits only.
- **Manual details** (`ID | name | description`): only the first two `|` are separators. ID and name are required; description is optional.
- **No arguments:** ask for the task number in one AskUserQuestion, and mention they can type `ID | name | description` instead.

Use this clean `<ID>` everywhere: folder, branch, log, next command.

## Step 2: Safety checks and base branch (before any API call or git change)

1. `git rev-parse --is-inside-work-tree`. If it fails, stop: "This folder isn't a git repository. Run `git init` and make a first commit, then run /start-task again."
2. **Secrets and task files must be ignored.** Run both:
   - `git check-ignore -q .claude/settings.local.json`
   - `git check-ignore -q .claude/tasks/x`

   If either fails (not ignored), ask in one AskUserQuestion:
   - **Add them to `.gitignore` now** (recommended): Read `.gitignore` (create it if missing) and add the missing lines:
     ```
     .claude/settings.local.json
     .claude/tasks/
     ```
     Tell the developer: "Commit this `.gitignore` change on the base branch yourself, so every branch protects your key."
   - **Cancel.** Stop.

   Don't continue until both are ignored.

3. **Find the base branch.** The new task branch always starts from it, whatever branch you're on now. Stop at the first rule that gives an answer:

   | # | Check | Result |
   |---|---|---|
   | a | Glob `.claude/base-branch`. If it exists, Read it: one branch name on the first line | Use it. The team set it. |
   | b | `git remote`. If it shows `origin`, run `git symbolic-ref --short refs/remotes/origin/HEAD` | `origin/main` → `main` |
   | c | Still unknown and there's an `origin`: `git ls-remote --symref origin HEAD` | `ref: refs/heads/master HEAD` → `master` |
   | d | `git rev-parse --verify --quiet main` and `git rev-parse --verify --quiet master` | Only one exists → use it |
   | e | Both exist, or neither exists | Ask in one AskUserQuestion: `main` · `master` · other (type it). Offer to save the answer to `.claude/base-branch`, so nobody is asked again. |

   Remember `<base>`, how it was found, and whether there's an `origin` ("no remote" otherwise).
   If the base came from rules b or c but that branch doesn't exist locally yet, that's fine: Step 6 creates it from `origin`.

4. **Uncommitted changes.** Run `git status --porcelain` and `git branch --show-current` (→ `<current>`). If `<current>` is empty you're on a detached HEAD: run `git rev-parse --short HEAD` and use "detached at `<sha>`" as `<current>` in every message below.
   - Nothing listed → continue.
   - The **only** changes are `.gitignore` (from 2.2) and/or `.claude/base-branch` (from 2.3) → continue. They come with you onto the new branch.
   - **Already on this task's branch:** Glob `.claude/tasks/<ID>/task.json`. If it exists and `<current>` is its `branch`, the changes are probably this task's own work in progress. Hold the menu for now and go to Step 3. If the developer picks **Resume**, continue **without leaving the branch** (skip Steps 6.1 and 6.2) and never show the menu. If they pick anything else, show the menu below first.
   - Anything else → **don't touch anything yet.** Show `<current>`, the number of changed files and up to 10 of their names, then ask in **one** AskUserQuestion:

   | Option | Offer it when | What happens |
   |---|---|---|
   | **Keep them on `<current>` and stop** (recommended if `<current>` isn't `<base>`) | Only when `<current>` isn't `<base>` (never tell anyone to commit on the base branch) | Stop. Tell the developer to save the work on `<current>` themselves: `git add -A`, then `git commit -m "WIP: <what it is>"`. Then run `/start-task <ID>` again. |
   | **Bring them into the new task branch** (recommended if `<current>` is `<base>`) | Only when `<current>` is `<base>`, i.e. the work for this task was started on the base by mistake | Continue. The changes stay in the working folder and move onto the new branch in Step 6. If the pull in Step 6 fails because of them, stop and say so. |
   | **Set them aside safely (stash)** | Always | Run `git stash push -u -m "start-task <ID>: from <current>" -- . ":(exclude).gitignore" ":(exclude).claude/base-branch"`, then continue. `.gitignore` and `.claude/base-branch` stay, so your key file stays ignored. Tell the developer how to get the rest back later: `git checkout <current>` (for a detached HEAD: `git checkout <sha>`), then `git stash list` and `git stash pop` for the line named `start-task <ID>: from <current>`. |
   | **Cancel** | Always | Stop. Nothing was changed. |

   Never pick for the developer. Never commit or discard their changes.

## Step 3: Get the task details

**Check for a started task first.** Glob `.claude/tasks/<ID>/task.json`. If it exists, Read it.

- **Looks finished:** the task file has `"status": "shipped"` (set by `/ship`) or `"done"`, or its `branch` no longer exists (`git branch --list <branch>` is empty, **and** either there's no `origin` or `git ls-remote --heads origin <branch>` is empty). This usually means it was shipped and the branch was deleted. Ask in one AskUserQuestion:
  - **New task for the extra changes** (recommended): stop. Tell the developer: *"Task #<ID> looks finished. For more changes, create a new task on the Task Board (e.g. 'Follow-up to #<ID>: …'), pick it up, open a new Claude session, and run `/start-task <new number>`. Its spec can link back to #<ID>."*
  - **Reopen this task on a new branch:** carry on from Step 4. Add `-2` to the slug (`-3` if `-2` is taken), so the branch name is new. Keep the old `task.json` fields and set `status` to `"in_progress"`. If `source` is `"api"`, **send `start_session`**, then run `log-step.sh <ID> --retry`; the other Setup steps are sent in Step 6 as usual (their counts go up).
  - **Cancel.** Stop.
- **Still in progress** (it has a `branch` that exists): ask in one AskUserQuestion:
  - **Resume: switch to `<branch>`** (recommended). If `task.json` has `source: "api"`, **send `start_session`**, then run `log-step.sh <ID> --retry`. Then go to Step 6 and switch instead of creating. If you're already on `<branch>` (Step 2.4), skip Steps 6.1 and 6.2 and don't leave the branch.
  - **Start again.** Fetch again below. `task.json` is replaced, but `log.jsonl` is kept.

**A. Task number:** run from the project root:
```
bash .claude/skills/start-task/scripts/fetch-task.sh <ID>
```
- `OK saved .claude/tasks/<ID>/raw.json`: read the printed JSON. Task name = `title`, description = `description`. The JSON turns `\r\n` into line breaks and escape codes like `→` into symbols when read.
  Then **send `start_session`**, and after it run `bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry` once, to resend any step that failed on an earlier run (mention it only if it prints `ERROR`). Sending first means an older failed `start_session` is marked as already sent instead of being sent twice.
- `ERROR ...`: tell the developer in plain words what went wrong and how to fix it, using the table below. Don't paste the raw server reply; mention it in one short line only if it helps.

| Error | Tell the developer |
|---|---|
| `NO_KEY` | One-time setup, either way: **(a)** copy `.claude/skills/start-task/settings.local.example.json` to `.claude/settings.local.json` (or merge its `env` block into an existing one), replace `kdw_PASTE_YOUR_KEY_HERE` with your key, and restart Claude Code; or **(b)** save the downloaded hook script (Timesheet → Profile → Personal → Automatic workflow tracking) as `~/.claude/hooks/kodion-workflow.sh`. |
| `401` | The key is wrong or old. Downloading the script again makes a new key, so use the newest file. |
| `404` | Pick up task #ID on the Task Board first. Use the number on the card, not the project number in the address bar. |
| `429` | Too many requests. Wait one minute. |
| `NETWORK` / other | The API can't be reached right now. |

After any error, offer two choices in one AskUserQuestion: **Try again** (after they fix it), or **Enter the details manually**.

**B. Manual details:** use them as given. Ask for anything missing.

**Never ask for the key, print it, or write it into any file yourself.**

**Weak description check:** if the description is empty, or the same as the title (ignoring case and punctuation), remember to warn in Step 7.

## Step 4: Build the branch name

Format: `<type>/<ID>-<slug>`
- **Type:** from the title and description. Feature → `feature/` · Bug fix → `fix/` · Refactor → `refactor/` · Chore (config, setup, docs, dependencies) → `chore/`. If unclear, use `feature/`.
- **Slug:** task name in lowercase, spaces → `-`, keep only `a-z 0-9 -`, collapse repeated `-`, trim `-` from the ends, max 50 characters (cut at a word boundary).
- Examples: `164 · Testimonial section` → `feature/164-testimonial-section` · `316 · Hide unfinished footer links.` → `chore/316-hide-unfinished-footer-links`

Check whether the name is free:
- `git branch --list <name>` (local)
- If there's an `origin`: `git ls-remote --heads origin <name>`.

## Step 5: Confirm with the developer

Ask in **one** AskUserQuestion. Show:
- the task title and the first line of the description
- **Base:** `<base>` and how it was found (e.g. "main, from origin" · "master, from .claude/base-branch"), plus "local only, no remote" if that applies
- **You're on:** `<current>`. If it isn't `<base>`, add: "The new branch starts from the latest `<base>`, not from `<current>`."
- **Uncommitted changes:** what happens to them (none · coming with you · stashed as `start-task <ID>: from <current>`)

Options:
- **Create `<branch name>` from the latest `<base>`** (recommended)
- **Change the type** (feature / fix / refactor / chore)
- **Use a different name**
- If the branch already exists: **Switch to the existing branch** instead

Do nothing to git until the developer confirms.

## Step 6: Update the base and create or switch

1. **Go to the base:** if there's an `origin`, run `git fetch origin <base>` first, so the base is known even if it only exists on `origin`. Then `git checkout <base>`. For `main` and `master` this runs straight away. For any other name (e.g. `develop` from `.claude/base-branch`), Claude Code asks permission first; that is intended. If `<base>` exists only on `origin`, git creates it locally from `origin/<base>`.
   - If checkout fails because of uncommitted changes (only possible with "Bring them into the new task branch"), stop and say so. Nothing else has changed.
2. **Update the base:**
   - No `origin`: skip the pull. **Send `pull_latest`** (nothing to pull; the local base is the latest).
   - Otherwise run `git pull --ff-only origin <base>`. If it fails (diverged history, conflict, auth), stop and show the error. Don't try to fix it.
   - If the pull succeeded, **send `pull_latest`**.
3. **Create or switch:**
   - New: `git checkout -b <branch name>`
   - Existing (chosen in Step 3 or 5): `git checkout <branch name>`. Claude Code asks for permission first; that is intended.
4. `git branch --show-current` and confirm it shows the branch. Then **send `create_branch`** (see the table for the resume rule).
5. `git rev-parse --short HEAD` → `base_commit`.

## Step 7: Save task.json, log, hand over

1. `date -Iseconds` → `<now>`.
2. **Write `.claude/tasks/<ID>/task.json`** with the Write tool, in the format from `task-workflow.md`:
   - API fields copied exactly from `raw.json` (or the manual details). Anything the API didn't give stays `null`; never invent a description, criteria or priority.
   - `source`: `"api"` or `"manual"`
   - `branch`, `base` (the base branch found in Step 2.3), `base_commit`, `remote`: `true` or `false`
   - `started_at`: `<now>`, or keep the old value when resuming
   - `status`: `"in_progress"`
   - `spec`, `plan`, `pr`: keep existing values when resuming, otherwise `null`
3. **Don't write `log.jsonl` yourself.** Only `log-step.sh` writes it (see `task-workflow.md`). The base is saved in `task.json`; resume and stash details go in your reply.
4. **Find the spec command that exists in this project.** Glob, in this order:
   - `.claude/skills/kodion-create-spec/SKILL.md`
   - `.claude/commands/kodion-create-spec.md`
   - `.claude/skills/create-spec/SKILL.md`
   - `.claude/commands/create-spec.md`

   Use the first one found. If none exists, say "No spec command found in this project" instead of printing one.
5. **Reply in this shape, nothing more:**

```
✅ Task #<ID> ready · /start-task v1.2.1
Task:    <title>
Branch:  <branch> (<new from latest <base> | new from local <base>, no remote | resumed | reopened>)
Saved:   .claude/tasks/<ID>/task.json
Logged:  start_session ✅ · pull_latest ✅ · create_branch ✅   (Task Board → Developer Workflow Logs → Setup)

⚠️ <only the warnings that apply: weak description · no remote · .gitignore changed, commit it on <base> · changes stashed · a step wasn't logged>

Next
1. Rename this session to: <ID>-<slug>
2. Create the spec:  /<spec command> <ID>
```

- **Logged line:** each step that applied, with ✅ or ❌. With manual details: `Logged:  nothing (manual details, not a timesheet task)`.
- **A step wasn't logged:** "<step> wasn't ticked: <plain reason>. To send it later: `bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry`". For `401` / `404` / `NO_KEY`, use the fix from the table in Step 3.
- **Changes stashed:** "Your changes from `<current>` are saved as stash `start-task <ID>: from <current>`. Get them back with `git checkout <current>` (detached HEAD: `git checkout <sha>`), then `git stash pop`."
- Pass **only the ID** to the spec command. It reads the title and description from `task.json`. Never paste them into the command.
- Weak description warning: "The task has no real description. Ask the task owner for details, or be ready to answer questions in the spec step."

If anything stopped the flow, say what was done, what wasn't, and the exact next action.

---

## Changes after a task is finished

| Situation | What to do |
|---|---|
| The task **isn't shipped yet** (branch still exists) and more changes are needed | Stay on the same task, branch and session. Update the spec (it goes back to Draft and needs approving again), then plan and build as usual. |
| The task **was shipped** (merged, branch deleted) and something new is needed | **New task** on the Task Board, **new Claude session**, `/start-task <new number>`. Mention the old task in the description (e.g. "Follow-up to #316"). The new spec links back to it. |
| The shipped work has a **bug** | Same as above: a new bug task. Its own branch (`fix/…`) and its own logs keep the history clear. |
| You really must reuse the old task | Run `/start-task <old number>` and choose **Reopen this task on a new branch**. Its Setup steps are sent again, so their counts go up. |

Why a new task: each timesheet task has one set of 16 workflow steps, and its branch is gone after shipping. A new task keeps the time, the logs and the review for the extra work separate and easy to follow.
