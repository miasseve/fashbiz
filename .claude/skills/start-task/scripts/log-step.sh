#!/usr/bin/env bash
# Kodion Timesheet: tell the timesheet one workflow step is done for a task.
#
# Usage:   bash .claude/skills/start-task/scripts/log-step.sh <task_number> <step>
#          bash .claude/skills/start-task/scripts/log-step.sh <task_number> <step> --skip "<reason>"
#          bash .claude/skills/start-task/scripts/log-step.sh <task_number> --retry
#          (resends every line with "posted":false, oldest first, except 404/422, which can't succeed,
#           and except steps already posted later, which are marked "superseded":true instead)
# API:     POST https://timesheetv2.kodionsoftwares.com/api/dev-workflow/tasks/<task_number>/logs  {"step":"<step>"}
# Local:   always adds one line to .claude/tasks/<task_number>/log.jsonl, posted or not,
#          so a failed post can be sent again later. The key is never printed.
#
# --skip:  the step did NOT happen and never will for this task as it stands (e.g. create_branch
#          on a project with no git). Nothing is posted and nothing is sent to the API. One line
#          is written with "skipped":"<reason>" so the reason survives the session, and --retry
#          never resends it. If the step later becomes true (git is set up), just send it normally:
#          the skipped line stays as a record, and readers take the newest line for each step.
#
# Steps (exact names, in flow order):
#   start_session rename_session pull_latest create_branch
#   write_spec review_spec save_spec plan implement validate iterate
#   commit push pr_merge back_to_main delete_branch
#
# Key lookup is the same as fetch-task.sh.
# Exit codes: 0 posted · 2 bad input · 3 no key · 4 network · 5 401 · 6 404 · 7 429 · 8 other (incl. 422)
# A non-zero exit never means the work failed. Callers warn and carry on.

set -u

ID="${1:-}"
ID="${ID#\#}"
STEP="${2:-}"
MODE="${3:-}"
REASON="${4:-}"

case "$ID" in
  ''|*[!0-9]*) echo "ERROR BAD_INPUT: task number must be digits only, got '$ID'. Usage: log-step.sh <task_number> <step>"; exit 2 ;;
esac
case "$STEP" in
  --retry|start_session|rename_session|pull_latest|create_branch|write_spec|review_spec|save_spec|plan|implement|validate|iterate|commit|push|pr_merge|back_to_main|delete_branch) ;;
  *) echo "ERROR BAD_INPUT: unknown step '$STEP'. Use one of: start_session rename_session pull_latest create_branch write_spec review_spec save_spec plan implement validate iterate commit push pr_merge back_to_main delete_branch"; exit 2 ;;
esac

DIR=".claude/tasks/$ID"
LOG="$DIR/log.jsonl"
mkdir -p "$DIR"
NOW=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)

# ---------- --skip: record why a step did not happen. Posts nothing. ----------
if [ "$MODE" = "--skip" ]; then
  if [ "$STEP" = "--retry" ]; then
    echo "ERROR BAD_INPUT: --skip needs a step name, not --retry."; exit 2
  fi
  if [ -z "$REASON" ]; then
    echo "ERROR BAD_INPUT: --skip needs a reason, e.g. log-step.sh $ID create_branch --skip \"no git set up\""; exit 2
  fi
  # Keep the reason on one JSON line: no quotes, backslashes or newlines.
  SAFE=$(printf '%s' "$REASON" | tr -d '"\\' | tr '\n\r\t' '   ' | cut -c1-120)
  printf '{"step":"%s","at":"%s","posted":false,"count":null,"skipped":"%s"}\n' "$STEP" "$NOW" "$SAFE" >> "$LOG"
  echo "OK skipped $STEP for task #$ID — not ticked: $SAFE"
  exit 0
fi
if [ -n "$MODE" ]; then
  echo "ERROR BAD_INPUT: unknown option '$MODE'. Use --skip \"<reason>\", or nothing."; exit 2
fi

log_line() {  # $1 posted(true/false)  $2 count or null  $3 error or empty
  if [ -n "$3" ]; then
    printf '{"step":"%s","at":"%s","posted":%s,"count":%s,"error":"%s"}\n' "$STEP" "$NOW" "$1" "$2" "$3" >> "$LOG"
  else
    printf '{"step":"%s","at":"%s","posted":%s,"count":%s}\n' "$STEP" "$NOW" "$1" "$2" >> "$LOG"
  fi
}

