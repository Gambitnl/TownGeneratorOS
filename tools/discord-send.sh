#!/usr/bin/env bash
set -euo pipefail
# Robust Discord message sender using jq -Rs and stdin piping.
# Usage: echo "message" | tools/discord-send.sh <channel_id>

dir=$(cd "$(dirname "$0")/.." && pwd)
cd "$dir"

if [[ ! -f .env ]]; then
  echo "❌ .env not found" >&2
  exit 1
fi

# Load env (simple parser to avoid eval pitfalls)
while IFS='=' read -r k v; do
  [[ -z "$k" || "$k" =~ ^# ]] && continue
  export "$k"="${v%$'\r'}"
done < .env

channel_id="${1:-${DISCORD_AGENT_STATUS_CHANNEL:-}}"
if [[ -z "$channel_id" ]]; then
  echo "Usage: echo 'message' | tools/discord-send.sh <channel_id>" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq required" >&2
  exit 3
fi

payload=$(jq -Rs '{content: .}')
resp=$(printf '%s' "$payload" | curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  --data-binary @- \
  "https://discord.com/api/v10/channels/$channel_id/messages")

echo "$resp" | jq -r '{id:.id, user:.author.username, content:.content}'

