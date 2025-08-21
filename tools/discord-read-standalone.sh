#!/usr/bin/env bash

# Standalone Discord channel reader (no sourcing required)
# Usage:
#   DISCORD_BOT_TOKEN=... tools/discord-read-standalone.sh <channel_id> [limit=20] [after_message_id]
# Or if env already set: tools/discord-read-standalone.sh "$DISCORD_ACTIVE_WORK_CHANNEL" 20

set -euo pipefail

DISCORD_API="https://discord.com/api/v10"

channel_id="${1:-${DISCORD_ACTIVE_WORK_CHANNEL:-}}"
limit="${2:-20}"
after_id="${3:-}"

if [ -z "${DISCORD_BOT_TOKEN:-}" ]; then
  echo "❌ DISCORD_BOT_TOKEN env var is required" >&2
  exit 1
fi
if [ -z "$channel_id" ]; then
  echo "❌ channel_id arg (or DISCORD_ACTIVE_WORK_CHANNEL) is required" >&2
  exit 1
fi

_discord_get_with_rl() {
  local url="$1"
  local headers_file body_file code retry reset_after
  headers_file=$(mktemp)
  body_file=$(mktemp)
  if [[ "$url" != *"?"* ]]; then
    url="$url?ts=$(date +%s%N)"
  else
    url="$url&ts=$(date +%s%N)"
  fi
  while true; do
    code=$(curl -sS -D "$headers_file" -o "$body_file" -w '%{http_code}' \
      -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      -H "Cache-Control: no-cache" -H "Pragma: no-cache" \
      "$url" || true)
    if [ "$code" = "429" ]; then
      retry=$(grep -i '^Retry-After:' "$headers_file" | awk '{print $2}' | tr -d '\r')
      reset_after=$(grep -i '^X-RateLimit-Reset-After:' "$headers_file" | awk '{print $2}' | tr -d '\r')
      [ -z "$retry" ] && retry="$reset_after"
      sleep "${retry:-1}"
      continue
    fi
    break
  done
  cat "$body_file"
  rm -f "$headers_file" "$body_file"
}

query="$DISCORD_API/channels/$channel_id/messages?limit=$limit"
if [ -n "$after_id" ]; then
  query="$query&after=$after_id"
fi

resp=$(_discord_get_with_rl "$query")

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
  # Minimal fallback: raw JSON
  echo "$resp"
fi

