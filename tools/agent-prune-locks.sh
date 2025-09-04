#!/usr/bin/env bash
set -euo pipefail

# Remove expired lock files and log overrides for traceability.

ROOT_DIR=$(cd -- "$(dirname -- "$0")/.." && pwd)
LOCK_DIR="$ROOT_DIR/agents/locks"
CONFLICT_DIR="$ROOT_DIR/agents/conflicts"

now_epoch() { date -u +%s; }
now_utc() { date -u "+%F %T UTC"; }
hhmm() { date -u +%H:%M; }

mkdir -p "$LOCK_DIR" "$CONFLICT_DIR"

removed=0
kept=0
for lf in "$LOCK_DIR"/*.lock; do
  [ -e "$lf" ] || continue
  file=$(awk -F'=' '$1=="file"{print substr($0,index($0,"=")+1)}' "$lf")
  agent=$(awk -F'=' '$1=="agent"{print substr($0,index($0,"=")+1)}' "$lf")
  exp=$(awk -F'=' '$1=="expires_epoch"{print substr($0,index($0,"=")+1)}' "$lf")
  exp=${exp:-0}
  now=$(now_epoch)
  if [ "$exp" -le "$now" ]; then
    day=$(date -u +%F)
    logf="$CONFLICT_DIR/overrides-${day}.md"
    touch "$logf"
    printf -- "- [%s] Pruned expired lock: %s (file: %s, agent: %s, expired: %s, lock: %s)\n" \
      "$(hhmm)" \
      "$(basename "$lf")" \
      "$file" \
      "${agent:-unknown}" \
      "$(date -u -d "@${exp}" "+%F %T UTC")" \
      "$lf" >> "$logf"
    rm -f -- "$lf"
    removed=$((removed+1))
  else
    kept=$((kept+1))
  fi
done

echo "Expired locks removed: $removed; Active locks kept: $kept"
