#!/usr/bin/env bash
set -euo pipefail

# Discord Bot API Functions (centralized)
# Source: source discord/scripts/discord-bot-functions.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_FILE="$SCRIPT_DIR/../config/.env"

if [ -f "$CONF_FILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$CONF_FILE" | xargs)
else
  echo "[!] No env file found at $CONF_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

DISCORD_API="https://discord.com/api/v10"

get_timestamp() { date +"%H:%M"; }

ensure_bot_identity() {
  local expected="${EXPECTED_BOT_USERNAME:-}"
  [ -z "$expected" ] && return 0
  if ! command -v jq >/dev/null 2>&1; then
    echo "[!] jq required for identity checks" >&2
    return 0
  fi
  local who
  who=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "$DISCORD_API/users/@me" | jq -r '.username // empty')
  if [ -z "$who" ]; then
    echo "[!] Unable to determine bot identity (no username)" >&2
    return 1
  fi
  if [ "$who" != "$expected" ]; then
    echo "[!] Bot identity mismatch: expected $expected, got $who" >&2
    return 1
  fi
}

discord_send_message() {
  local channel_id="$1"; shift
  local message="$1"; shift || true
  ensure_bot_identity || return 1
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$message" \
    | jq -Rs '{content: .}' \
    | curl -s -X POST "$DISCORD_API/channels/$channel_id/messages" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        --data-binary @-
  else
    curl -s -X POST "$DISCORD_API/channels/$channel_id/messages" \
      -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"content\":\"$message\"}"
  fi
}

_discord_get_with_rl() {
  local url="$1"
  local headers_file body_file code retry reset_after
  headers_file=$(mktemp); body_file=$(mktemp)
  case "$url" in *\?*) url="$url&ts=$(date +%s%N)";; *) url="$url?ts=$(date +%s%N)";; esac
  while true; do
    code=$(curl -sS -D "$headers_file" -o "$body_file" -w '%{http_code}' \
      -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      -H "Cache-Control: no-cache" -H "Pragma: no-cache" \
      "$url" || true)
    if [ "$code" = "429" ]; then
      retry=$(grep -i '^Retry-After:' "$headers_file" | awk '{print $2}' | tr -d '\r')
      reset_after=$(grep -i '^X-RateLimit-Reset-After:' "$headers_file" | awk '{print $2}' | tr -d '\r')
      [ -z "$retry" ] && retry="$reset_after"; sleep "${retry:-1}"; continue
    fi
    break
  done
  cat "$body_file"; rm -f "$headers_file" "$body_file"
}

discord_read_messages() {
  local channel_id="$1"; local limit="${2:-10}"
  local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit"
  local resp; resp=$(_discord_get_with_rl "$url")
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$resp" | jq -r '
      .[]
      | "[" + ((.timestamp // "")[0:16]) + "] "
        + (.author.username // "?") + ": "
        + (if (.content // "") != "" then .content
           elif ((.embeds // []) | length) > 0 then "[embed]"
           elif ((.attachments // []) | length) > 0 then ("[attachments: " + (((.attachments // []) | length) | tostring) + "]")
           else "[no content]" end)'
  else
    echo "$resp"
  fi
}

discord_read_messages_after() {
  local channel_id="$1"; local after_id="$2"; local limit="${3:-50}"
  local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit&after=$after_id"
  _discord_get_with_rl "$url"
}

check_file_conflicts() {
  local file_path="$1"
  local recent_messages; recent_messages=$(discord_read_messages "$DISCORD_FILE_RESERVATIONS_CHANNEL" 50)
  echo "$recent_messages" | grep "FILE_RESERVE.*$file_path" || true
}

check_active_agents() {
  discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 20 | grep -E "AGENT_START|AGENT_END" | head -10 || true
}

agent_start() {
  local agent_name="$1"; local task="$2"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🟢 [$ts] AGENT_START: $agent_name starting work on $task"
}

agent_end() {
  local agent_name="$1"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🔴 [$ts] AGENT_END: $agent_name session complete"
}

reserve_file() {
  local agent_name="$1"; local file_path="$2"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "🔒 [$ts] FILE_RESERVE: $file_path - $agent_name"
}

release_file() {
  local agent_name="$1"; local file_path="$2"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "✅ [$ts] FILE_RELEASE: $file_path - $agent_name"
}

progress_update() {
  local agent_name="$1"; local progress="$2"; local task="$3"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_ACTIVE_WORK_CHANNEL" "⚙️ [$ts] PROGRESS: $progress - $task - $agent_name"
}

report_conflict() {
  local agent_name="$1"; local desc="$2"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_CONFLICTS_CHANNEL" "⚠️ [$ts] CONFLICT: $desc - $agent_name"
}

task_complete() {
  local agent_name="$1"; local task="$2"; local summary="$3"; local ts=$(get_timestamp)
  discord_send_message "$DISCORD_COMPLETED_WORK_CHANNEL" "🏁 [$ts] AGENT_COMPLETE: $agent_name finished $task - $summary"
}

test_bot_connection() {
  local resp; resp=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "$DISCORD_API/users/@me")
  if command -v jq >/dev/null 2>&1; then
    local name; name=$(echo "$resp" | jq -r '.username // empty')
    [ -n "$name" ] && echo "Connected as: $name" || { echo "[!] Bot connection failed" >&2; return 1; }
  else
    echo "$resp"
  fi
}

discord_list_attachments() {
  local channel_id="$1"; local limit="${2:-20}"
  local resp; resp=$(_discord_get_with_rl "$DISCORD_API/channels/$channel_id/messages?limit=$limit")
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$resp" | jq -r '.[] | (.attachments // [])[]?.url'
  else
    echo "$resp"
  fi
}

echo "Discord bot functions loaded from $SCRIPT_DIR"

