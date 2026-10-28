#!/usr/bin/env bash
# Kodion Timesheet: fetch one task from the timesheet API (title, description, and whatever else it sends).
#
# Usage:   bash .claude/skills/start-task/scripts/fetch-task.sh <task_number> [out_dir]
# Output:  saves the API response to <out_dir>/raw.json (default out_dir: .claude/tasks/<task_number>)
#          and prints it. The key is never printed.
#          /start-task then writes task.json and log.jsonl next to it (see .claude/rules/task-workflow.md).
#
# Key lookup (first one found wins):
#   1. KODION_KEY environment variable (from .claude/settings.local.json "env")
#   2. KODION_KEY='kdw_...' line in ~/.claude/hooks/kodion-workflow.sh
#      (or ~/.claude/hooks/kodion-workflow-hook.sh, the downloaded name)
#
# Exit codes: 0 ok · 2 bad input · 3 no key · 4 network · 5 401 · 6 404 · 7 429 · 8 other

set -u

ID="${1:-}"
ID="${ID#\#}"   # allow "#164"
if [ -z "$ID" ]; then
  echo "ERROR BAD_INPUT: no task number given. Usage: fetch-task.sh <task_number>"
  exit 2
fi
case "$ID" in
  *[!0-9]*) echo "ERROR BAD_INPUT: task number must be digits only, got '$ID'"; exit 2 ;;
esac

OUT_DIR="${2:-.claude/tasks/$ID}"
API_DEFAULT="https://timesheetv2.kodionsoftwares.com/api/dev-workflow/tasks"
API="${KODION_API_URL:-$API_DEFAULT}"
# The key may only be sent to the real timesheet, or to a local mock for testing.
case "$API" in
  https://timesheetv2.kodionsoftwares.com/*|http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "ERROR BAD_INPUT: KODION_API_URL must point to https://timesheetv2.kodionsoftwares.com"; exit 2 ;;
esac

KEY="${KODION_KEY:-}"
if [ -z "$KEY" ]; then
  for f in "$HOME/.claude/hooks/kodion-workflow.sh" "$HOME/.claude/hooks/kodion-workflow-hook.sh"; do
    if [ -f "$f" ]; then
      KEY=$(sed -n "s/^KODION_KEY='\([^']*\)'.*$/\1/p" "$f" | head -n 1)
      [ -n "$KEY" ] && break
    fi
  done
fi
case "$KEY" in
  *PASTE_YOUR_KEY_HERE*|kdw_xxx*) echo "ERROR NO_KEY: the key in your settings is still the placeholder. Replace kdw_PASTE_YOUR_KEY_HERE in .claude/settings.local.json with your real key."; exit 3 ;;
esac
if [ -z "$KEY" ]; then
  echo "ERROR NO_KEY: no Kodion key found. Either put it in .claude/settings.local.json (copy .claude/skills/start-task/settings.local.example.json), or save your downloaded hook script as ~/.claude/hooks/kodion-workflow.sh. Get it from Timesheet > Profile > Personal > Automatic workflow tracking."
  exit 3
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR NETWORK: curl is not installed."
  exit 4
fi

mkdir -p "$OUT_DIR"
TMP="$OUT_DIR/.raw.tmp"
# The key goes in through stdin (-H @-), so it never appears on the command line or in process lists.
CODE=$(printf 'Authorization: Bearer %s\n' "$KEY" | curl -sS -o "$TMP" -w "%{http_code}" --max-time 20 \
  -H @- \
  -H "Accept: application/json" \
  "$API/$ID" 2>/dev/null)
CURL_EXIT=$?
if [ $CURL_EXIT -ne 0 ] || [ -z "$CODE" ] || [ "$CODE" = "000" ]; then
  rm -f "$TMP"
  echo "ERROR NETWORK: could not reach the timesheet API. Check your internet connection."
  exit 4
fi

BODY=$(cat "$TMP" 2>/dev/null)
# Short, one-line version of the reply for error messages (a server error page can be very long).
SHORT=$(printf '%s' "$BODY" | tr -d '\r\n' | cut -c1-200)
case "$CODE" in
  200)
    if printf '%s' "$BODY" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
      mv "$TMP" "$OUT_DIR/raw.json"
      echo "OK saved $OUT_DIR/raw.json"
      cat "$OUT_DIR/raw.json"
      echo
      exit 0
    fi
    rm -f "$TMP"; echo "ERROR OTHER: the API answered but didn't return the task. Reply (first 200 characters): $SHORT"; exit 8 ;;
  401) rm -f "$TMP"; echo "ERROR 401: invalid or missing workflow key. If you downloaded the hook script again, the old key stopped working: use the newest file."; exit 5 ;;
  404) rm -f "$TMP"; echo "ERROR 404: task #$ID isn't picked up by you (or the number is wrong / task cancelled). Pick it up on the Task Board first. Use the task number from the card, not the project number from the address bar."; exit 6 ;;
  429) rm -f "$TMP"; echo "ERROR 429: more than 60 requests in a minute. Wait a minute and try again."; exit 7 ;;
  *)   rm -f "$TMP"; echo "ERROR OTHER: the timesheet API returned HTTP $CODE. Reply (first 200 characters): $SHORT"; exit 8 ;;
esac
