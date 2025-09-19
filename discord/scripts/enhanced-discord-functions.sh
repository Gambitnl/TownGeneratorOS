#!/usr/bin/env bash
set -euo pipefail

# Enhanced Discord Functions with Identity Protection
# Replaces the previous enhanced-agent-functions.sh with better identity management

# Load identity manager first
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/agent-identity-manager.sh"

# Protected Discord operations with identity verification
protected_discord_send() {
    local channel_id="$1"
    local message="$2"
    local agent_name="${CURRENT_AGENT_NAME:-}"

    if [ -z "$agent_name" ]; then
        echo "[!] ERROR: No agent identity established" >&2
        return 1
    fi

    # Verify identity before sending
    if ! verify_agent_identity "$agent_name" "$DISCORD_BOT_TOKEN"; then
        echo "[!] ERROR: Identity verification failed before sending message" >&2
        echo "    Agent: $agent_name" >&2
        echo "    Token: ${DISCORD_BOT_TOKEN:0:20}..." >&2
        return 1
    fi

    # Send with identity confirmation
    discord_send_message "$channel_id" "$message"
}

# Enhanced session management with identity protection
start_agent_session_protected() {
    local agent_name="$1"
    local task_description="${2:-}"

    # Verify we have the right identity loaded
    if [ "${CURRENT_AGENT_NAME:-}" != "$agent_name" ]; then
        echo "[!] ERROR: Agent identity mismatch" >&2
        echo "    Requested: $agent_name" >&2
        echo "    Current: ${CURRENT_AGENT_NAME:-'None'}" >&2
        return 1
    fi

    # Start Discord polling if not running
    if ! "$SCRIPT_DIR/discord-polling.sh" status >/dev/null 2>&1; then
        echo "[🔄] Starting Discord polling..."
        "$SCRIPT_DIR/discord-polling.sh" start >/dev/null 2>&1 || true
        sleep 1
    fi

    # Send session start message with protection
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_AGENT_STATUS_CHANNEL" \
        "🟢 [$timestamp] AGENT_START: $agent_name starting work on $task_description"

    echo "[✅] Protected session started for $agent_name"
}

end_agent_session_protected() {
    local agent_name="$1"
    local keep_polling="${2:-false}"

    # Verify identity
    if [ "${CURRENT_AGENT_NAME:-}" != "$agent_name" ]; then
        echo "[!] WARNING: Agent identity mismatch during session end" >&2
    fi

    # Send session end message
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_AGENT_STATUS_CHANNEL" \
        "🔴 [$timestamp] AGENT_END: $agent_name session complete"

    # Stop polling unless requested to keep
    if [ "$keep_polling" != "true" ]; then
        echo "[🛑] Stopping Discord polling..."
        "$SCRIPT_DIR/discord-polling.sh" stop >/dev/null 2>&1 || true
    fi

    echo "[✅] Protected session ended for $agent_name"
}

# File operations with conflict detection and identity verification
reserve_file_protected() {
    local agent_name="$1"
    local file_path="$2"

    # Verify identity
    if [ "${CURRENT_AGENT_NAME:-}" != "$agent_name" ]; then
        echo "[!] ERROR: Cannot reserve file - identity mismatch" >&2
        return 1
    fi

    # Check for conflicts
    echo "[🔍] Checking Discord for conflicts on: $file_path"
    local conflicts
    conflicts=$(check_file_conflicts "$file_path" 2>/dev/null || true)

    if [ -n "$conflicts" ]; then
        echo "[⚠️] FILE CONFLICT DETECTED:" >&2
        echo "$conflicts" >&2
        echo "" >&2
        echo "Cannot reserve file - another agent has it reserved!" >&2
        return 1
    fi

    # Reserve file with protection
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_FILE_RESERVATIONS_CHANNEL" \
        "🔒 [$timestamp] FILE_RESERVE: $file_path - $agent_name"

    echo "[✅] File reserved: $file_path"
}

release_file_protected() {
    local agent_name="$1"
    local file_path="$2"

    # Verify identity
    if [ "${CURRENT_AGENT_NAME:-}" != "$agent_name" ]; then
        echo "[!] WARNING: Identity mismatch during file release" >&2
    fi

    # Release file
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_FILE_RESERVATIONS_CHANNEL" \
        "✅ [$timestamp] FILE_RELEASE: $file_path - $agent_name"

    echo "[✅] File released: $file_path"
}

# Progress updates with monitoring
progress_update_protected() {
    local agent_name="$1"
    local progress="$2"
    local task_description="$3"

    # Verify identity
    if [ "${CURRENT_AGENT_NAME:-}" != "$agent_name" ]; then
        echo "[!] WARNING: Identity mismatch during progress update" >&2
    fi

    # Send progress update
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_ACTIVE_WORK_CHANNEL" \
        "⚙️ [$timestamp] PROGRESS: $progress - $task_description - $agent_name"

    # Show recent alerts
    echo "[📢] Recent coordination alerts:"
    "$SCRIPT_DIR/discord-polling.sh" alerts | tail -3 || true
}