API_DEFAULT="https://timesheetv2.kodionsoftwares.com/api/dev-workflow/tasks"
API="${KODION_API_URL:-$API_DEFAULT}"
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
# ---------- --retry: resend failed lines, keep the file in order ----------
if [ "$STEP" = "--retry" ]; then
  if [ ! -f "$LOG" ] || ! grep '"posted":false' "$LOG" | grep -v '"skipped":' | grep -vq '"superseded":true'; then echo "OK nothing to resend"; exit 0; fi
  case "$KEY" in ''|*PASTE_YOUR_KEY_HERE*|kdw_xxx*) echo "ERROR NO_KEY: no Kodion key found, so nothing was resent."; exit 3 ;; esac
  NEW="$DIR/.log.new"; : > "$NEW"; SENT=0; LEFT=0; STOP=0; LN=0
  while IFS= read -r line || [ -n "$line" ]; do
    LN=$((LN+1))
    if printf '%s' "$line" | grep -q '"posted":false' && ! printf '%s' "$line" | grep -q '"skipped":' && ! printf '%s' "$line" | grep -q '"superseded":true' && ! printf '%s' "$line" | grep -q '"error":"\(404\|422\)"'; then
      s=$(printf '%s' "$line" | sed -n 's/.*"step":"\([a-z_]*\)".*/\1/p')
      at=$(printf '%s' "$line" | sed -n 's/.*"at":"\([^"]*\)".*/\1/p')
      # Already sent later (e.g. by a newer run)? Then resending would only raise the count twice.
      if [ -n "$s" ] && tail -n +"$((LN+1))" "$LOG" | grep -q "\"step\":\"$s\".*\"posted\":true"; then
        printf '%s\n' "$line" | sed 's/}$/,"superseded":true}/' >> "$NEW"
        continue
      fi
      if [ "$STOP" -eq 0 ] && [ -n "$s" ]; then
        TMP="$DIR/.post.tmp"
        CODE=$(printf 'Authorization: Bearer %s\n' "$KEY" | curl -sS -o "$TMP" -w "%{http_code}" --max-time 20 \
          -X POST -H @- -H "Accept: application/json" -H "Content-Type: application/json" \
          -d "{\"step\":\"$s\"}" "$API/$ID/logs" 2>/dev/null)
        BODY=$(cat "$TMP" 2>/dev/null); rm -f "$TMP"
        if { [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; } && printf '%s' "$BODY" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
          COUNT=$(printf '%s' "$BODY" | sed -n 's/.*"count"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p'); [ -z "$COUNT" ] && COUNT=null
          printf '{"step":"%s","at":"%s","posted":true,"count":%s,"resent_at":"%s"}\n' "$s" "$at" "$COUNT" "$NOW" >> "$NEW"
          SENT=$((SENT+1)); continue
        fi
        STOP=1   # network, 401 or 429: stop here and keep the rest in order
      fi
      LEFT=$((LEFT+1))
    fi
    printf '%s\n' "$line" >> "$NEW"
  done < "$LOG"
  mv "$NEW" "$LOG"
  if [ "$LEFT" -eq 0 ]; then echo "OK resent $SENT step(s)"; exit 0; fi
  echo "ERROR resent $SENT step(s), $LEFT still waiting. They'll be tried again on the next run."; exit 4
fi

case "$KEY" in
  ''|*PASTE_YOUR_KEY_HERE*|kdw_xxx*)
    log_line false null "NO_KEY"
    echo "ERROR NO_KEY: no Kodion key found, so '$STEP' was saved locally only. Set it up as described in /start-task, then send it again."
    exit 3 ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  log_line false null "NETWORK"
  echo "ERROR NETWORK: curl is not installed. '$STEP' was saved locally only."
  exit 4
fi

TMP="$DIR/.post.tmp"
CODE=$(printf 'Authorization: Bearer %s\n' "$KEY" | curl -sS -o "$TMP" -w "%{http_code}" --max-time 20 \
  -X POST \
  -H @- \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"step\":\"$STEP\"}" \
  "$API/$ID/logs" 2>/dev/null)
CURL_EXIT=$?
BODY=$(cat "$TMP" 2>/dev/null)
rm -f "$TMP"
SHORT=$(printf '%s' "$BODY" | tr -d '\r\n' | cut -c1-200)

if [ $CURL_EXIT -ne 0 ] || [ -z "$CODE" ] || [ "$CODE" = "000" ]; then
  log_line false null "NETWORK"
  echo "ERROR NETWORK: could not reach the timesheet API. '$STEP' was saved locally only."
  exit 4
fi

case "$CODE" in
  200|201)
    if printf '%s' "$BODY" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
      COUNT=$(printf '%s' "$BODY" | sed -n 's/.*"count"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p')
      [ -z "$COUNT" ] && COUNT=null
      log_line true "$COUNT" ""
      echo "OK posted $STEP for task #$ID (count $COUNT)"
      exit 0
    fi
    log_line false null "OTHER"
    echo "ERROR OTHER: the API answered but didn't confirm '$STEP'. Reply (first 200 characters): $SHORT"; exit 8 ;;
  401) log_line false null "401"; echo "ERROR 401: invalid or missing workflow key. '$STEP' was saved locally only. Use your newest key."; exit 5 ;;
  404) log_line false null "404"; echo "ERROR 404: task #$ID isn't picked up by you (or it was cancelled). '$STEP' was saved locally only. Pick it up on the Task Board."; exit 6 ;;
  429) log_line false null "429"; echo "ERROR 429: more than 60 requests in a minute. '$STEP' was saved locally only. Send it again in a minute."; exit 7 ;;
  422) log_line false null "422"; echo "ERROR 422: the timesheet refused '$STEP': $SHORT"; exit 8 ;;
  *)   log_line false null "HTTP_$CODE"; echo "ERROR OTHER: the timesheet API returned HTTP $CODE for '$STEP'. Reply (first 200 characters): $SHORT"; exit 8 ;;
esac
