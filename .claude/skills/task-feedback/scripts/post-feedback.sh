#!/usr/bin/env bash
# Kodion task feedback: send .claude/tasks/<ID>/feedback.json to the timesheet, once the
# developer has said "Submit". Running it again resends the current file.
#
# Usage:   bash .claude/skills/task-feedback/scripts/post-feedback.sh <task_number>
#          bash .claude/skills/task-feedback/scripts/post-feedback.sh <task_number> --check
#          (--check: size and secret scan only, nothing is sent)
# API:     POST https://timesheetv2.kodionsoftwares.com/api/dev-workflow/tasks/<task_number>/feedback
#          body = feedback.json as-is
# Local:   writes .claude/tasks/<task_number>/feedback.status.json (posted true/false). The key is never printed.
#
# Key lookup is the same as start-task's fetch-task.sh / log-step.sh.
# Exit codes: 0 ok · 2 bad input · 3 no key · 4 network · 5 401 · 6 404 · 7 429 · 8 other (incl. 422) · 9 blocked by scan

set -u

ID="${1:-}"
ID="${ID#\#}"
MODE="${2:-}"
case "$ID" in
  ''|*[!0-9]*) echo "ERROR BAD_INPUT: task number must be digits only, got '$ID'. Usage: post-feedback.sh <task_number> [--check]"; exit 2 ;;
esac

DIR=".claude/tasks/$ID"
FILE="$DIR/feedback.json"
STATUS="$DIR/feedback.status.json"
if [ ! -f "$FILE" ]; then echo "ERROR BAD_INPUT: $FILE not found. Run /task-feedback $ID first."; exit 2; fi

NOW=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)
status() {  # $1 posted  $2 http code  $3 error or empty
  printf '{"posted":%s,"at":"%s","http":"%s","error":"%s"}\n' "$1" "$NOW" "$2" "$3" > "$STATUS"
}

# ---------- checks that run before anything leaves the machine ----------
SIZE=$(wc -c < "$FILE" | tr -d ' ')
if [ "$SIZE" -gt 20000 ]; then
  echo "ERROR BAD_INPUT: feedback.json is $SIZE bytes; the limit is 20000. Shorten the notes and lists."; exit 2
fi
FIRST=$(tr -d ' \r\n\t' < "$FILE" | cut -c1)
LASTC=$(tr -d ' \r\n\t' < "$FILE" | tail -c 1)
if [ "$FIRST" != "{" ] || [ "$LASTC" != "}" ]; then
  echo "ERROR BAD_INPUT: feedback.json is not a JSON object."; exit 2
fi

KEY="${KODION_KEY:-}"
if [ -z "$KEY" ]; then
  for f in "$HOME/.claude/hooks/kodion-workflow.sh" "$HOME/.claude/hooks/kodion-workflow-hook.sh"; do
    if [ -f "$f" ]; then
      KEY=$(sed -n "s/^KODION_KEY='\([^']*\)'.*$/\1/p" "$f" | head -n 1)
      [ -n "$KEY" ] && break
    fi
  done
fi

# Secret shapes that must never reach the server. The feedback is Claude-written prose and
# counts, so any hit here is a mistake to fix in the file, not something to send anyway.
if grep -nEq 'kdw_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}|(password|passwd|secret|api[_-]?key|token)"?[[:space:]]*[:=][[:space:]]*"?[A-Za-z0-9_\-\.\/+]{12,}' "$FILE" \
  || { [ -n "$KEY" ] && grep -qF -- "$KEY" "$FILE"; }; then
  echo "ERROR BLOCKED: feedback.json contains something that looks like a secret (key, token, password value). Remove it from the file, then run this again. Nothing was sent."
  exit 9
fi

if [ "$MODE" = "--check" ]; then echo "OK check passed ($SIZE bytes), nothing sent"; exit 0; fi

API_DEFAULT="https://timesheetv2.kodionsoftwares.com/api/dev-workflow/tasks"
API="${KODION_API_URL:-$API_DEFAULT}"
case "$API" in
  https://timesheetv2.kodionsoftwares.com/*|http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "ERROR BAD_INPUT: KODION_API_URL must point to https://timesheetv2.kodionsoftwares.com"; exit 2 ;;
esac

case "$KEY" in
  ''|*PASTE_YOUR_KEY_HERE*|kdw_xxx*)
    status false "" "NO_KEY"
    echo "ERROR NO_KEY: no Kodion key found, so the feedback was kept locally only. Set it up as described in /start-task, then run /task-feedback $ID again."
    exit 3 ;;
esac
if ! command -v curl >/dev/null 2>&1; then
  status false "" "NETWORK"; echo "ERROR NETWORK: curl is not installed. The feedback was kept locally only."; exit 4
fi

TMP="$DIR/.feedback.tmp"
CODE=$(printf 'Authorization: Bearer %s\n' "$KEY" | curl -sS -o "$TMP" -w "%{http_code}" --max-time 30 \
  -X POST \
  -H @- \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data-binary "@$FILE" \
  "$API/$ID/feedback" 2>/dev/null)
CURL_EXIT=$?
BODY=$(cat "$TMP" 2>/dev/null)
rm -f "$TMP"
SHORT=$(printf '%s' "$BODY" | tr -d '\r\n' | cut -c1-200)

if [ $CURL_EXIT -ne 0 ] || [ -z "$CODE" ] || [ "$CODE" = "000" ]; then
  status false "" "NETWORK"; echo "ERROR NETWORK: could not reach the timesheet API. The feedback was kept locally; run /task-feedback $ID later to send it."; exit 4
fi

case "$CODE" in
  200|201)
    if printf '%s' "$BODY" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
      status true "$CODE" ""
      echo "OK feedback saved on task #$ID"
      exit 0
    fi
    status false "$CODE" "OTHER"; echo "ERROR OTHER: the API answered but didn't confirm. Reply (first 200 characters): $SHORT"; exit 8 ;;
  401) status false 401 "401"; echo "ERROR 401: invalid or missing workflow key. Use your newest key."; exit 5 ;;
  404) status false 404 "404"; echo "ERROR 404: task #$ID isn't picked up by you, or the timesheet doesn't have the feedback endpoint yet. The feedback was kept locally."; exit 6 ;;
  429) status false 429 "429"; echo "ERROR 429: too many requests. Run /task-feedback $ID again in a minute."; exit 7 ;;
  422) status false 422 "422"; echo "ERROR 422: the timesheet refused the feedback: $SHORT"; exit 8 ;;
  *)   status false "$CODE" "HTTP_$CODE"; echo "ERROR OTHER: the timesheet API returned HTTP $CODE. Reply (first 200 characters): $SHORT"; exit 8 ;;
esac
