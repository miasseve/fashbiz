---
name: ship
description: Ship the current work — sync with the latest remote changes (resolving any merge conflicts), put pending work on a new branch, run a security check, push it, then merge it into main once the user explicitly confirms. On a project that is not on git it stops and explains instead, ticking nothing. On Kodion tasks it ticks the Ship steps (commit, push, pr_merge, back_to_main, delete_branch) and prints the task's full workflow log at the end. Use when the user says "/ship", "ship this", "ship it", or asks to get their current changes onto main safely.
argument-hint: [task ID]   (only needed when the project isn't on git)
metadata:
  version: 1.3.0
allowed-tools: Read, Write, Edit, Glob, Grep, Skill, AskUserQuestion, Bash(bash .claude/skills/start-task/scripts/log-step.sh:*), Bash(bash .claude/skills/ship/assets/preflight.sh), Bash(git:*), Bash(gh:*), Bash(date:*), Bash(ls:*), Bash(grep:*), Bash(find:*), Bash(rm -f .claude/attachments/:*)
---

# Ship

**Version 1.3.0** · what changed: [CHANGELOG.md](CHANGELOG.md)

Get whatever is sitting in the working tree (or on the current branch) onto `main`, safely:
sync → branch → commit → **security check** → push → **confirm** → merge. Two gates are not
optional, no matter how clean the diff looks: nothing gets pushed with unresolved security
findings, and nothing gets merged into main without the user explicitly saying to, in this
conversation.

In git mode this skill assumes a GitHub-style remote named `origin` and a single shared default
branch (usually `main`, sometimes `master`). It works from plain `git` — no `gh` CLI required,
though if `gh` is installed and authenticated you may use it to open a PR instead of a bare
local merge when the user prefers that trail (see Step 7).

## Step 0 — Is this project on git?

**Run this first, before the preflight:**

```bash
git rev-parse --is-inside-work-tree
```

| Result | What to do |
|---|---|
| prints `true` | Steps 1–12 below, as written |
| fails ("not a git repository") | Skip Steps 1–11 and go to **No git? `/ship` has nothing to do** near the end of this file |

With no git there is nothing to commit, push or merge, so `/ship` stops, ticks nothing, and says
why. Never run `git init` yourself to make it work.

## Ground rules (apply throughout)

- **Never force-push** (`--force` / `--force-with-lease`) and never `--no-verify` — if a push
  or hook fails, fix the actual problem or ask the user, don't bypass it.
- **Never merge into main without explicit confirmation in this conversation.** Pushing the
  feature branch is not confirmation. Silence is not confirmation.
- Before any command that discards work (`checkout --`, `reset --hard`, `clean`, `merge --abort`
  after real edits), run `git status` and make sure nothing uncommitted would be lost — stash
  it first if unsure.
- Before staging/committing, glance at `git status` and `git diff --stat` for anything that
  looks like a secret, credential, or file that shouldn't be there. Ask before including it.
- **Nothing gets pushed without passing the Step 6 security check.** Not "looked fine to me" —
  actually run it, every single `/ship`, even for a change that feels trivial.
- Prefer a new commit over amending. Prefer `--no-ff` merges into main so the branch's history
  stays visible in `git log --graph`.
- If the working tree has changes that look unrelated to what the user is currently shipping
  (leftover debug files, an unrelated half-finished edit), point them out and ask whether they
  belong in this ship before folding them into the commit.

## Timesheet logs (Kodion task branches only)

On a Kodion task, `/ship` ticks the five **Ship** steps in the task's *Developer Workflow Logs* on the Task Board, the same way `/start-task` ticks the Setup steps.

**Is this a Kodion task?** Find `<ID>` like this, in order:
1. `$ARGUMENTS` has a number (`/ship 325`) → use it, stripping a leading `#`.
2. **Git mode:** take it from the current branch name (`<type>/<ID>-<slug>`, e.g. `feature/325-…` → `325`).
3. **No branch name (a project with no git):** Glob `.claude/tasks/*/task.json` and Read each one. Use the single task whose `status` is `"in_progress"`. If there are several, ask which one in one AskUserQuestion. If there are none, it isn't a Kodion task.

It's a Kodion task only if **both** are also true:
- `.claude/tasks/<ID>/task.json` exists (Glob it)
- `.claude/skills/start-task/scripts/log-step.sh` exists (Glob it)

If either is missing, **don't send any steps and don't mention logging.** Remember `<ID>` now; in git mode Step 10 deletes the branch it came from, and Step 12 prints the log.

If `/ship` creates a new branch in Step 4 (you started on `main`), that branch has no task number, so nothing is logged.

**How to send a step:**
```bash
bash .claude/skills/start-task/scripts/log-step.sh <ID> <step>
```
- `OK posted …` → the step is ticked. Remember it as ✅.
- `ERROR …` → remember it as ❌ with the reason. The script has already saved it in `.claude/tasks/<ID>/log.jsonl`, so it can be resent later.
- **A log error never stops, blocks or undoes the ship.** Carry on and report it at the end.
- Send each step **once**, right after the git action it describes **succeeds**. Never send a step for something that failed or was skipped, and never retry in a loop.

| Step | Send it right after | Don't send it when |
|---|---|---|
| `commit` | Step 5: `git commit` succeeded, **or** the branch already had commits ready to ship (committed before `/ship`) | There is nothing committed on the branch |
| `push` | Step 7: `git push -u origin <branch>` succeeded | The push failed or was skipped |
| `pr_merge` | Step 9: the merge is on `origin/<default-branch>` (local merge + push, or `gh pr merge`) | The developer said no to the merge in Step 8 |
| `back_to_main` | Step 9: you're on `<default-branch>` after the merge (`git branch --show-current`) | Still on the feature branch |
| `delete_branch` | Step 10: the feature branch was deleted | The developer wants to keep the branch |

**Resend earlier failures:** after Step 10 (or after Step 8 if the merge was declined), run once:
```bash
bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry
```
It resends any step that failed earlier in this task (including from `/start-task`). Report only if it resent something or still has steps waiting.

**End of the ship:** add one line to your final summary, then print the workflow log (Step 12):
```
Logged:  commit ✅ · push ✅ · pr_merge ✅ · back_to_main ✅ · delete_branch ✅   (Task Board → Developer Workflow Logs → Ship)
```
- List only the steps that applied. Use ❌ with a short reason for any that failed, plus: *"To send it later: `bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry`"*.
- For `401` / `404` / `NO_KEY`, give the fix in plain words: use your newest key · pick up the task on the Task Board · set up the key as in `/start-task`.

## Step 1 — Preflight

Run the bundled script instead of piecing status together from several commands:

```bash
bash <skill-dir>/assets/preflight.sh
```

This reports: current branch, the remote's default branch, working-tree status, staged vs
unstaged diffs, ahead/behind vs upstream, unpushed commits, and how local vs `origin` compare
on the default branch. Read it before doing anything else — it tells you which of the cases
below you're in.

**Nothing to ship** (clean tree, current branch fully in sync with its upstream, no unpushed
commits) → say so and stop. There is nothing for `/ship` to do.

## Step 2 — Sync with the latest remote changes

Do this on the default branch, before branching off it, so the new branch starts from the
freshest possible base and conflicts — if any — surface here rather than later at merge time.

```bash
git fetch origin
```

If the working tree has uncommitted changes **and** you're currently on the default branch
(the common case — someone ran `/ship` mid-work without branching first): `git stash push -u`
before updating, then `git stash pop` right after, so the pull can't conflict with dirty files.

```bash
git checkout <default-branch>
git pull origin <default-branch>
```

If `git pull` reports conflicts here (rare — it means local `<default-branch>` had commits
`origin/<default-branch>` didn't), resolve them now using the conflict-resolution steps below
before continuing. If you stashed, `git stash pop` next — that can *also* conflict; resolve the
same way.

## Step 3 — Work out what's being shipped

Two shapes, handle whichever the preflight showed:

- **Uncommitted changes on the default branch** (most common): this is the work to ship.
- **Already on a feature branch** with commits and/or uncommitted changes: use that branch —
  don't create a redundant second one. Skip to Step 5 (rebase it onto the freshly-updated
  default branch first if it's behind), then Step 6.

## Step 4 — Create the branch

From the now-updated default branch:

```bash
git checkout -b <branch-name>
```

Name it after what the diff actually does, `kebab-case`, prefixed to match this repo's existing
convention if one is visible in `git branch -a` (e.g. `feature/…`, `fix/…`). Base it on the
files touched and the nature of the change — ask the user for a one-line description first if
it's not obvious from the diff.

## Step 5 — Commit

**First, verify the commit author identity is actually this user's**, not whatever happens to
be sitting in git config — on a shared or freshly-imaged machine, global `user.name`/`user.email`
can easily be a leftover from someone else's setup (a template default, a previous developer,
a different account entirely) and silently attribute every commit you make to the wrong person.

```bash
git config user.name
git config user.email
git remote get-url origin
```

Compare the effective `user.email` against the real logged-in user for this session — the
email you actually have for them in this conversation's context (the harness gives you this
directly; use it, don't ask the user to repeat it). If it doesn't match (or either is unset):

1. Derive the correct name from the remote: for a GitHub-style URL
   (`https://github.com/<owner>/<repo>.git` or `git@github.com:<owner>/<repo>.git`), `<owner>`
   is the account this repo actually belongs to — that's almost always the right `user.name`
   for a personal repo. If it's an org repo where the owner clearly isn't a person, ask instead
   of guessing.
2. Set it **locally, scoped to this repo only** — never touch global config without the user
   asking for that explicitly; a machine-wide identity change is a bigger, more surprising
   action than fixing attribution for this one ship:
   ```bash
   git config --local user.name "<derived-or-confirmed-name>"
   git config --local user.email "<the-user's-real-email>"
   ```
3. Tell the user you did this and why (mismatched identity found, corrected locally) — don't
   silently change it without a word.

This check costs two `git config` reads and is worth doing every ship, not just the first time
you notice a mismatch — the underlying machine-level misconfiguration doesn't fix itself.

Then commit normally:

```bash
git add -A   # or stage selectively if some working-tree changes don't belong in this ship
git status   # confirm what's about to be committed
git commit -m "<summary>

<body if needed>

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Write the message from what the diff actually does, not a generic "update files". If the user
already gave you a description of the work in this conversation, ground the message in that.

**Kodion task:** if the commit succeeded (or the branch already had commits to ship), send `commit` (see *Timesheet logs*).

## Step 6 — Security check (mandatory, every ship)

Before anything is pushed to `origin`, run a security pass over exactly what's about to leave
the machine — the commit(s) just made on this branch. This step is not skippable and not a
formality; run it every time, even for changes that look purely cosmetic.

**Primary: use the project's `security-review` skill.**

```
Skill({ skill: "security-review" })
```

This reviews the pending changes on the current branch against the standard checklist
(injection, auth/access-control regressions, secrets, unsafe deserialization, SSRF, path
traversal, dependency risk, and the rest of its usual coverage). Let it run to completion and
read its findings — don't just check that it ran.

**Always also run this fast, deterministic backstop**, even when `security-review` is
available — it catches the specific things most likely to slip into *this* kind of change and
costs almost nothing:

```bash
# Full diff of what's about to be pushed, not just the stat summary
git diff <default-branch>...<branch-name>

# Common secret / credential shapes
git diff <default-branch>...<branch-name> | grep -nEi \
  '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api|secret|access)[_-]?key\s*[:=]|password\s*[:=]\s*["'"'"'][^"'"'"']|token\s*[:=]\s*["'"'"'][A-Za-z0-9_\-\.]{10,})'

# Files that shouldn't be newly tracked
git diff --name-only <default-branch>...<branch-name> | grep -Ei '\.(env|pem|key|p12|pfx)$|credentials\.json$|\.npmrc$'
```

If `security-review` genuinely isn't available in this session, don't silently skip it —
fall back to the manual checklist:

1. Read the full diff, not just filenames.
2. Run the grep backstop above.
3. Skim specifically for: auth/permission checks weakened or newly bypassed, CORS or CSP
   loosened, a security control disabled "temporarily", input reaching a query/shell/`eval`
   without the sanitisation the surrounding code otherwise uses, a new dependency pulled from
   somewhere other than the project's usual registry.
4. For this project specifically: never let a raw `DB_PASSWORD`, API key, or `.env` value be
   the thing that made it into a diff — check `git diff --stat` for `.env` before anything else.

**Judgment on findings:** an obvious false positive (a variable literally named `password` that
is a form field label, a test fixture with a fake key clearly marked as fake) doesn't need to
block — but say what you checked and why you're not blocking, don't just wave it through
silently. Anything else that's a real finding: **do not push.** Report it plainly, fix what's
fixable right there (move a secret into `.env` and confirm `.env` is git-ignored, `git rm
--cached` a file that shouldn't be tracked, tighten a loosened check), and only proceed to
Step 7 once the user has seen the finding and agreed on the resolution.

## Step 7 — Push the branch

```bash
git push -u origin <branch-name>
```

If `gh` is installed and authenticated (`gh auth status`) and the user wants a reviewable trail
(branch protection on `<default-branch>`, or they just prefer PRs), open one instead of only
pushing:

```bash
gh pr create --base <default-branch> --head <branch-name> --title "<summary>" --body "<what changed and why>"
```

Report the branch name (and PR link if opened) back to the user.

**Kodion task:** if the push succeeded, send `push`.

## Step 8 — STOP. Ask for confirmation.

Show a short summary — branch name, commit(s), files changed (`git diff <default-branch>...<branch-name> --stat`)
— and explicitly ask whether to merge into `<default-branch>` now. Do not proceed past this
point without an explicit yes in this conversation. If the user isn't around or doesn't answer,
leave it pushed on the branch and stop here — that's a fully valid place to end the skill.

## Step 9 — Merge into the default branch

Only after confirmation:

```bash
git fetch origin
git checkout <default-branch>
git pull origin <default-branch>
git merge --no-ff <branch-name>
```

If this merge conflicts (someone else pushed to `<default-branch>` since Step 2), resolve using
the steps below, then:

```bash
git push origin <default-branch>
```

If you went the PR route in Step 7 instead, merge via `gh pr merge <number> --merge` (or
whatever merge strategy the repo/user prefers) rather than merging locally, so GitHub's PR
record stays accurate. Then `git checkout <default-branch>` and `git pull origin <default-branch>`.

**Kodion task:** once the merge is on `origin/<default-branch>`, send `pr_merge`. Then confirm
`git branch --show-current` shows `<default-branch>` and send `back_to_main`.

## Step 9b — Run the project's checks once

The small-spec plan ran only the tests covering what changed (`.claude/rules/plan-mode.md`), so
this is where the full suite runs — **once**, on the merged result.

1. Find the project's own checks from its config and scripts (lint, type check, build, tests). If
   there are none, say so and skip.
2. Run them. Claude Code will ask permission for the project's own commands (they aren't in this skill's `allowed-tools` on purpose — they differ per project); tell the developer to approve. Read `.claude/rules/known-failures.md` if it exists: a failure listed there is
   expected, so report it as "same as the known-failures list" and don't investigate it.
3. **A failure that isn't listed is real.** Say so plainly. The merge has already happened, so
   don't hide it — report it and offer to open a follow-up task.
4. Skip this on a full spec: the full suite already ran before and after in plan mode.

## Step 10 — Clean up

Once merged and pushed, the feature branch has served its purpose:

```bash
git branch -d <branch-name>
git push origin --delete <branch-name>
```

**The task's screenshots.** Once the merge is on `origin`, the downloaded copies in
`.claude/attachments/` have done their job: the images are still on the Task Board, and the spec
records what each one showed. Delete this task's files only — `.claude/attachments/<ID>.*` and
`.claude/attachments/<ID>-*.*`, nothing else — and say in one line that you did. Keep
`.claude/tasks/<ID>/` (a few KB of text) as the record. Skip this if the merge didn't happen.

Only delete the remote branch if you're confident the merge actually landed on `origin/<default-branch>`
(re-check `git log origin/<default-branch> -1` if unsure). Skip cleanup entirely if the user
wants to keep the branch around.

**Kodion task:** if the branch was deleted, send `delete_branch`. Then run the `--retry` once
(see *Timesheet logs*).

## Step 11 — Task feedback (Kodion tasks only)

The last thing `/ship` does: after the merge (Step 9), the clean-up (Step 10) and the workflow log (Step 12). Never run it on a project with no git — nothing was shipped.

1. **Is this a Kodion task?** Use the `<ID>` you found in *Timesheet logs* (in git mode, note it
   before Step 10 deletes the branch). Glob `.claude/tasks/<ID>/task.json` and
   `.claude/skills/task-feedback/SKILL.md`. If either is missing, or there is no `<ID>`,
   **skip this step silently** — say nothing about feedback.
2. **Run it:** `Skill({ skill: "task-feedback", args: "<ID>" })`. It reviews the session, shows the
   report, and itself asks the developer **Submit / Add rating and comment / Don't submit** —
   nothing is sent without their Submit, so don't ask a second "run feedback?" question here.
3. **It never undoes or blocks the ship.** The merge is already done. If the feedback skill fails
   or the developer picks Don't submit, end with one line: *"Feedback kept locally — run
   `/task-feedback <ID>` to send it later."*

**If the developer said no to the merge in Step 8**, don't run feedback — the task isn't finished.
End with one line instead: *"When this is merged, run `/task-feedback <ID>` to review the session."*
Only `commit` and `push` are logged in that case; `pr_merge`, `back_to_main` and `delete_branch` get ticked when you run `/ship` again to merge.

---

## Step 12 — Show the workflow log (always)

Print this as part of the final summary, right before Step 11 (task feedback) runs. It runs whether or not the project is on git.

The developer should not have to open the Task Board to see what was ticked. Read
`.claude/tasks/<ID>/log.jsonl` and print the whole task's workflow in one block — all 16 steps,
in order, so a missing one is obvious:

```
Workflow log · task #325
  Setup     start_session ✅ · pull_latest ✅ · create_branch ✅
  Spec      rename_session ✅ · write_spec ✅ · save_spec ✅✅ · review_spec ✅
  Build     plan ✅ · implement ✅ · validate ✅ · iterate —
  Ship      commit ✅ · push ✅ · pr_merge ✅ · back_to_main ✅ · delete_branch ✅
```

On a project with no git, the same block shows why the git steps aren't ticked:

```
Workflow log · task #325 · no git set up
  Setup     start_session ✅ · pull_latest ⊘ · create_branch ⊘
  Spec      rename_session ✅ · write_spec ✅ · save_spec ✅ · review_spec ✅
  Build     plan ✅ · implement ✅ · validate ✅ · iterate ✅
  Ship      commit ⊘ · push ⊘ · pr_merge ⊘ · back_to_main ⊘ · delete_branch ⊘
  ⊘ = not ticked: no git set up
```

- Take the **newest line for each step**; a `"skipped"` line followed by a posted one means the
  step happened later, and the posted line wins.
- `✅` = a line with `"posted":true`. Repeat the tick once per posted line (`save_spec ✅✅` after
  one revision), because that's what the board counts.
- `⊘` = the newest line has `"skipped"`. Print the reason once under the block, not per step.
- `❌ <reason>` = the newest line has `"posted":false` with an `"error"` and no later posted line.
- `—` = the step never happened and no reason was recorded. That's normal for `iterate`, and for
  `rename_session` on a manual task.
- **Not a Kodion task, or no `log.jsonl`:** skip this step and print nothing about logging.
- **Count what you actually printed**, don't state a total from memory: `<n> ticked · <n> not ticked (no git) · <n> not reached`. `iterate` is often `—`, so the total is rarely the same twice.
- If any step shows `❌`, add one line under the block (a `⊘` is not a failure and needs no retry):
  *"To send the missing ones: `bash .claude/skills/start-task/scripts/log-step.sh <ID> --retry`"*
- Don't read or print the key, and don't call the timesheet API to check. `log.jsonl` is the
  record.

---

# No git? `/ship` has nothing to do

Reached from Step 0 when `git rev-parse` fails. There is no branch, no remote and no history, so
there is nothing to commit, push or merge — and **nothing is logged.** Don't invent a meaning for
a Ship step, don't copy files around, and don't run `git init`.

1. **Record why the Ship steps aren't ticked**, so the reason survives the session. Only for a
   Kodion task (see *Timesheet logs* for how `<ID>` is found; with no branch name, `/ship <ID>` or
   the single `"in_progress"` task). Five calls, each posting nothing:
   ```bash
   bash .claude/skills/start-task/scripts/log-step.sh <ID> commit --skip "no git set up, nothing to commit"
   ```
   ```bash
   bash .claude/skills/start-task/scripts/log-step.sh <ID> push --skip "no git set up, no remote"
   ```
   ```bash
   bash .claude/skills/start-task/scripts/log-step.sh <ID> pr_merge --skip "no git set up, nothing to merge"
   ```
   ```bash
   bash .claude/skills/start-task/scripts/log-step.sh <ID> back_to_main --skip "no git set up, no branches"
   ```
   ```bash
   bash .claude/skills/start-task/scripts/log-step.sh <ID> delete_branch --skip "no git set up, no branch"
   ```
   Run each once. If `log.jsonl` already has a `"skipped"` line for a step, don't add another.
   Not a Kodion task → skip this and say nothing about logging.

2. **Stop and say so:**

```
/ship stopped — this project isn't on git.

There's no branch, no remote and no history, so there's nothing to commit, push or merge.
Ship steps not ticked: commit · push · pr_merge · back_to_main · delete_branch
Reason saved against the task: no git set up.

To ship properly:
  1. git init
  2. git add -A  and  git commit -m "first commit"   (check .gitignore first)
  3. /start-task <ID>        — creates the branch and ticks pull_latest · create_branch
  4. /ship                   — then works normally

Your work is untouched. Nothing was copied, moved or deleted.
```

3. **Then print the workflow log** (Step 12), so the developer sees which steps are ticked and
   which aren't, with the reason. Count the lines you print — don't claim a total. **Don't run Step 11** (task feedback) — the task isn't
   shipped.

4. **One offer, one line, nothing logged.** If the developer is about to hand this work over by
   hand, a leaked key is the real risk, so you may add exactly one line:
   *"Handing this over as files? Say so and I'll check the changed files for keys and passwords
   first."* If they say yes, run the Step 6 security check over the changed files — report what you
   find, tick nothing, and don't copy or move anything.

Never suggest `git init` more than once in a session, and never run it yourself.

---

## Resolving conflicts (used in Steps 2 and 9)

1. `git status` to list conflicted files.
2. Open each one. Understand *both* sides' intent before touching anything — `git log --oneline -3 <default-branch>`
   and `git log --oneline -3 <branch-name>` for context if the conflicting hunks aren't
   self-explanatory.
3. Resolve by combining both changes where that's what the code actually needs (e.g. two
   unrelated additions to the same file) — don't reflexively take "ours" or "theirs" for the
   whole file. `git checkout --ours <file>` / `--theirs <file>` is fine only for genuinely
   trivial cases (a lock file, a generated asset) where you've confirmed regenerating or picking
   one side loses nothing.
4. **If a conflict touches actual business logic and the right resolution isn't clear, stop and
   ask the user** rather than guessing which side should win. This is the one place in the skill
   where pausing mid-flow is expected and correct.
5. Remove all conflict markers, then `git add <file>` for each resolved file.
6. Continue the merge (`git commit` if `git pull`/`git merge` left one pending — it usually
   pre-fills a merge commit message, which is fine to keep).
7. Never `git merge --abort` and silently give up — if you abort, tell the user exactly why and
   what's still unresolved.
