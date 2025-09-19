#!/usr/bin/env bash
set -euo pipefail

# Universal Agent Bootstrap
# - Auto-detects Discord env under discord/config
# - Sets EXPECTED_BOT_USERNAME when possible
# - Sources core coordination functions
# - Provides protected wrappers with basic safety checks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONF_DIR="$SCRIPT_DIR/../config"

pick_env_file() {
  # preference order: explicit .env, then agent-specific templates if present
  local candidates=(
    "$CONF_DIR/.env"
    "$CONF_DIR/.env.codex"
    "$CONF_DIR/.env.gemini"
    "$CONF_DIR/.env.claude"
  )
  for f in "${candidates[@]}"; do
    if [[ -f "$f" ]]; then
      echo "$f"; return 0
    fi
  done
  return 1
}

ENV_FILE="${ENV_FILE:-}"
if [[ -z "${ENV_FILE:-}" ]]; then
  if ! ENV_FILE="$(pick_env_file)"; then
    echo "[bootstrap] No env file found in $CONF_DIR" >&2
    echo "  Create one from template: $CONF_DIR/.env.discord.template" >&2
    return 1 2>/dev/null || exit 1
  fi
fi

# Export env vars (simple parser)
while IFS='=' read -r k v; do
  [[ -z "$k" || "$k" =~ ^# ]] && continue
  export "$k"="${v%$'\r'}"
done < "$ENV_FILE"

# Infer expected bot username from env file name if not set
if [[ -z "${EXPECTED_BOT_USERNAME:-}" ]]; then
  case "$(basename "$ENV_FILE")" in
    .env.codex)  export EXPECTED_BOT_USERNAME="CodexCLI" ;;
    .env.gemini) export EXPECTED_BOT_USERNAME="GeminiCLI" ;;
    .env.claude) export EXPECTED_BOT_USERNAME="ClaudeCLI" ;;
    *) : ;;
  esac
fi

# Source core function libraries
# shellcheck disable=SC1091
source "$SCRIPT_DIR/discord-bot-functions.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/enhanced-agent-functions.sh"

echo "[bootstrap] Loaded env: $ENV_FILE"
if [[ -n "${EXPECTED_BOT_USERNAME:-}" ]]; then
  echo "[bootstrap] EXPECTED_BOT_USERNAME=$EXPECTED_BOT_USERNAME"
fi

has_cmd() { command -v "$1" >/dev/null 2>&1; }

show_identity_status() {
  echo "== Identity =="
  if has_cmd jq; then
    curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      "https://discord.com/api/v10/users/@me" | jq -r '{id, username, global_name}'
  else
    curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      "https://discord.com/api/v10/users/@me"
  fi
  if [[ -n "${EXPECTED_BOT_USERNAME:-}" ]]; then
    echo "Expected: $EXPECTED_BOT_USERNAME"
  fi
  echo
  echo "== Channels =="
  echo "AGENT_STATUS=$DISCORD_AGENT_STATUS_CHANNEL"
  echo "ACTIVE_WORK=$DISCORD_ACTIVE_WORK_CHANNEL"
  echo "FILE_RESERVATIONS=$DISCORD_FILE_RESERVATIONS_CHANNEL"
  echo "CONFLICTS=$DISCORD_CONFLICTS_CHANNEL"
  echo "COMPLETED_WORK=$DISCORD_COMPLETED_WORK_CHANNEL"
}

start_agent_session_protected() {
  local agent_name="$1"; shift || true
  local task_desc="${1:-}"
  if ! test_bot_connection >/dev/null 2>&1; then
    echo "[protect] Discord bot connection failed; aborting session start" >&2
    return 1
  fi
  start_agent_session "$agent_name" "$task_desc"
}

reserve_file_protected() {
  local agent_name="$1"; local file_path="$2"; shift 2 || true
  # Local lock integration if available
  if [[ -x "$REPO_ROOT/tools/agent-lock.sh" ]]; then
    if ! "$REPO_ROOT/tools/agent-lock.sh" check "$file_path" >/dev/null 2>&1; then
      echo "[protect] Local lock check failed or indicates conflict for $file_path" >&2
    fi
    "$REPO_ROOT/tools/agent-lock.sh" reserve "$file_path" --ttl 3600 >/dev/null 2>&1 || true
  fi
  reserve_file "$agent_name" "$file_path"
}

progress_update_protected() {
  local agent_name="$1"; local pct="$2"; local task="$3"; shift 3 || true
  progress_update "$agent_name" "$pct" "$task"
}

release_file_protected() {
  local agent_name="$1"; local file_path="$2"; shift 2 || true
  release_file "$agent_name" "$file_path"
  if [[ -x "$REPO_ROOT/tools/agent-lock.sh" ]]; then
    "$REPO_ROOT/tools/agent-lock.sh" release "$file_path" >/dev/null 2>&1 || true
  fi
}

end_agent_session_protected() {
  local agent_name="$1"; shift || true
  end_agent_session "$agent_name" true
}

echo "[bootstrap] Functions available:"
echo "  - show_identity_status"
echo "  - start_agent_session_protected 'Agent' 'task'"
echo "  - reserve_file_protected 'Agent' 'path/to/file'"
echo "  - progress_update_protected 'Agent' '50%' 'task'"
echo "  - release_file_protected 'Agent' 'path/to/file'"
echo "  - end_agent_session_protected 'Agent'"