# Enhanced coordination check with identity status
check_coordination_enhanced() {
    echo "=== Discord Coordination Status ==="

    # Show polling status
    "$SCRIPT_DIR/discord-polling.sh" status
    echo ""

    # Show identity status
    show_identity_status
    echo ""

    # Show recent alerts
    echo "Recent Discord Activity:"
    "$SCRIPT_DIR/discord-polling.sh" alerts | tail -5 || true
    echo ""

    # Show active agents
    echo "Active Agents (last 20 messages):"
    check_active_agents
    echo ""

    echo "==================================="
}

# Multi-file reservation with conflict detection
reserve_multiple_files() {
    local agent_name="$1"
    shift
    local files=("$@")

    echo "[🔍] Checking conflicts for ${#files[@]} files..."

    # First pass: check all files for conflicts
    local conflicts_found=false
    for file in "${files[@]}"; do
        local conflicts
        conflicts=$(check_file_conflicts "$file" 2>/dev/null || true)
        if [ -n "$conflicts" ]; then
            echo "[⚠️] CONFLICT on $file: $conflicts" >&2
            conflicts_found=true
        fi
    done

    if [ "$conflicts_found" = true ]; then
        echo "[!] Cannot reserve files - conflicts detected" >&2
        return 1
    fi

    # Second pass: reserve all files
    echo "[🔒] Reserving ${#files[@]} files..."
    for file in "${files[@]}"; do
        reserve_file_protected "$agent_name" "$file"
    done

    echo "[✅] All files reserved successfully"
}

# Bulk file release
release_multiple_files() {
    local agent_name="$1"
    shift
    local files=("$@")

    echo "[🔓] Releasing ${#files[@]} files..."
    for file in "${files[@]}"; do
        release_file_protected "$agent_name" "$file"
    done

    echo "[✅] All files released"
}

# Emergency stop with identity verification
emergency_stop_protected() {
    local agent_name="$1"
    local reason="${2:-Emergency stop requested}"

    echo "[🚨] EMERGENCY STOP for $agent_name: $reason"

    # Report conflict
    local timestamp=$(date +"%H:%M")
    protected_discord_send "$DISCORD_CONFLICTS_CHANNEL" \
        "🚨 [$timestamp] EMERGENCY_STOP: $agent_name - $reason"

    # End session
    end_agent_session_protected "$agent_name"

    # Stop polling
    "$SCRIPT_DIR/discord-polling.sh" stop >/dev/null 2>&1 || true

    echo "[✅] Emergency stop completed"
}

# File monitoring with identity context
monitor_file_protected() {
    local agent_name="$1"
    local file_path="$2"
    local duration="${3:-300}"

    echo "[👁️] Monitoring $file_path for $duration seconds..."

    local end_time=$(( $(date +%s) + duration ))
    local check_count=0

    while [ "$(date +%s)" -lt "$end_time" ]; do
        check_count=$((check_count + 1))

        # Check for conflicts
        local conflicts
        conflicts=$(check_file_conflicts "$file_path" 2>/dev/null || true)

        if [ -n "$conflicts" ]; then
            echo "[⚠️] Conflict detected at check #$check_count:"
            echo "$conflicts"

            # Alert in Discord
            local timestamp=$(date +"%H:%M")
            protected_discord_send "$DISCORD_CONFLICTS_CHANNEL" \
                "⚠️ [$timestamp] FILE_CONFLICT_DETECTED: $file_path - monitor by $agent_name detected conflict"
        fi

        sleep 30
    done

    echo "[✅] Monitoring completed for $file_path"
}

# Show available enhanced commands
show_enhanced_commands() {
    cat << 'EOF'
=== Enhanced Discord Functions with Identity Protection ===

Session Management:
  start_agent_session_protected 'Agent' 'task'
  end_agent_session_protected 'Agent' [keep_polling]
  emergency_stop_protected 'Agent' 'reason'

File Operations:
  reserve_file_protected 'Agent' 'file.ts'
  release_file_protected 'Agent' 'file.ts'
  reserve_multiple_files 'Agent' file1.ts file2.tsx file3.js
  release_multiple_files 'Agent' file1.ts file2.tsx file3.js

Communication:
  progress_update_protected 'Agent' '50%' 'task description'
  protected_discord_send 'channel_id' 'message'

Monitoring:
  check_coordination_enhanced
  monitor_file_protected 'Agent' 'file.ts' [seconds]

Identity Management:
  show_identity_status
  test_discord_connection
  verify_agent_identity 'Agent' 'token'

Setup:
  Load with: source universal-agent-bootstrap.sh [AGENT_NAME]

============================================================
EOF
}

# Backward compatibility aliases
start_agent_session() { start_agent_session_protected "$@"; }
end_agent_session() { end_agent_session_protected "$@"; }
reserve_file_live() { reserve_file_protected "$@"; }
progress_with_monitoring() { progress_update_protected "$@"; }
emergency_stop() { emergency_stop_protected "$@"; }
check_coordination() { check_coordination_enhanced; }

echo "[🛡️] Enhanced Discord Functions with Identity Protection loaded"
echo "Run 'show_enhanced_commands' for available functions"