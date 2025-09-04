#!/usr/bin/env bash
set -euo pipefail

# Minimal advisory lock utility for multi-agent coordination
# Creates simple lock files under agents/locks/ to reserve files for editing.
#
# Usage:
#   agent-lock.sh reserve <path> [--agent NAME] [--ttl SECONDS] [--status STATUS]
#   agent-lock.sh release <path> [--agent NAME]
#   agent-lock.sh check <path> [--agent NAME]         # exits 0 if editable
#   agent-lock.sh list
#   agent-lock.sh show <path>
#
# Lock file format (INI-like key=value):
#   agent=<name>
#   file=<original path>
#   status=<RESERVED|IN_PROGRESS|COMPLETE|RELEASED>
#   created_utc=YYYY-MM-DD HH:MM:SS UTC
#   expires_epoch=<unix seconds>

ROOT_DIR=$(cd -- "$(dirname -- "$0")/.." && pwd)
LOCK_DIR="$ROOT_DIR/agents/locks"

color() { local c="$1"; shift; printf "%b%s%b\n" "\033[${c}m" "$*" "\033[0m"; }
now_epoch() { date -u +%s; }
now_utc() { date -u "+%F %T UTC"; }

ensure_dirs() { mkdir -p "$LOCK_DIR"; }

hash_path() {
  # Hash a path to a stable filename
  if command -v sha1sum >/dev/null 2>&1; then
    printf "%s" "$1" | sha1sum | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    printf "%s" "$1" | shasum -a 1 | awk '{print $1}'
  else
    # Fallback: tr and cksum (less stable across platforms but acceptable)
    printf "%s" "$1" | cksum | awk '{print $1}'
  fi
}

lockfile_path() { local p="$1"; printf "%s/%s.lock" "$LOCK_DIR" "$(hash_path "$p")"; }

read_field() {
  # read_field <lockfile> <key>
  local lf="$1" key="$2"
  [ -f "$lf" ] || return 1
  # Prefer sed for simple, robust key=value parsing
  sed -n "s/^${key}=//p" "$lf" | head -n1
}

write_lock() {
  # write_lock <lf> <agent> <file> <status> <expires_epoch>
  local lf="$1" agent="$2" file="$3" status="$4" exp="$5"; local tmp
  tmp="${lf}.tmp$$"
  {
    printf 'agent=%s\n' "$agent"
    printf 'file=%s\n' "$file"
    printf 'status=%s\n' "$status"
    printf 'created_utc=%s\n' "$(now_utc)"
    printf 'expires_epoch=%s\n' "$exp"
  } >"$tmp"
  mv "$tmp" "$lf"
}

reserve() {
  local file="$1"; shift || true
  local agent="${AGENT:-${AGENT_NAME:-${USER:-unknown}}}"
  local ttl=3600
  local status="RESERVED"
  while [ $# -gt 0 ]; do
    case "$1" in
      --agent) agent="$2"; shift 2;;
      --ttl) ttl="$2"; shift 2;;
      --status) status="$2"; shift 2;;
      *) color 31 "Unknown option: $1"; exit 2;;
    esac
  done
  [ -n "$file" ] || { color 31 "Path required"; exit 2; }
  ensure_dirs
  local lf; lf="$(lockfile_path "$file")"
  local now; now="$(now_epoch)"
  local cur_agent cur_exp cur_status
  if [ -f "$lf" ]; then
    cur_agent="$(read_field "$lf" agent || true)"
    cur_exp="$(read_field "$lf" expires_epoch || echo 0)"
    cur_status="$(read_field "$lf" status || true)"
    # Normalize to digits only for safety
    cur_exp="$(printf '%s' "${cur_exp:-0}" | tr -cd '0-9')"
    if [ "${cur_exp:-0}" -gt "$now" ] && [ "${cur_agent}" != "$agent" ]; then
      color 31 "LOCKED: $file by '$cur_agent' until $(date -u -d "@${cur_exp}" "+%F %T UTC")"
      exit 1
    fi
  fi
  local exp; exp=$(( now + ttl ))
  write_lock "$lf" "$agent" "$file" "$status" "$exp"
  color 32 "RESERVED: $file by '$agent' for ${ttl}s (until $(date -u -d @${exp} "+%H:%M UTC"))"
}

