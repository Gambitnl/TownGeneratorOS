#!/usr/bin/env bash
set -euo pipefail

# Persistent Agent Monitor - Keeps agents active and responsive
# Usage: ./persistent-agent-monitor.sh [AGENT_NAME]

AGENT_NAME="${1:-Claude}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_INTERVAL=30  # Start with 30 seconds
MAX_INTERVAL=300     # Max 5 minutes
LAST_MESSAGE_ID=""
IDLE_COUNT=0

# Load Discord functions
source "$SCRIPT_DIR/discord-bot-functions.sh"

# Keep-alive mechanism
keep_agent_alive() {
    local current_time=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$current_time] Agent $AGENT_NAME monitoring Discord..."

    # This prevents inference from ending by continuously processing
    # The agent stays "thinking" about coordination
    return 0
}

# Check for new messages and respond
check_for_new_activity() {
    local channel_id="$DISCORD_AGENT_STATUS_CHANNEL"
    local recent_messages

    # Get recent messages
    recent_messages=$(discord_read_messages "$channel_id" 5 2>/dev/null || echo "")

    if [ -n "$recent_messages" ]; then
        # Look for new activity since last check
        local latest_message_id=$(echo "$recent_messages" | head -1 | grep -o 'id":"[^"]*' | cut -d'"' -f3 || echo "")

        if [ "$latest_message_id" != "$LAST_MESSAGE_ID" ] && [ -n "$latest_message_id" ]; then
            echo "🔔 NEW ACTIVITY DETECTED!"
            LAST_MESSAGE_ID="$latest_message_id"
            IDLE_COUNT=0
            MONITOR_INTERVAL=30  # Reset to frequent checking

            # Check for mentions or coordination requests
            echo "$recent_messages" | while read -r line; do
                if [[ "$line" =~ $AGENT_NAME|@$AGENT_NAME|CONFLICT|HELP|URGENT ]]; then
                    echo "📢 ATTENTION REQUIRED: $line"
                    respond_to_mention "$line"
                fi
            done

            return 0
        fi
    fi

    # No new activity - increase interval
    IDLE_COUNT=$((IDLE_COUNT + 1))
    if [ $IDLE_COUNT -gt 3 ]; then
        MONITOR_INTERVAL=$((MONITOR_INTERVAL * 2))
        if [ $MONITOR_INTERVAL -gt $MAX_INTERVAL ]; then
            MONITOR_INTERVAL=$MAX_INTERVAL
        fi
    fi

    return 1
}

# Respond to mentions or coordination needs
respond_to_mention() {
    local message="$1"
    local timestamp=$(date +"%H:%M")

    # Auto-respond to certain patterns
    if [[ "$message" =~ CONFLICT ]]; then
        discord_send_message "$DISCORD_CONFLICTS_CHANNEL" \
            "🤖 [$timestamp] $AGENT_NAME: Monitoring conflict situation - ready to assist"
    elif [[ "$message" =~ HELP.*$AGENT_NAME ]]; then
        discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" \
            "🆘 [$timestamp] $AGENT_NAME: I'm here! How can I help with coordination?"
    elif [[ "$message" =~ @$AGENT_NAME|$AGENT_NAME ]]; then
        discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" \
            "👋 [$timestamp] $AGENT_NAME: Acknowledged - monitoring and ready for coordination"
    fi
}

# Send periodic heartbeat
send_heartbeat() {
    local current_hour=$(date +%H)
    local current_minute=$(date +%M)

    # Send heartbeat every hour at :00 minutes
    if [ "$current_minute" = "00" ]; then
        local timestamp=$(date +"%H:%M")
        discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" \
            "💓 [$timestamp] $AGENT_NAME: Active and monitoring (heartbeat)"
    fi
}

# Main monitoring loop
persistent_monitor() {
    echo "🚀 Starting persistent monitoring for $AGENT_NAME"
    echo "   Check interval: ${MONITOR_INTERVAL}s (adaptive: 30s-300s)"
    echo "   Channels: Status, Conflicts, File Reservations"
    echo "   Press Ctrl+C to stop"

    # Initial heartbeat
    local timestamp=$(date +"%H:%M")
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" \
        "🟢 [$timestamp] $AGENT_NAME: Persistent monitoring started - always active"

    while true; do
        # Keep agent alive (prevents inference ending)
        keep_agent_alive

        # Check for activity
        if check_for_new_activity; then
            echo "   Next check in ${MONITOR_INTERVAL}s (activity detected)"
        else
            echo "   Next check in ${MONITOR_INTERVAL}s (idle count: $IDLE_COUNT)"
        fi

        # Send periodic heartbeat
        send_heartbeat

        # Wait before next check
        sleep "$MONITOR_INTERVAL"
    done
}

# Signal handler for graceful shutdown
cleanup() {
    local timestamp=$(date +"%H:%M")
    echo ""
    echo "🛑 Shutting down persistent monitoring..."
    discord_send_message "$DISCORD_AGENT_STATUS_CHANNEL" \
        "🔴 [$timestamp] $AGENT_NAME: Persistent monitoring stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
persistent_monitor