#!/usr/bin/env bash
set -euo pipefail

# Discord Agent Helper Functions (webhook-based)
# Source: source discord/scripts/discord-agent-helpers.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_FILE="$SCRIPT_DIR/../config/.env"

if [ -f "$CONF_FILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$CONF_FILE" | xargs)
fi

get_timestamp() { date +"%H:%M"; }

send_discord_message() {
  local webhook_url="$1"; local message="$2"; local agent_name="${3:-Agent}"
  curl -s -X POST "$webhook_url" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"$message\",\"username\":\"$agent_name\"}"
}

agent_start()   { local n="$1"; local t="$2"; local ts=$(get_timestamp); send_discord_message "$AGENT_STATUS_WEBHOOK"       "🟢 [$ts] AGENT_START: $n starting work on $t" "$n"; }
agent_end()     { local n="$1"; local ts=$(get_timestamp); send_discord_message "$AGENT_STATUS_WEBHOOK"       "🔴 [$ts] AGENT_END: $n session complete"         "$n"; }
reserve_file()  { local n="$1"; local f="$2"; local ts=$(get_timestamp); send_discord_message "$FILE_RESERVATIONS_WEBHOOK" "🔒 [$ts] FILE_RESERVE: $f - $n"               "$n"; }
release_file()  { local n="$1"; local f="$2"; local ts=$(get_timestamp); send_discord_message "$FILE_RESERVATIONS_WEBHOOK" "✅ [$ts] FILE_RELEASE: $f - $n"               "$n"; }
progress_update(){ local n="$1"; local p="$2"; local t="$3"; local ts=$(get_timestamp); send_discord_message "$ACTIVE_WORK_WEBHOOK"       "⚙️ [$ts] PROGRESS: $p - $t - $n"         "$n"; }
report_conflict(){ local n="$1"; local d="$2"; local ts=$(get_timestamp); send_discord_message "$CONFLICTS_WEBHOOK"          "⚠️ [$ts] CONFLICT: $d - $n"                 "$n"; }
task_complete() { local n="$1"; local t="$2"; local s="$3"; local ts=$(get_timestamp); send_discord_message "$COMPLETED_WORK_WEBHOOK"    "🏁 [$ts] AGENT_COMPLETE: $n finished $t - $s" "$n"; }

echo "Discord webhook helpers loaded from $SCRIPT_DIR"