release() {
  local file="$1"; shift || true
  local agent="${AGENT:-${AGENT_NAME:-${USER:-unknown}}}"
  while [ $# -gt 0 ]; do
    case "$1" in
      --agent) agent="$2"; shift 2;;
      *) color 31 "Unknown option: $1"; exit 2;;
    esac
  done
  local lf; lf="$(lockfile_path "$file")"
  if [ ! -f "$lf" ]; then
    color 33 "No lock present for $file"
    return 0
  fi
  local cur_agent cur_exp now; now="$(now_epoch)"
  cur_agent="$(read_field "$lf" agent || true)"
  cur_exp="$(read_field "$lf" expires_epoch || echo 0)"
  cur_exp="$(printf '%s' "${cur_exp:-0}" | tr -cd '0-9')"
  if [ "$cur_agent" != "$agent" ] && [ "${cur_exp:-0}" -gt "$now" ]; then
    color 31 "Cannot release: owned by '$cur_agent' until $(date -u -d "@${cur_exp}" "+%F %T UTC")"
    exit 1
  fi
  rm -f -- "$lf"
  color 32 "RELEASED: $file"
}

check() {
  local file="$1"; shift || true
  local agent="${AGENT:-${AGENT_NAME:-${USER:-unknown}}}"
  local lf; lf="$(lockfile_path "$file")"
  if [ ! -f "$lf" ]; then
    color 32 "OK: no lock for $file"; return 0
  fi
  local cur_agent cur_exp now; now="$(now_epoch)"
  cur_agent="$(read_field "$lf" agent || true)"
  cur_exp="$(read_field "$lf" expires_epoch || echo 0)"
  cur_exp="$(printf '%s' "${cur_exp:-0}" | tr -cd '0-9')"
  if [ "${cur_exp:-0}" -le "$now" ] || [ "$cur_agent" = "$agent" ]; then
    color 32 "OK: lock is expired or owned by you ($cur_agent)"; return 0
  fi
  color 31 "BLOCKED: $file locked by '$cur_agent' until $(date -u -d "@${cur_exp}" "+%F %T UTC")"
  return 1
}

