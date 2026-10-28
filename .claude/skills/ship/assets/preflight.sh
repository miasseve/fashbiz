#!/usr/bin/env bash
# One-shot summary of repo state before a /ship run.
# Usage: bash <skill-dir>/assets/preflight.sh
set -uo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "NOT_A_GIT_REPO"
  exit 1
fi

current_branch=$(git branch --show-current)
echo "== Current branch =="
echo "${current_branch:-(detached HEAD)}"
echo

echo "== Default branch (origin) =="
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$default_branch" ]; then
  # No cached symref (e.g. never fetched) — fall back to whichever of main/master exists.
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    default_branch="main"
  elif git show-ref --verify --quiet refs/remotes/origin/master; then
    default_branch="master"
  else
    default_branch="main"
  fi
fi
echo "$default_branch"
echo

echo "== Working tree status (porcelain) =="
git status --porcelain=v1
echo

echo "== Staged vs unstaged summary =="
git diff --stat
echo "--- staged ---"
git diff --cached --stat
echo

upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)
if [ -n "$upstream" ]; then
  echo "== Ahead/behind vs $upstream =="
  git rev-list --left-right --count "$upstream...HEAD" | awk '{print "behind="$1, "ahead="$2}'
  echo
  echo "== Unpushed commits on current branch =="
  git log "$upstream"..HEAD --oneline
else
  echo "== No upstream tracking branch set for '$current_branch' =="
fi
echo

echo "== origin/$default_branch vs local $default_branch (if checked out elsewhere) =="
git fetch origin "$default_branch" --quiet 2>/dev/null
if git show-ref --verify --quiet "refs/heads/$default_branch"; then
  git rev-list --left-right --count "origin/$default_branch...$default_branch" 2>/dev/null | awk '{print "origin ahead="$1, "local ahead="$2}'
else
  echo "(no local branch named $default_branch)"
fi
echo

echo "== Local branches =="
git branch -vv

echo
echo "== Recent commits on $default_branch (last 5) =="
git log "origin/$default_branch" --oneline -5 2>/dev/null
