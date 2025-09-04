#!/usr/bin/env bash
set -euo pipefail

# Pre-commit guard: blocks committing files with active locks by other agents.
# Intended to be installed as .git/hooks/pre-commit (see tools/install-git-hook.sh).

ROOT_DIR=$(cd -- "$(dirname -- "$0")/.." && pwd)
LOCK_DIR="$ROOT_DIR/agents/locks"
CONFLICT_DIR="$ROOT_DIR/agents/conflicts"

ME="${AGENT:-${AGENT_NAME:-${USER:-unknown}}}"
mkdir -p "$LOCK_DIR"

# Files staged for commit
mapfile -t STAGED < <(git diff --cached --name-only --diff-filter=ACMRTUXB)

[ ${#STAGED[@]} -gt 0 ] || exit 0

now=$(date -u +%s)
blocked=()

for lf in "$LOCK_DIR"/*.lock; do
  [ -e "$lf" ] || continue
  file=$(awk -F'=' '$1=="file"{print substr($0,index($0,"=")+1)}' "$lf")
  agent=$(awk -F'=' '$1=="agent"{print substr($0,index($0,"=")+1)}' "$lf")
  exp=$(awk -F'=' '$1=="expires_epoch"{print substr($0,index($0,"=")+1)}' "$lf")
  status=$(awk -F'=' '$1=="status"{print substr($0,index($0,"=")+1)}' "$lf")
  exp=${exp:-0}
  [ "$exp" -gt "$now" ] || continue
  # If same agent, allow
  [ "$agent" = "$ME" ] && continue
  for f in "${STAGED[@]}"; do
    if [ "$f" = "$file" ]; then
      blocked+=("$f|$agent|$status|$exp")
    fi
  done
done

if [ ${#blocked[@]} -gt 0 ]; then
  if [ "${AGENT_OVERRIDE:-0}" = "1" ]; then
    mkdir -p "$CONFLICT_DIR"
    day=$(date -u +%F)
    logf="$CONFLICT_DIR/overrides-${day}.md"
    reason=${OVERRIDE_REASON:-"(no reason provided)"}
    for entry in "${blocked[@]}"; do
      IFS='|' read -r f a s e <<<"$entry"
      printf -- "- [%s] PRE-COMMIT OVERRIDE: %s (status: %s, reserved by: %s, until: %s) by %s. Reason: %s\n" \
        "$(date -u +%H:%M)" \
        "$f" \
        "$s" \
        "$a" \
        "$(date -u -d "@${e}" "+%F %T UTC")" \
        "$ME" \
        "$reason" >> "$logf"
    done
    echo "WARNING: AGENT_OVERRIDE=1 set; proceeding despite active locks. Overrides logged to $logf" >&2
    exit 0
  else
    echo "ERROR: Commit blocked due to active file reservations by other agents:" >&2
    for entry in "${blocked[@]}"; do
      IFS='|' read -r f a s e <<<"$entry"
      printf '  - %s (status: %s) reserved by %s until %s\n' "$f" "$s" "$a" "$(date -u -d @${e} "+%F %T UTC")" >&2
    done
    echo "Hint: Ask the owner to release, wait for expiry, or use tools/agent-prune-locks.sh for expired locks. Set AGENT_OVERRIDE=1 to force (logs to agents/conflicts)." >&2
    exit 1
  fi
fi

exit 0
