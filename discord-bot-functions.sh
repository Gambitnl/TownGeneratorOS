#!/bin/bash

# Discord Bot API Functions
# Source this file: source discord-bot-functions.sh

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

# Ensure the current bot identity matches expected username (default: CodexCLI)
ensure_bot_identity() {
    local expected="${EXPECTED_BOT_USERNAME:-CodexCLI}"
    if ! command -v jq >/dev/null 2>&1; then
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
        return 1
    fi
    return 0
}

# Send message to Discord channel via Bot API
discord_send_message() {
    local channel_id="$1"
    local message="$2"
    local username="${3:-Agent Coordinator}"
    
    curl -s -X POST "$DISCORD_API/channels/$channel_id/messages" \
        -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"content\": \"$message\"
        }"
}

# Internal: GET with basic rate-limit handling and cache-busting
_discord_get_with_rl() {
    local url="$1"
    local headers_file body_file code retry remain reset_after
    headers_file=$(mktemp)
    body_file=$(mktemp)
    # Add a cache-buster to avoid stale CDN/proxy responses
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
        # 429 handling
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

# Read recent messages from Discord channel (robust, with fallbacks)
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
        # Fallback: raw JSON if jq is unavailable
        echo "$resp"
    fi
}

# Read messages after a given message ID (for pagination-forward polling)
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

# Check for agent conflicts by reading file reservations
check_file_conflicts() {
    local file_path="$1"
    echo "🔍 Checking Discord for conflicts on: $file_path"
    
    local recent_messages=$(discord_read_messages "$DISCORD_FILE_RESERVATIONS_CHANNEL" 50)
    
    # Look for FILE_RESERVE messages that haven't been released
    echo "$recent_messages" | grep "FILE_RESERVE.*$file_path" | while read line; do
        local agent=$(echo "$line" | grep -o "[A-Za-z]* ([^)]*)" | tail -1)
        if [ ! -z "$agent" ]; then
            echo "⚠️  CONFLICT: File $file_path is reserved by $agent"
            echo "   $line"
        fi
    done
}

# Check active agents
check_active_agents() {
    echo "🤖 Checking for active agents..."
    local recent_messages=$(discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 20)
    
    # Find AGENT_START messages without corresponding AGENT_END
    echo "$recent_messages" | grep "AGENT_START\|AGENT_END" | head -10
}

# Agent lifecycle functions (Bot API versions)
agent_start() {
    local agent_name="$1"
    local task="$2"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🟢 [$timestamp] AGENT_START: $agent_name starting work on $task"
}

agent_end() {
    local agent_name="$1"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" "🔴 [$timestamp] AGENT_END: $agent_name session complete"
}

# File reservation functions
reserve_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    
    # Check for conflicts first
    local conflicts=$(check_file_conflicts "$file_path")
    if [ ! -z "$conflicts" ]; then
        echo "$conflicts"
        echo "❌ Cannot reserve file - conflicts detected!"
        return 1
    fi
    
    discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "🔒 [$timestamp] FILE_RESERVE: $file_path - $agent_name"
    echo "✅ File reserved: $file_path"
}

release_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_FILE_RESERVATIONS_CHANNEL" "✅ [$timestamp] FILE_RELEASE: $file_path - $agent_name"
    echo "✅ File released: $file_path"
}

# Progress updates
progress_update() {
    local agent_name="$1"
    local progress="$2"
    local task="$3"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_ACTIVE_WORK_CHANNEL" "⚙️ [$timestamp] PROGRESS: $progress - $task - $agent_name"
}

# Conflict reporting
report_conflict() {
    local agent_name="$1"
    local conflict_description="$2"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_CONFLICTS_CHANNEL" "⚠️ [$timestamp] CONFLICT: $conflict_description - $agent_name"
}

# Task completion
task_complete() {
    local agent_name="$1"
    local task="$2"
    local summary="$3"
    local timestamp=$(get_timestamp)
    discord_send_message "$DISCORD_COMPLETED_WORK_CHANNEL" "🏁 [$timestamp] AGENT_COMPLETE: $agent_name finished $task - $summary"
}

# Test bot connection
test_bot_connection() {
    echo "🧪 Testing Discord Bot API connection..."
    
    local test_response=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "$DISCORD_API/users/@me")
    
    local bot_username=$(echo "$test_response" | jq -r '.username' 2>/dev/null)
    
    if [ "$bot_username" != "null" ] && [ ! -z "$bot_username" ]; then
        echo "✅ Bot connected successfully as: $bot_username"
        return 0
    else
        echo "❌ Bot connection failed. Check your bot token."
        echo "Response: $test_response"
        return 1
    fi
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

# Override: robust JSON sender using jq piping to curl with identity guard
discord_send_message() {
    local channel_id="$1"
    local message="$2"
    local username="${3:-Agent Coordinator}"
    # Guard: ensure we are posting as the expected bot (default CodexCLI)
    if command -v ensure_bot_identity >/dev/null 2>&1; then
        ensure_bot_identity || { echo "❌ Refusing to post: wrong bot identity" >&2; return 1; }
    fi
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

# List recent attachment URLs from a channel
discord_list_attachments() {
    local channel_id="$1"
    local limit="${2:-20}"
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required" >&2
        return 1
    fi

    local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit"
    curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "$url" \
        | jq -r '.[]
            | select(.attachments|length>0)
            | . as $m
            | $m.attachments[]
            | "[" + ($m.timestamp[0:16]) + "] " + $m.author.username + " -> " + .url'
}

# Get the most recent attachment URL from a channel
discord_last_attachment_url() {
    local channel_id="$1"
    local limit="${2:-30}"
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required" >&2
        return 1
    fi

    local url="$DISCORD_API/channels/$channel_id/messages?limit=$limit"
    curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "$url" \
        | jq -r '[.[]
            | select(.attachments|length>0)
            | .attachments[]
            | .url][0] // ""'
}
