#!/bin/bash

# Discord Bot API Functions - Codex Specific
# Source this file: source discord-bot-functions-codex.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found! Run discord-setup-helper.sh first"
    return 1
fi

# Discord API base URL
DISCORD_API="https://discord.com/api/v10"

# Get current timestamp in HH:MM format
get_timestamp() {
    date +"%H:%M"
}

# Ensure the current bot identity matches CodexCLI
ensure_bot_identity() {
    local expected="CodexCLI"
    if ! command -v jq >/dev/null 2>&1;
 then
        echo "❌ jq is required for identity checks" >&2
        return 1
    fi
    local who=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "$DISCORD_API/users/@me" | jq -r '.username // empty')
    if [ -z "$who" ]; then
        echo "❌ Unable to determine bot identity (no username)" >&2
        return 1
    fi
    if [ "$who" != "$expected" ]; then
        echo "❌ Bot identity mismatch: expected $expected, got $who" >&2
        echo "💡 Make sure you\'re using: cp .env.codex .env" >&2
        return 1
    fi
    return 0
}

# Send message to Discord channel via Bot API (Codex-specific with robust JSON and identity guard)
discord_send_message() {
    local channel_id="$1"
    local message="$2"
    local username="${3:-Codex}"
    
    # Guard: ensure we are posting as CodexCLI
    ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity" >&2; return 1; }
    
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

# Codex-specific robust posting functions
say_discord() {
    local channel_id="$1"
    if [ -z "$channel_id" ]; then
        channel_id="$DISCORD_ACTIVE_WORK_CHANNEL"
    fi
    printf '%s' "$(cat)" | jq -Rs '{content: .}' | curl -s -X POST "$DISCORD_API/channels/$channel_id/messages" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        --data-binary @-
}

sayf_discord() {
    local file_path="$1"
    local channel_id="${2:-$DISCORD_ACTIVE_WORK_CHANNEL}"
    if [ ! -f "$file_path" ]; then
        echo "❌ File not found: $file_path" >&2
        return 1
    fi
    cat "$file_path" | jq -Rs '{content: .}' | curl -s -X POST "$DISCORD_API/channels/$channel_id/messages" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        --data-binary @-
}

_discord_get_with_rl() {
    local url="$1"
    local headers_file body_file code retry reset_after
    headers_file=$(mktemp)
    body_file=$(mktemp)
    # cache-buster to dodge stale responses
    if [[ "$url" != *"?"* ]]; then
        url="$url?ts=$(date +%s%N)"
    else
        url="$url&ts=$(date +%s%N)"
    fi
    while true; do
        code=$(curl -sS -D "$headers_file" -o "$body_file" -w '%{http_code}' \
            -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
            -H "Cache-Control: no-cache" -H "Pragma: no-cache" \
            "$url" 2>/dev/null || true)
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

# Read recent messages from Discord channel (robust)
discord_read_messages() {
    local channel_id="$1"
    local limit="${2:-10}"
    local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit"
    local resp
    resp=$(_discord_get_with_rl "$url")
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "$resp" | jq -r '
          .[]
          | "[" + ((.timestamp // "")[0:16]) + "] "
            + (.author.username // "?") + ": "
            + (if (.content // "") != "" then .content
               elif ((.embeds // []) | length) > 0 then "[embed]"
               elif ((.attachments // []) | length) > 0 then
                    ("[attachments: " + (((.attachments // []) | length) | tostring) + "]")
               else "[no content]" end)'
    else
        echo "$resp"
    fi
}

# Read messages after a given message ID (forward pagination)
discord_read_messages_after() {
    local channel_id="$1"; local after_id="$2"; local limit="${3:-50}"
    local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit&after=$after_id"
    local resp
    resp=$(_discord_get_with_rl "$url")
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "$resp" | jq -r '
          .[]
          | "[" + ((.timestamp // "")[0:16]) + "] "
            + (.author.username // "?") + ": "
            + (if (.content // "") != "" then .content
               elif ((.embeds // []) | length) > 0 then "[embed]"
               elif ((.attachments // []) | length) > 0 then
                    ("[attachments: " + (((.attachments // []) | length) | tostring) + "]")
               else "[no content]" end)'
    else
        echo "$resp"
    fi
}

# List recent attachment URLs from a channel
discord_list_attachments() {
    local channel_id="$1"
    local limit="${2:-20}"
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required" >&2
        return 1
    fi
    curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "$DISCORD_API/channels/$channel_id/messages?limit=$limit" \
        | jq -r '.[] | select(.attachments | length > 0) | .attachments[] | .url' 2>/dev/null || \
        echo "⚠️  Error listing attachments"
}

# Get the last attachment URL from a channel
discord_last_attachment_url() {
    local channel_id="${1:-$DISCORD_ACTIVE_WORK_CHANNEL}"
    discord_list_attachments "$channel_id" 5 | head -1
}

# Test bot connection
test_bot_connection() {
    echo "🧪 Testing Discord Bot API connection..."
    test_response=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "$DISCORD_API/users/@me")
    
    if echo "$test_response" | jq -e '.username' >/dev/null 2>&1; then
        bot_username=$(echo "$test_response" | jq -r '.username')
        echo "✅ Bot connected successfully as: $bot_username"
        return 0
    else
        echo "❌ Bot connection failed. Check your bot token."
        echo "Response: $test_response"
        return 1
    fi
}

# Check for agent conflicts by reading file reservations
check_file_conflicts() {
    local file_path="$1"
    echo "🔍 Checking Discord for conflicts on: $file_path"
    
    # Read recent messages from file reservations channel
    conflicts=$(discord_read_messages "$DISCORD_FILE_RESERVATIONS_CHANNEL" 50 | grep "FILE_RESERVE.*$file_path" | grep -v "Codex")
    
    if [ -n "$conflicts" ]; then
        echo "⚠️  CONFLICT DETECTED:"
        echo "$conflicts"
        return 1
    else
        echo "✅ No conflicts found for: $file_path"
        return 0
    fi
}

# Reserve a file for editing
reserve_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    
    discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "🔒 [$timestamp] FILE_RESERVE: $file_path - $agent_name"
}

# Release a file after editing
release_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    
    discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "✅ [$timestamp] FILE_RELEASE: $file_path - $agent_name"
}

# Announce agent session start
agent_start() {
    local agent_name="$1"
    local task_description="$2"
    local timestamp=$(get_timestamp)
    
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🟢 [$timestamp] AGENT_START: $agent_name starting work on $task_description"
}

# Announce agent session end
agent_end() {
    local agent_name="$1"
    local timestamp=$(get_timestamp)
    
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🔴 [$timestamp] AGENT_END: $agent_name session complete"
}

# Send progress update
progress_update() {
    local agent_name="$1"
    local status="$2"
    local description="$3"
    local timestamp=$(get_timestamp)
    
    discord_send_message "$DISCORD_ACTIVE_WORK_CHANNEL" "⚙️ [$timestamp] PROGRESS: $status - $description - $agent_name"
}

# Check for active agents
check_active_agents() {
    echo "🤖 Checking for active agents..."
    discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 20 | grep "AGENT_START\|AGENT_END" | head -10
}

echo "Discord Bot API functions loaded!"
echo "Bot Token: ${DISCORD_BOT_TOKEN:0:10}..."
echo ""
echo "Available functions:"
echo "  test_bot_connection     - Test if bot is working"
echo "  check_active_agents     - See who's currently working"
echo "  check_file_conflicts    - Check if file is already reserved"
echo "  reserve_file           - Reserve a file for editing"
echo "  release_file           - Release a file when done"
echo "  agent_start            - Announce agent session start"
echo "  agent_end              - Announce agent session end"
echo "  say_discord            - Post from stdin (robust)"
echo "  sayf_discord           - Post from file (robust)"
echo "  discord_list_attachments - List attachment URLs"