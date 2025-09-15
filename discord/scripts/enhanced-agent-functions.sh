#!/usr/bin/env bash
set -euo pipefail

# Enhanced Agent Functions with Live Discord Monitoring
# Source this file: source discord/scripts/enhanced-agent-functions.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_DIR="$SCRIPT_DIR/../config"

# Load env if present
if [ -f "$CONF_DIR/.env" ]; then
  # shellcheck disable=SC1091
  source "$CONF_DIR/.env"
fi

detect_and_load_bot_functions() {
  local env_file="$CONF_DIR/.env"
  if [ -f "$env_file" ]; then
    local token
    token=$(grep -m1 '^DISCORD_BOT_TOKEN=' "$env_file" | cut -d'"' -f2)
    case "${token:-}" in
      MTQwNjQxODU2MDU5NDQ4MTIzNQ*) source "$SCRIPT_DIR/discord-bot-functions-claude.sh" ;;
      MTQwNzMzOTQxNTEwMTI0MzQ0NQ*) source "$SCRIPT_DIR/discord-bot-functions-codex.sh" ;;
      MTQwNzQ4OTc2ODg5NTU0OTQ5MQ*) source "$SCRIPT_DIR/discord-bot-functions-gemini.sh" ;;
      *) source "$SCRIPT_DIR/discord-bot-functions.sh" ;;
    esac
  else
    echo "[!] No env file found at $env_file" >&2
    return 1
  fi
}

detect_and_load_bot_functions

start_agent_session() {
  local agent_name="$1"; shift || true
  local task_description="${1:-}"
  if ! "$SCRIPT_DIR/discord-polling.sh" status >/dev/null 2>&1; then
    "$SCRIPT_DIR/discord-polling.sh" start >/dev/null 2>&1 || true
    sleep 1
  fi
  agent_start "$agent_name" "$task_description"
}

end_agent_session() {
  local agent_name="$1"; shift || true
  local keep_polling="${1:-false}"
  agent_end "$agent_name"
  if [ "$keep_polling" != "true" ]; then
    "$SCRIPT_DIR/discord-polling.sh" stop >/dev/null 2>&1 || true
  fi
}

check_coordination() {
  "$SCRIPT_DIR/discord-polling.sh" status
  echo
  "$SCRIPT_DIR/discord-polling.sh" alerts | tail -3 || true
  echo
  echo "Active agents:"
  check_active_agents
}

reserve_file_live() {
  local agent_name="$1"; local file_path="$2"
  echo "Checking Discord for conflicts on: $file_path"
  local conflicts
  conflicts=$(check_file_conflicts "$file_path" 2>/dev/null || true)
  if [ -n "$conflicts" ]; then
    echo "$conflicts"
    echo "Cannot reserve file - conflicts detected!" >&2
    return 1
  fi
  reserve_file "$agent_name" "$file_path"
}

monitor_file() {
  local file_path="$1"; local duration="${2:-300}"
  local end_time=$(( $(date +%s) + duration ))
  while [ "$(date +%s)" -lt "$end_time" ]; do
    local conflicts
    conflicts=$(check_file_conflicts "$file_path" 2>/dev/null || true)
    [ -n "$conflicts" ] && echo "[conflict] $conflicts"
    sleep 30
  done
}

progress_with_monitoring() {
  local agent_name="$1"; local progress="$2"; local task="$3"
  progress_update "$agent_name" "$progress" "$task"
  "$SCRIPT_DIR/discord-polling.sh" alerts | tail -3 || true
}

emergency_stop() {
  local agent_name="$1"; local reason="${2:-Emergency stop requested}"
  report_conflict "$agent_name" "$reason"
  agent_end "$agent_name"
  "$SCRIPT_DIR/discord-polling.sh" stop >/dev/null 2>&1 || true
}

show_enhanced_help() {
  cat <<EOF
Enhanced Agent Functions with Live Discord Monitoring

Session:
  start_agent_session 'Agent' 'task'   - Start + begin polling
  end_agent_session 'Agent' [keep]     - End session (keep=true to keep polling)

Live Coordination:
  check_coordination                   - Show polling status and recent alerts
  reserve_file_live 'Agent' 'file'     - Reserve with conflict check
  progress_with_monitoring 'Agent' '50%' 'task' - Progress + quick check
  monitor_file 'file' [seconds]        - Monitor a file for conflicts
EOF
}

