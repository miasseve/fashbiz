#!/usr/bin/env bash
# Kodion task feedback: count what actually happened in this task's Claude Code session(s).
#
# Usage:   bash .claude/skills/task-feedback/scripts/collect-metrics.sh <task_number> [branch]
# Reads:   .claude/tasks/<ID>/task.json (branch, base), .claude/tasks/<ID>/log.jsonl (step counts)
#          and the session transcripts: ~/.claude/projects/<project-slug>/*.jsonl
#          (override the folder with TF_TRANSCRIPT_DIR=<dir>)
# Writes:  .claude/tasks/<ID>/feedback-work/{prompts,questions,checks,failed,edits}.tsv
#          These stay on this machine. They are for Claude to read, never sent anywhere.
# Prints:  one JSON object of counts on stdout (ends with a line "OK collected").
#
# Works in any project (Node, React, Next.js, PHP, Laravel, ColdFusion, ...): it reads only
# Claude's own transcript and the task files, never the project's code. Needs bash + awk + grep.
# Add project-specific check commands with TF_CHECK_PATTERNS='regex|regex' (matched lowercase).
#
# Exit codes: 0 ok · 2 bad input · 3 no task file · 4 no transcript found · 5 transcript could not be parsed

set -u

ID="${1:-}"
ID="${ID#\#}"
case "$ID" in
  ''|*[!0-9]*) echo "ERROR BAD_INPUT: task number must be digits only, got '$ID'. Usage: collect-metrics.sh <task_number>"; exit 2 ;;
esac

DIR=".claude/tasks/$ID"
TASK="$DIR/task.json"
if [ ! -f "$TASK" ]; then
  echo "ERROR NO_TASK: $TASK not found. Run this from the project root, after /start-task $ID."
  exit 3
fi

json_field() {  # $1 field name -> first string value in task.json (task.json may be multi-line)
  sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$TASK" | head -n 1
}

BRANCH="${2:-$(json_field branch)}"
[ -z "$BRANCH" ] && BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$BRANCH" ]; then
  echo "ERROR BAD_INPUT: no branch in $TASK and not on a git branch."
  exit 2
fi
BASE="$(json_field base)"; [ -z "$BASE" ] && BASE=main

# ---------- find the transcript folder ----------
# Claude Code stores each project's sessions in ~/.claude/projects/<cwd with every
# non-alphanumeric character turned into "-">. Drive-letter case differs between tools,
# so compare lowercase. If that folder doesn't hold this branch, search every project folder.
PROJECTS="$HOME/.claude/projects"
TDIR="${TF_TRANSCRIPT_DIR:-}"
if [ -z "$TDIR" ]; then
  CWD=$(pwd -W 2>/dev/null || pwd)
  SLUG=$(printf '%s' "$CWD" | sed 's/[^A-Za-z0-9]/-/g' | tr 'A-Z' 'a-z')
  for d in "$PROJECTS"/*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d" | tr 'A-Z' 'a-z')
    if [ "$name" = "$SLUG" ]; then TDIR="${d%/}"; break; fi
  done
fi

NEEDLE="\"gitBranch\":\"$BRANCH\""
FILES=""
if [ -n "$TDIR" ] && [ -d "$TDIR" ]; then
  FILES=$(cd "$TDIR" && ls -tr -- *.jsonl 2>/dev/null | while IFS= read -r f; do
    grep -qF -- "$NEEDLE" "$f" && printf '%s\n' "$TDIR/$f"
  done)
fi
if [ -z "$FILES" ] && [ -d "$PROJECTS" ]; then
  FILES=$(ls -tr -- "$PROJECTS"/*/*.jsonl 2>/dev/null | while IFS= read -r f; do
    grep -qF -- "$NEEDLE" "$f" && printf '%s\n' "$f"
  done)
fi
if [ -z "$FILES" ]; then
  echo "ERROR NO_TRANSCRIPT: no Claude Code session found for branch '$BRANCH'. The report can still use the spec, plan, git diff and log.jsonl."
  exit 4
fi
NFILES=$(printf '%s\n' "$FILES" | grep -c .)

WORK="$DIR/feedback-work"
mkdir -p "$WORK"
: > "$WORK/prompts.tsv"; : > "$WORK/questions.tsv"; : > "$WORK/checks.tsv"; : > "$WORK/failed.tsv"; : > "$WORK/edits.tsv"