list() {
  ensure_dirs
  local now; now="$(now_epoch)"
  local any=0
  for lf in "$LOCK_DIR"/*.lock; do
    [ -e "$lf" ] || continue
    any=1
    local a f s e; a="$(read_field "$lf" agent)"; f="$(read_field "$lf" file)"; s="$(read_field "$lf" status)"; e="$(read_field "$lf" expires_epoch)"
    e="$(printf '%s' "${e:-0}" | tr -cd '0-9')"
    if [ "${e:-0}" -gt "$now" ]; then
      printf "ACTIVE  %-10s  %s  (until %s)\n" "$s" "$f" "$(date -u -d "@${e}" "+%F %T UTC")"
    else
      printf "EXPIRED %-10s  %s  (expired %s)\n" "$s" "$f" "$(date -u -d "@${e:-0}" "+%F %T UTC")"
    fi
  done
  [ "$any" -eq 1 ] || echo "(no locks)"
}

show() {
  local file="$1"; local lf; lf="$(lockfile_path "$file")"
  if [ -f "$lf" ]; then
    cat "$lf"
  else
    echo "No lock for $file"
  fi
}

# --- Override helpers ---
log_override() {
  # log_override <action> <file> <prev_agent> <prev_status> <prev_exp> <by> <reason>
  local action="$1" file="$2" prev_agent="$3" prev_status="$4" prev_exp="$5" by="$6" reason="$7"
  local day logf; day=$(date -u +%F)
  local confdir="$ROOT_DIR/agents/conflicts"
  mkdir -p "$confdir"
  logf="$confdir/overrides-${day}.md"
  prev_exp="$(printf '%s' "${prev_exp:-0}" | tr -cd '0-9')"
  printf -- "- [%s] %s: %s (prev_agent: %s, status: %s, expires: %s) by %s. Reason: %s\n" \
    "$(date -u +%H:%M)" \
    "$action" \
    "$file" \
    "${prev_agent:-none}" \
    "${prev_status:-unknown}" \
    "$(date -u -d "@${prev_exp:-0}" "+%F %T UTC")" \
    "$by" \
    "${reason:-n/a}" >> "$logf"
}

force_release() {
  local file="$1"; shift || true
  local by="" reason=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --by) by="$2"; shift 2;;
      --reason) reason="$2"; shift 2;;
      *) color 31 "Unknown option: $1"; exit 2;;
    esac
  done
  [ -n "$by" ] || { color 31 "--by NAME is required"; exit 2; }
  [ -n "$file" ] || { color 31 "Path required"; exit 2; }
  ensure_dirs
  local lf; lf="$(lockfile_path "$file")"
  local prev_agent prev_status prev_exp
  if [ -f "$lf" ]; then
    prev_agent="$(read_field "$lf" agent || true)"
    prev_status="$(read_field "$lf" status || true)"
    prev_exp="$(read_field "$lf" expires_epoch || echo 0)"
    rm -f -- "$lf"
  fi
  log_override "FORCE_RELEASE" "$file" "$prev_agent" "$prev_status" "$prev_exp" "$by" "$reason"
  color 33 "FORCE RELEASED: $file by '$by'"
}

force_reserve() {
  local file="$1"; shift || true
  local by="" reason="" ttl=3600 status="RESERVED"
  while [ $# -gt 0 ]; do
    case "$1" in
      --by) by="$2"; shift 2;;
      --reason) reason="$2"; shift 2;;
      --ttl) ttl="$2"; shift 2;;
      --status) status="$2"; shift 2;;
      *) color 31 "Unknown option: $1"; exit 2;;
    esac
  done
  [ -n "$by" ] || { color 31 "--by NAME is required"; exit 2; }
  [ -n "$file" ] || { color 31 "Path required"; exit 2; }
  ensure_dirs
  local lf; lf="$(lockfile_path "$file")"
  local prev_agent prev_status prev_exp
  if [ -f "$lf" ]; then
    prev_agent="$(read_field "$lf" agent || true)"
    prev_status="$(read_field "$lf" status || true)"
    prev_exp="$(read_field "$lf" expires_epoch || echo 0)"
  fi
  local now exp; now="$(now_epoch)"; exp=$(( now + ttl ))
  write_lock "$lf" "$by" "$file" "$status" "$exp"
  log_override "FORCE_RESERVE" "$file" "$prev_agent" "$prev_status" "$prev_exp" "$by" "$reason"
  color 33 "FORCE RESERVED: $file by '$by' for ${ttl}s (until $(date -u -d "@${exp}" "+%H:%M UTC"))"
}

usage() {
  cat <<EOF
Usage:
  $(basename "$0") reserve <path> [--agent NAME] [--ttl SECONDS] [--status STATUS]
  $(basename "$0") release <path> [--agent NAME]
  $(basename "$0") check <path> [--agent NAME]
  $(basename "$0") list
  $(basename "$0") show <path>
  $(basename "$0") force-release <path> --by NAME --reason TEXT
  $(basename "$0") force-reserve <path> --by NAME --reason TEXT [--ttl SECONDS] [--status STATUS]
Env:
  AGENT or AGENT_NAME can set your agent identity.
EOF
}

cmd="${1:-}"
case "${cmd:-}" in
  reserve) shift; [ $# -ge 1 ] || { usage; exit 2; }; reserve "$@" ;;
  release) shift; [ $# -ge 1 ] || { usage; exit 2; }; release "$@" ;;
  check)   shift; [ $# -ge 1 ] || { usage; exit 2; }; check "$@" ;;
  list)    shift || true; list ;;
  show)    shift; [ $# -ge 1 ] || { usage; exit 2; }; show "$@" ;;
  force-release) shift; [ $# -ge 1 ] || { usage; exit 2; }; force_release "$@" ;;
  force-reserve) shift; [ $# -ge 1 ] || { usage; exit 2; }; force_reserve "$@" ;;
  -h|--help|help|*) usage ;;
esac
