#!/usr/bin/env bash
set -euo pipefail

# Tiny helper for standardized timestamps and session status updates.
#
# Usage:
#   status.sh now                 # prints UTC timestamp
#   status.sh hhmm                # prints HH:MM
#   status.sh set-status <file> <STATUS>
#   status.sh log <file> <message>

now_utc() { date -u "+%F %T UTC"; }
hhmm() { date -u +%H:%M; }

set_status() {
  local file="$1"; local status="$2"
  [ -f "$file" ] || { echo "File not found: $file" >&2; exit 1; }
  # Replace the first occurrence of the Status line under Metadata
  awk -v s="$status" '
    BEGIN{replaced=0}
    {
      if (!replaced && $0 ~ /^- \*\*Status\*\*:/) {
        print "- **Status**: " s; replaced=1; next
      }
      print $0
    }
  ' "$file" >"$file.tmp" && mv "$file.tmp" "$file"
  echo "Status set to $status in $file"
}

append_log() {
  local file="$1"; shift; local msg="$*"
  [ -f "$file" ] || { echo "File not found: $file" >&2; exit 1; }
  printf -- "- [%s] %s\n" "$(hhmm)" "$msg" >> "$file"
  echo "Logged to $file: $msg"
}

case "${1:-}" in
  now) now_utc ;;
  hhmm) hhmm ;;
  set-status) shift; [ $# -ge 2 ] || { echo "Usage: status.sh set-status <file> <STATUS>"; exit 2; }; set_status "$1" "$2" ;;
  log) shift; [ $# -ge 2 ] || { echo "Usage: status.sh log <file> <message>"; exit 2; }; file="$1"; shift; append_log "$file" "$*" ;;
  *) echo "Usage: status.sh {now|hhmm|set-status|log} ..."; exit 2 ;;
esac