# ---------- workflow step counts from log.jsonl ----------
LOG="$DIR/log.jsonl"
step_count() { if [ -f "$LOG" ]; then grep -c "\"step\":\"$1\"" "$LOG"; else echo 0; fi; }

# ---------- one pass over the transcript(s) ----------
# Phases: spec -> plan -> implement -> ship. Moves forward only.
#   plan:      EnterPlanMode, or plan permission mode once the spec step is over
#   implement: plan approved ("User has approved your plan"), or the first edit outside .claude/
#   ship:      /ship typed, or the ship skill invoked
# Window: from the first record on the task branch, through any records on the base branch
# (the merge back to main happens there), until a record on a different branch appears,
# which means the next task started in the same session.
printf '%s\n' "$FILES" | while IFS= read -r f; do cat -- "$f"; printf '\n'; done | awk \
  -v BR="$BRANCH" -v BASE="$BASE" -v W="$WORK" -v EXTRA="${TF_CHECK_PATTERNS:-}" -v NF_="$NFILES" '
function sval(s, key,   re, v) {   # first JSON string value of "key" in s (still JSON-escaped)
  re = "\"" key "\":\"([^\"\\\\]|\\\\.)*\""
  if (!match(s, re)) return ""
  v = substr(s, RSTART + length(key) + 4, RLENGTH - length(key) - 5)
  return v
}
function clean(t, n) { gsub(/\\[nrt]/, " ", t); gsub(/\t/, " ", t); gsub(/  +/, " ", t); if (length(t) > n) t = substr(t, 1, n) "..."; return t }
function is_check(c,   l) {
  l = tolower(c)
  if (l ~ /(npm|yarn|pnpm|bun) (run )?(test|lint|build|typecheck|type-check|check)/) return 1
  if (l ~ /phpunit|pest( |$)|artisan test|php -l|phpstan|psalm|pint( |$)|phpcs/) return 1
  if (l ~ /pytest|jest|vitest|mocha|karma|cypress run|playwright test|npx (tsc|eslint|jest|vitest|next build)|(^|[ ;&])tsc( |$)|eslint|prettier --check|next (build|lint)/) return 1
  if (l ~ /go (test|vet|build)|cargo (test|check|build|clippy)|mvn |gradle|dotnet (test|build)|rspec|rubocop|flake8|ruff|mypy|testbox|compilestring/) return 1
  if (EXTRA != "" && l ~ EXTRA) return 1
  return 0
}
function to_min(ts,   y, mo, d, h, mi, a, m2, yy, days) {   # ISO "2026-10-16T11:25:28.840Z" -> minutes
  y = substr(ts,1,4)+0; mo = substr(ts,6,2)+0; d = substr(ts,9,2)+0; h = substr(ts,12,2)+0; mi = substr(ts,15,2)+0
  a = (mo <= 2) ? 1 : 0; yy = y - a; m2 = mo + 12*a - 3
  days = 365*yy + int(yy/4) - int(yy/100) + int(yy/400) + int((153*m2 + 2)/5) + d
  return days*1440 + h*60 + mi
}
function setphase(p) {
  if (p == "plan" && phase == "spec") phase = "plan"
  else if (p == "implement" && (phase == "spec" || phase == "plan")) phase = "implement"
  else if (p == "ship" && phase != "ship") phase = "ship"
}
BEGIN { phase = "spec"; total = 0 }
{
  br = sval($0, "gitBranch")
  if (br == "") next
  if (br == BR) inside = 1
  else if (!inside || br != BASE) { inside = 0; next }
  if (index($0, "\"isSidechain\":true")) next
  recs++
  ts = sval($0, "timestamp"); if (ts != "") { if (first == "") first = ts; last = ts }

  isAsst = index($0, "\"role\":\"assistant\"") > 0
  isUser = !isAsst && index($0, "\"type\":\"user\"") > 0

  if (isUser && index($0, "\"permissionMode\":\"plan\"") && (!sawSpecCmd || sawReview)) setphase("plan")

  if (isAsst) {
    s = $0
    while (match(s, /"type":"tool_use","id":"[^"]*","name":"[^"]*"/)) {
      blk = substr(s, RSTART, RLENGTH); s = substr(s, RSTART + RLENGTH)
      id = blk; sub(/^"type":"tool_use","id":"/, "", id); sub(/".*$/, "", id)
      nm = blk; sub(/^.*"name":"/, "", nm); sub(/"$/, "", nm)
      inp = s; nx = index(inp, "\"type\":\"tool_use\""); if (nx > 0) inp = substr(inp, 1, nx - 1)
      if (useSeen[id]++) continue   # the same tool call can be repeated in a later record
      tname[id] = nm
      if (nm == "EnterPlanMode") setphase("plan")
      else if (nm == "ExitPlanMode") planCalls++
      else if (nm == "Skill") {
        if (inp ~ /"skill":"ship"/) setphase("ship")
        if (inp ~ /"skill":"kodion-create-spec"/) sawSpecCmd = 1
      }
      else if (nm == "Bash" || nm == "PowerShell") {
        c = sval(inp, "command"); tcmd[id] = c
        if (c ~ /log-step\.sh/ && c ~ /review_spec/) sawReview = 1
        if (is_check(c)) tcheck[id] = 1
      }
      else if (nm == "Edit" || nm == "Write" || nm == "MultiEdit" || nm == "NotebookEdit") {
        fp = sval(inp, "file_path"); if (fp == "") fp = sval(inp, "notebook_path")
        tfile[id] = fp
        if (fp != "" && fp !~ /\.claude/) setphase("implement")
      }
      else if (nm == "AskUserQuestion") {
        asks[phase]++; askTotal++
        q = inp
        while (match(q, /"question":"([^"\\]|\\.)*"/)) {
          qt = substr(q, RSTART + 12, RLENGTH - 13); q = substr(q, RSTART + RLENGTH)
          if (!qSeen[id SUBSEP qt]++) print phase "\t" clean(qt, 200) > (W "/questions.tsv")
        }
      }
      tphase[id] = phase
    }
    next
  }

  if (!isUser) next

  if (index($0, "\"tool_use_id\":\"")) {
    # Match the exact result fields, never the phrase anywhere: a Write or Read result
    # carries file text, which can quote these phrases (this script does).
    rejected = index($0, "\"toolUseResult\":\"User rejected tool use\"") ? 1 : 0
    err = index($0, "\"is_error\":true") ? 1 : 0
    if (index($0, "\"type\":\"tool_result\",\"content\":\"User has approved your plan")) { planApproved = 1; setphase("implement") }
    s = $0
    while (match(s, /"tool_use_id":"[^"]*"/)) {
      id = substr(s, RSTART + 15, RLENGTH - 16); s = substr(s, RSTART + RLENGTH)
      if (seen[id]++) continue
      nm = tname[id]; ph = (id in tphase) ? tphase[id] : phase
      if (rejected) {
        rej[ph]++
        if (nm == "ExitPlanMode") planRejected++
        if (nm == "Edit" || nm == "Write" || nm == "MultiEdit") rejEdits[ph]++
        continue
      }
      if (nm == "Bash" || nm == "PowerShell") {
        c = tcmd[id]
        if (err) { failed[ph]++; print ph "\t" clean(c, 160) > (W "/failed.tsv"); if (ph == "implement") failSeen = 1 }
        if (tcheck[id]) {
          st = err ? "FAIL" : "PASS"
          checkRuns++; if (err) checkFails++
          if (firstCheck == "") firstCheck = st
          k = clean(c, 80)
          if (lastSt[k] == "FAIL" && st == "PASS") fixCycles++
          lastSt[k] = st
          print ph "\t" st "\t" clean(c, 160) > (W "/checks.tsv")
        }
      }
      else if ((nm == "Edit" || nm == "Write" || nm == "MultiEdit" || nm == "NotebookEdit") && !err) {
        fp = tfile[id]; edits[ph]++
        if (ph == "implement") {
          if (failSeen && edited[fp]) reEdit[fp] = 1
          if (!edited[fp]) filesEdited++
          edited[fp] = 1
        }
        print ph "\t" fp > (W "/edits.tsv")
      }
    }
    next
  }

  if (index($0, "Request interrupted by user")) { intr[phase]++; next }
  if (!index($0, "\"origin\":{\"kind\":\"human\"") || index($0, "\"isMeta\":true")) next

  if (index($0, "<command-name>")) {
    cn = $0; sub(/^.*<command-name>/, "", cn); sub(/<\/command-name>.*$/, "", cn)
    if (cn == "/ship") setphase("ship")
    if (cn == "/kodion-create-spec") sawSpecCmd = 1
    cmds = cmds (cmds == "" ? "" : ",") "\"" cn "\""
    next
  }

  # A real prompt typed by the developer. Join its text blocks, skipping IDE/system wrappers.
  t = ""; s = $0
  while (match(s, /"text":"([^"\\]|\\.)*"/)) {
    b = substr(s, RSTART + 8, RLENGTH - 9); s = substr(s, RSTART + RLENGTH)
    if (b ~ /^<(ide_|system-reminder|command-)/ || b ~ /^Base directory for this skill/) continue
    t = t (t == "" ? "" : " | ") b
  }
  if (t == "") t = sval($0, "content")
  if (t == "") next   # only wrappers (skill text, IDE notices): not something the developer typed
  prompts[phase]++; total++
  print phase "\t" ts "\t" clean(t, 300) > (W "/prompts.tsv")
}
END {
  nre = 0; for (k in reEdit) nre++
  unresolved = 0; for (k in lastSt) if (lastSt[k] == "FAIL") unresolved++
  dur = (first != "" && last != "") ? to_min(last) - to_min(first) : 0
  printf "{\"transcript_files\":%d,\"records\":%d,\"first_at\":\"%s\",\"last_at\":\"%s\",\"duration_minutes\":%d,", NF_, recs, first, last, dur
  printf "\"phases_seen\":{\"plan_approved\":%s,\"ship_reached\":%s},", (planApproved ? "true" : "false"), (phase == "ship" ? "true" : "false")
  printf "\"human_prompts\":{\"total\":%d,\"spec\":%d,\"plan\":%d,\"implement\":%d,\"ship\":%d},", total, prompts["spec"], prompts["plan"], prompts["implement"], prompts["ship"]
  printf "\"slash_commands\":[%s],", cmds
  printf "\"questions\":{\"total\":%d,\"spec\":%d,\"plan\":%d,\"implement\":%d,\"ship\":%d},", askTotal, asks["spec"], asks["plan"], asks["implement"], asks["ship"]
  printf "\"plan_mode\":{\"exit_plan_calls\":%d,\"rejected\":%d},", planCalls, planRejected
  printf "\"interrupts\":{\"spec\":%d,\"plan\":%d,\"implement\":%d,\"ship\":%d},", intr["spec"], intr["plan"], intr["implement"], intr["ship"]
  printf "\"rejected_tool_calls\":{\"spec\":%d,\"plan\":%d,\"implement\":%d,\"ship\":%d},", rej["spec"], rej["plan"], rej["implement"], rej["ship"]
  printf "\"rejected_edits\":{\"implement\":%d},", rejEdits["implement"]
  printf "\"failed_commands\":{\"spec\":%d,\"plan\":%d,\"implement\":%d,\"ship\":%d},", failed["spec"], failed["plan"], failed["implement"], failed["ship"]
  printf "\"edits\":{\"implement\":%d,\"files_edited\":%d,\"re_edited_after_failure\":%d},", edits["implement"], filesEdited, nre
  printf "\"checks\":{\"runs\":%d,\"failed_runs\":%d,\"fix_cycles\":%d,\"first_status\":\"%s\",\"unresolved\":%d}", checkRuns, checkFails, fixCycles, firstCheck, unresolved
}' > "$WORK/metrics.part"
if [ $? -ne 0 ] || [ ! -s "$WORK/metrics.part" ]; then
  echo "ERROR PARSE: could not read the transcript. The report can still use the spec, plan, git diff and log.jsonl."
  exit 5
fi

printf '{"task_id":%s,"branch":"%s","base":"%s",' "$ID" "$BRANCH" "$BASE"
printf '"workflow_log":{"save_spec":%s,"review_spec":%s,"plan":%s,"implement":%s,"validate":%s,"iterate":%s},' \
  "$(step_count save_spec)" "$(step_count review_spec)" "$(step_count plan)" "$(step_count implement)" "$(step_count validate)" "$(step_count iterate)"
printf '"session":'
cat "$WORK/metrics.part"
printf ',"work_files":"%s"}\n' "$WORK"
rm -f "$WORK/metrics.part"
echo "OK collected"
