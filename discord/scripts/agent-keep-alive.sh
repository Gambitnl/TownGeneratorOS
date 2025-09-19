#!/usr/bin/env bash
set -euo pipefail

# Agent Keep-Alive System - Prevents inference from ending during coordination work
# Usage: source agent-keep-alive.sh

KEEP_ALIVE_ACTIVE=false
KEEP_ALIVE_PID=""
LAST_ACTIVITY_TIME=$(date +%s)

# Start keep-alive monitoring
start_keep_alive() {
    local agent_name="${1:-$USER}"

    if [ "$KEEP_ALIVE_ACTIVE" = "true" ]; then
        echo "⚠️ Keep-alive already active"
        return 0
    fi

    echo "🔄 Starting keep-alive monitoring for $agent_name"

    # Background process that prevents inference timeout
    {
        while true; do
            # Continuous processing to prevent inference end
            local current_time=$(date +%s)
            local time_since_activity=$((current_time - LAST_ACTIVITY_TIME))

            # Check Discord every 30-60 seconds (adaptive)
            local interval=30
            if [ $time_since_activity -gt 300 ]; then
                interval=60  # Less frequent when idle
            fi

            # Simulated "thinking" - keeps inference alive
            echo "🧠 [$agent_name] Monitoring coordination... (${time_since_activity}s since activity)" >&2

            # Check for Discord activity
            if command -v discord_read_messages >/dev/null 2>&1; then
                local recent_activity
                recent_activity=$(discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 3 2>/dev/null || echo "")

                if [[ "$recent_activity" =~ AGENT_START|FILE_RESERVE|CONFLICT|HELP ]]; then
                    LAST_ACTIVITY_TIME=$current_time
                    echo "📢 Discord activity detected - staying active" >&2
                fi
            fi

            sleep $interval
        done
    } &

    KEEP_ALIVE_PID=$!
    KEEP_ALIVE_ACTIVE=true

    echo "✅ Keep-alive started (PID: $KEEP_ALIVE_PID)"
    echo "   🎯 Prevents inference timeout during coordination"
    echo "   📡 Monitors Discord every 30-60s"
    echo "   🛑 Use stop_keep_alive to end monitoring"
}

# Stop keep-alive monitoring
stop_keep_alive() {
    if [ "$KEEP_ALIVE_ACTIVE" = "false" ]; then
        echo "⚠️ Keep-alive not active"
        return 0
    fi

    if [ -n "$KEEP_ALIVE_PID" ] && kill -0 "$KEEP_ALIVE_PID" 2>/dev/null; then
        kill "$KEEP_ALIVE_PID"
        echo "🛑 Keep-alive stopped (PID: $KEEP_ALIVE_PID)"
    fi

    KEEP_ALIVE_ACTIVE=false
    KEEP_ALIVE_PID=""
}

# Update activity timestamp (call this when doing coordination work)
update_activity() {
    LAST_ACTIVITY_TIME=$(date +%s)
    echo "🔄 Activity updated - keeping agent alive"
}

# Check if agent should stay active
should_stay_active() {
    local current_time=$(date +%s)
    local time_since_activity=$((current_time - LAST_ACTIVITY_TIME))

    # Stay active for up to 30 minutes after last activity
    if [ $time_since_activity -lt 1800 ]; then
        return 0  # Stay active
    else
        return 1  # Can safely end
    fi
}

# Enhanced coordination functions that update activity
enhanced_agent_start() {
    update_activity
    agent_start "$@"
}

enhanced_reserve_file() {
    update_activity
    reserve_file "$@"
}

enhanced_progress_update() {
    update_activity
    progress_update "$@"
}

enhanced_release_file() {
    update_activity
    release_file "$@"
}

# Trap signals for cleanup
cleanup_keep_alive() {
    stop_keep_alive
}

trap cleanup_keep_alive EXIT SIGINT SIGTERM

echo "🚀 Agent Keep-Alive System loaded"
echo "Commands:"
echo "  start_keep_alive [agent_name]  - Begin monitoring"
echo "  stop_keep_alive               - End monitoring"
echo "  update_activity               - Reset activity timer"
echo "  should_stay_active            - Check if agent should continue"