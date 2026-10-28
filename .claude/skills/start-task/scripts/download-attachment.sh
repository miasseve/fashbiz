#!/usr/bin/env bash
# Kodion Timesheet: download one task attachment so Claude can open it with the Read tool.
#
# Usage:   bash .claude/skills/start-task/scripts/download-attachment.sh <task_number> <url> [index]
# Saves:   .claude/attachments/<task_number>.<ext>        when index is 1 or missing
#          .claude/attachments/<task_number>-<index>.<ext>  for the 2nd file onwards
#          One flat folder for the whole project, git-ignored. The extension comes from the link.
#
# Safety:
#   - Only URLs under https://timesheetv2.kodionsoftwares.com/assets/ are downloaded (public assets).
#   - The Kodion key is NEVER sent. Public assets don't need it, and it must only go to /api/.
#   - Only png, jpg, jpeg, gif, webp and pdf. Max 15 MB. The file's first bytes must match its type,
#     so an HTML error page saved as .png is rejected.
#   - A file that is already there is not downloaded again.
#
# Output: one line starting with OK, SKIPPED or ERROR.
# Exit codes: 0 ok · 1 skipped · 2 bad input · 4 network · 6 not found · 8 other

set -u

ID="${1:-}"; ID="${ID#\#}"
URL="${2:-}"
INDEX="${3:-1}"
MAX_BYTES=15728640

if [ -z "$ID" ] || [ -z "$URL" ]; then
  echo "ERROR BAD_INPUT: usage: download-attachment.sh <task_number> <url> [index]"; exit 2
fi
case "$INDEX" in
  ''|*[!0-9]*) echo "ERROR BAD_INPUT: index must be a number, got '$INDEX'"; exit 2 ;;
esac
case "$ID" in *[!A-Za-z0-9_-]*) echo "ERROR BAD_INPUT: bad task id '$ID'"; exit 2 ;; esac

# Only the timesheet's public assets (plus a local mock for testing).
case "$URL" in
  https://timesheetv2.kodionsoftwares.com/assets/*) ;;
  http://127.0.0.1:*/assets/*|http://localhost:*/assets/*) ;;
  *) echo "ERROR BAD_INPUT: only https://timesheetv2.kodionsoftwares.com/assets/ links are downloaded, got '$URL'"; exit 2 ;;
esac
case "$URL" in *..*|*' '*) echo "ERROR BAD_INPUT: unsafe link '$URL'"; exit 2 ;; esac

# The extension comes from the link (without ?query); the name is built from the task number.
SRC="${URL##*/}"
SRC="${SRC%%\?*}"
SRC=$(printf '%s' "$SRC" | tr -c 'A-Za-z0-9._-' '_')
case "$SRC" in
  *.*) EXT=$(printf '%s' "${SRC##*.}" | tr 'A-Z' 'a-z') ;;
  *)   echo "SKIPPED UNSUPPORTED: $URL has no file type in its link; ask for a PNG, JPG or PDF"; exit 1 ;;
esac
case "$EXT" in *[!a-z0-9]*|'') echo "ERROR BAD_INPUT: bad file type '.$EXT' in '$URL'"; exit 2 ;; esac

if [ "$INDEX" -le 1 ]; then NAME="$ID.$EXT"; else NAME="$ID-$INDEX.$EXT"; fi
case "$EXT" in
  png|jpg|jpeg|gif|webp|pdf) ;;
  mp4|mov|webm|avi|mkv) echo "SKIPPED VIDEO: $NAME (Claude can't watch video; keep the link only)"; exit 1 ;;
  *) echo "SKIPPED UNSUPPORTED: $NAME (.$EXT can't be opened by Claude; ask for PNG, JPG or PDF)"; exit 1 ;;
esac

DIR=".claude/attachments"
OUT="$DIR/$NAME"
mkdir -p "$DIR"

if [ -s "$OUT" ]; then
  echo "OK exists $OUT"; exit 0
fi

if ! command -v curl >/dev/null 2>&1; then echo "ERROR NETWORK: curl is not installed."; exit 4; fi

TMP="$DIR/.$NAME.part"
CODE=$(curl -sS -o "$TMP" -w "%{http_code}" --max-time 60 --max-filesize "$MAX_BYTES" \
  -H "Accept: image/*,application/pdf" "$URL" 2>/dev/null)
RC=$?
if [ $RC -eq 63 ]; then rm -f "$TMP"; echo "SKIPPED TOO_BIG: $NAME is over 15 MB"; exit 1; fi
if [ $RC -ne 0 ] || [ -z "$CODE" ] || [ "$CODE" = "000" ]; then
  rm -f "$TMP"; echo "ERROR NETWORK: could not download $NAME. Check your internet connection."; exit 4
fi
case "$CODE" in
  200) ;;
  404) rm -f "$TMP"; echo "ERROR 404: $NAME isn't on the server any more (deleted or renamed)."; exit 6 ;;
  401|403) rm -f "$TMP"; echo "ERROR $CODE: $NAME needs a login. These links are expected to be public; tell the timesheet team."; exit 8 ;;
  *) rm -f "$TMP"; echo "ERROR HTTP_$CODE: the server returned $CODE for $NAME."; exit 8 ;;
esac

SIZE=$(wc -c < "$TMP" | tr -d ' ')
if [ "$SIZE" -eq 0 ]; then rm -f "$TMP"; echo "ERROR EMPTY: $NAME downloaded as an empty file."; exit 8; fi
if [ "$SIZE" -gt "$MAX_BYTES" ]; then rm -f "$TMP"; echo "SKIPPED TOO_BIG: $NAME is over 15 MB"; exit 1; fi

# Check the real type from the first bytes.
HEAD=$(od -An -tx1 -N12 "$TMP" | tr -d ' \n')
OK=0
case "$EXT" in
  png)      case "$HEAD" in 89504e470d0a1a0a*) OK=1 ;; esac ;;
  jpg|jpeg) case "$HEAD" in ffd8ff*) OK=1 ;; esac ;;
  gif)      case "$HEAD" in 474946383*) OK=1 ;; esac ;;
  webp)     case "$HEAD" in 52494646????????57454250) OK=1 ;; esac ;;
  pdf)      case "$HEAD" in 25504446*) OK=1 ;; esac ;;
esac
if [ $OK -ne 1 ]; then
  rm -f "$TMP"; echo "ERROR NOT_${EXT}: $NAME isn't a real .$EXT file (the server may have returned an error page)."; exit 8
fi

mv "$TMP" "$OUT"
echo "OK saved $OUT ($((SIZE / 1024)) KB)"
exit 0
