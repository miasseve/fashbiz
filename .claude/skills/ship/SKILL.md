---
name: ship
description: Commit and push the current changes to git. Use when the user types /ship or asks to "ship this", "push the code", "send this to git".
---

# /ship — commit and push current changes

Invoking this skill is the user's explicit, standing authorization to commit and push whatever changes are currently in the working tree at the time it's run. Do not ask "should I push?" — that's what `/ship` means. Do still surface anything unusual you find (see step 2) before acting on it.

## 0. Commit identity

This repo's commit history must show `navtej0110 <singh.navtej8686@gmail.com>` as both author and committer — that's the identity the project has always been pushed under (GitHub displays it as `navtej8686`). Never run `git config` to set this globally or locally (that persists beyond this one commit and is off-limits). Instead, scope it to just the commit command itself:

```
git -c user.name="navtej0110" -c user.email="singh.navtej8686@gmail.com" commit -m "..."
```

If `git log -1 --format='%an <%ae>'` ever shows something other than `navtej0110 <singh.navtej8686@gmail.com>` right after a `/ship` commit, that's a bug in this skill — stop and flag it rather than pushing.

## 1. Gather context (run in parallel)

- `git status`
- `git diff` (unstaged) and `git diff --staged`
- `git log -5 --oneline` (to match commit message style)
- `git branch --show-current` and whether it has an upstream (`git rev-parse --abbrev-ref --symbolic-full-name @{u}` — ok if it errors, means no upstream yet)

If `git status` shows no changes at all, tell the user there's nothing to ship and stop.

## 2. Review before staging

Look at the file list from `git status`. Flag to the user (don't just silently include) if you see:
- `.env`, credentials, keys, or anything that looks like a secret
- Large binaries or files that look accidental (build output, `node_modules`, etc.)
- Anything unexpected given what's been discussed in the conversation

Stage specific files by name (never `git add -A` or `git add .`). If everything shown looks like legitimate project work, stage all of it by name.

## 3. Commit

Write a concise 1–2 sentence commit message focused on *why*, matching the style seen in `git log -5`. End it with:

```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

Use the `-c user.name=... -c user.email=...` form from step 0 together with a heredoc for the message (see the Bash tool's git commit instructions) — never `--amend`, never `--no-verify`.

If a pre-commit hook fails: fix the underlying issue, re-stage, and make a **new** commit — do not bypass the hook.

## 4. Push

Push the current branch to its remote.

- If there's an existing upstream, `git push`.
- If there's no upstream yet, `git push -u origin <branch>`.
- If the push is rejected because the remote has moved on (non-fast-forward), **do not force push**. Report this to the user and ask how they want to reconcile it (e.g. `git pull --rebase` first) — this is exactly the kind of hard-to-reverse/shared-state situation that needs a human call, not an automatic retry.

## 5. Report back

One or two lines: the commit message used, the branch, and confirmation it's pushed (or, if something went wrong, what happened and what you need from the user to continue).
