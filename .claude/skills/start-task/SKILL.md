---
name: start-task
description: Start work on a Kodion timesheet task. Fetches the task's title and description from the timesheet API once, saves it to .claude/tasks/<ID>/, pulls the latest main, creates and switches to a branch named after the task, and writes the first workflow log line. Step 1 of the spec-driven flow, before the spec command. Runs only when the developer types /start-task (for example "/start-task 164").
argument-hint: <task number>   or   <ID> | <task name> | <description>
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Bash(bash .claude/skills/start-task/scripts/fetch-task.sh:*), Bash(git status --porcelain), Bash(git rev-parse:*), Bash(git check-ignore:*), Bash(git branch --show-current), Bash(git branch --list:*), Bash(git ls-remote --heads origin:*), Bash(git remote), Bash(git checkout main), Bash(git checkout master), Bash(git checkout -b:*), Bash(git pull --ff-only origin:*), Bash(date:*)
---

# /start-task

Step 1 of the Kodion spec-driven flow. When it finishes:
- the task is saved in `.claude/tasks/<ID>/task.json` (the only file later skills read)
- the first line of `.claude/tasks/<ID>/log.jsonl` is written
- `main` is up to date
- you are on a branch named after the task

**This is the only skill that calls the task API.** The spec command, plan mode and `/ship` all read `task.json`. File formats are defined in `.claude/rules/task-workflow.md`; follow them exactly.

**This skill only does git setup and saves task info. It never writes code, specs or plans, and never commits, stashes, pushes, merges, resets, deletes branches or discards changes.**

Arguments: `$ARGUMENTS`

## Command rules (apply to every step)
- One simple command per Bash call. Never use `&&`, `;`, `||`, pipes, `cat`, `echo` or `ls`. Read files with Read; find files with Glob.
- Only run commands listed in `allowed-tools`, plus `git checkout <existing branch>` (which asks for permission on purpose).
- **Never run `git stash`, `git add`, `git commit`, `git reset`, `git clean`, `git checkout -- <path>`, `git branch -D`, `push`, `merge` or `rebase`, even if the developer approves the prompt.** If one seems needed, stop and tell the developer to run it themselves.
- **When a check says stop, stop.** Never decide that unexpected files are "fine" or "leftovers".
- Ignore `LF will be replaced by CRLF` warnings. They are not errors; don't mention them.

---

## Step 1: Parse the input

- **Task number** (`164` or `#164`): remove the leading `#`. It must be digits only.
- **Manual details** (`ID | name | description`): only the first two `|` are separators. ID and name are required; description is optional.
- **No arguments:** ask for the task number in one AskUserQuestion, and mention they can type `ID | name | description` instead.

Use this clean `<ID>` everywhere: folder, branch, log, next command.

## Step 2: Safety checks (before any API call or git change)

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
     Tell the developer: "Commit this `.gitignore` change on `main` yourself, so every branch protects your key."
   - **Cancel.** Stop.

   Don't continue until both are ignored.
3. `git status --porcelain`.
   - If nothing is listed, continue.
   - If the **only** change is `.gitignore` from 2.2, continue. It comes with you onto the new branch, which is what we want.
   - If anything else is listed, **stop**. Those changes belong to the current branch's task. Tell the developer:
     - which branch they're on (`git branch --show-current`) and how many files have changes
     - to save that work themselves, then run `/start-task <ID>` again:
       - commit it (recommended): `git add -A` then `git commit -m "WIP: <what it is>"`, or
       - set it aside: `git stash -u`, and bring it back on that branch with `git stash pop`. Warn that a stash also hides any `.gitignore` edits in it.

## Step 3: Get the task details

**Check for a started task first.** Glob `.claude/tasks/<ID>/task.json`. If it exists, Read it. If it has a `branch`, ask in one AskUserQuestion:
- **Resume: switch to `<branch>`** (recommended). Skip to Step 6, and switch instead of creating.
- **Start again.** Fetch again below. `task.json` is replaced, but `log.jsonl` is kept.

**A. Task number:** run from the project root:
```
bash .claude/skills/start-task/scripts/fetch-task.sh <ID>
```
- `OK saved .claude/tasks/<ID>/raw.json`: read the printed JSON. Task name = `title`, description = `description`. The JSON turns `\r\n` into line breaks and escape codes like `→` into symbols when read.
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
- `git remote`. If it shows `origin`, also run `git ls-remote --heads origin <name>`. If there's no `origin`, skip this and remember "no remote" for Steps 5 and 7.

## Step 5: Confirm with the developer

Ask in **one** AskUserQuestion. Show the task title, the first line of the description, the base (`main`, and "local only, no remote" if that applies), and:
- **Create `<branch name>` from the latest `<base>`** (recommended)
- **Change the type** (feature / fix / refactor / chore)
- **Use a different name**
- If the branch already exists: **Switch to the existing branch** instead

Do nothing to git until the developer confirms.

## Step 6: Pull main and create or switch

1. **Base branch:** `main`. If `git rev-parse --verify main` fails, use `master`. If neither exists, ask.
2. `git checkout <base>`
3. **Update the base:**
   - No `origin`: skip the pull.
   - Otherwise run `git pull --ff-only origin <base>`. If it fails (diverged history, conflict, auth), stop and show the error. Don't try to fix it.
4. **Create or switch:**
   - New: `git checkout -b <branch name>`
   - Existing (chosen in Step 3 or 5): `git checkout <branch name>`. Claude Code asks for permission first; that is intended.
5. `git branch --show-current` and confirm it shows the branch.
6. `git rev-parse --short HEAD` → `base_commit`.

## Step 7: Save task.json, log, hand over

1. `date -Iseconds` → `<now>`.
2. **Write `.claude/tasks/<ID>/task.json`** with the Write tool, in the format from `task-workflow.md`:
   - API fields copied exactly from `raw.json` (or the manual details). Anything the API didn't give stays `null`; never invent a description, criteria or priority.
   - `source`: `"api"` or `"manual"`
   - `branch`, `base`, `base_commit`, `remote`: `true` or `false`
   - `started_at`: `<now>`, or keep the old value when resuming
   - `status`: `"in_progress"`
   - `spec`, `plan`, `pr`: keep existing values when resuming, otherwise `null`
3. **Append** to `.claude/tasks/<ID>/log.jsonl` (Read it first if it exists, then Write it with the new line added at the end; create it if missing):
   ```json
   {"step":"task_started","at":"<now>","by":"start-task","branch":"<branch>","resumed":<true|false>}
   ```
4. **Find the spec command that exists in this project.** Glob, in this order:
   - `.claude/skills/kodion-create-spec/SKILL.md`
   - `.claude/commands/kodion-create-spec.md`
   - `.claude/skills/create-spec/SKILL.md`
   - `.claude/commands/create-spec.md`

   Use the first one found. If none exists, say "No spec command found in this project" instead of printing one.
5. **Reply in this shape, nothing more:**

```
✅ Task #<ID> ready
Task:    <title>
Branch:  <branch> (<new from latest main | new from local main, no remote | resumed>)
Saved:   .claude/tasks/<ID>/task.json

⚠️ <only the warnings that apply: weak description · no remote · .gitignore changed, commit it on main>

Next
1. Rename this session to: <ID>-<slug>
2. Create the spec:  /<spec command> <ID>
```

- Pass **only the ID**. The spec command reads the title and description from `task.json`. Never paste them into the command.
- Weak description warning: "The task has no real description. Ask the task owner for details, or be ready to answer questions in the spec step."

If anything stopped the flow, say what was done, what wasn't, and the exact next action.
