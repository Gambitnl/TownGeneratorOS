#!/bin/bash

# Discord Polling System for Live Agent Coordination
# Usage: ./discord-polling.sh start|stop|status

POLL_INTERVAL=10  # seconds between checks
PIDFILE="/tmp/discord-polling.pid"
LOGFILE="/tmp/discord-polling.log"

# Resolve script dir and load env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../config/.env" ]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/../config/.env"
fi

# Load Discord functions
# shellcheck disable=SC1091
source "$SCRIPT_DIR/discord-bot-functions.sh"

start_polling() {
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "❌ Polling already running (PID: $(cat $PIDFILE))"
        return 1
    fi
    
    echo "🚀 Starting Discord polling (every ${POLL_INTERVAL}s)..."
    echo "📋 Log: $LOGFILE"
    
    # Start background polling process
    {
        echo "[$(date)] Discord polling started"
        
        while true; do
            # Check for new agent messages
            check_new_agent_activity
            
            # Check for conflict alerts
            check_conflict_alerts
            
            # Check for urgent messages (mentions, etc.)
            check_urgent_messages
            
            sleep $POLL_INTERVAL
        done
    } > "$LOGFILE" 2>&1 &
    
    echo $! > "$PIDFILE"
    echo "✅ Polling started (PID: $!)"
}

stop_polling() {
    if [ ! -f "$PIDFILE" ]; then
        echo "❌ No polling process found"
        return 1
    fi
    
    local pid=$(cat "$PIDFILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid"
        rm -f "$PIDFILE"
        echo "✅ Polling stopped (PID: $pid)"
    else
        echo "❌ Process $pid not running"
        rm -f "$PIDFILE"
    fi
}

status_polling() {
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "✅ Polling active (PID: $(cat $PIDFILE))"
        echo "📋 Recent activity:"
        tail -5 "$LOGFILE" 2>/dev/null || echo "No log entries yet"
    else
        echo "❌ Polling not running"
    fi
}

# Check for new agent start/end messages
check_new_agent_activity() {
    local recent_messages=$(discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 5 2>/dev/null)
    
    # Look for recent AGENT_START/AGENT_END (within last 2 minutes)
    echo "$recent_messages" | while read line; do
        if [[ "$line" =~ AGENT_START.*[^Claude\ \(Sonnet\ 4\)] ]]; then
            echo "[$(date)] 🟢 NEW AGENT: $line"
            notify_agent_activity "$line"
        elif [[ "$line" =~ AGENT_END ]]; then
            echo "[$(date)] 🔴 AGENT ENDED: $line"
        fi
    done
}

# Check for conflict alerts
check_conflict_alerts() {
    local conflict_messages=$(discord_read_messages "$DISCORD_CONFLICTS_CHANNEL" 3 2>/dev/null)
    
    echo "$conflict_messages" | while read line; do
        if [[ "$line" =~ CONFLICT.*Claude ]]; then
            echo "[$(date)] ⚠️  CONFLICT ALERT: $line"
            notify_conflict "$line"
        fi
    done
}

# Check for urgent messages (mentions, direct requests)
check_urgent_messages() {
    # Check active work channel for mentions or help requests
    local work_messages=$(discord_read_messages "$DISCORD_ACTIVE_WORK_CHANNEL" 3 2>/dev/null)
    
    echo "$work_messages" | while read line; do
        if [[ "$line" =~ @|help|urgent|priority ]]; then
            echo "[$(date)] 🚨 URGENT: $line"
            notify_urgent "$line"
        fi
    done
}

# Notification handlers
notify_agent_activity() {
    local message="$1"
    echo "📢 Agent Activity: $message" >> /tmp/discord-alerts.log
}

notify_conflict() {
    local message="$1"
    echo "⚠️  CONFLICT: $message" >> /tmp/discord-alerts.log
    # Could also send system notification, email, etc.
}

notify_urgent() {
    local message="$1"
    echo "🚨 URGENT: $message" >> /tmp/discord-alerts.log
}

# Get recent alerts
get_alerts() {
    if [ -f "/tmp/discord-alerts.log" ]; then
        echo "📢 Recent Discord Alerts:"
        tail -10 /tmp/discord-alerts.log
    else
        echo "📢 No alerts yet"
    fi
}

# Command handling
case "$1" in
    start)
        start_polling
        ;;
    stop)
        stop_polling
        ;;
    status)
        status_polling
        ;;
    alerts)
        get_alerts
        ;;
    restart)
        stop_polling
        sleep 1
        start_polling
        ;;
    *)
        echo "Usage: $0 {start|stop|status|alerts|restart}"
        echo ""
        echo "Commands:"
        echo "  start    - Start background Discord polling"
        echo "  stop     - Stop polling process"
        echo "  status   - Check if polling is running"
        echo "  alerts   - Show recent alerts/notifications"
        echo "  restart  - Stop and restart polling"
        echo ""
        echo "Logs: $LOGFILE"
        echo "Alerts: /tmp/discord-alerts.log"
        exit 1
        ;;
esac
