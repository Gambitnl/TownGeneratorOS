#!/usr/bin/env bash
set -euo pipefail

# Agent Identity Manager - Prevents token entanglement and ensures proper identity
# Usage: source agent-identity-manager.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDENTITY_CACHE_DIR="${HOME:-/tmp}/.agent-identity-cache"
DISCORD_CONFIG_PATHS=(
    "$SCRIPT_DIR/../config/.env"
    "./discord/config/.env"
    "./.env"
    "${HOME}/.config/discord-agents/.env"
    "/tmp/discord-agents/.env"
)

# Create identity cache directory
mkdir -p "$IDENTITY_CACHE_DIR"

# Agent identity verification with strict checking
verify_agent_identity() {
    local expected_agent="$1"
    local bot_token="$2"

    if [ -z "$bot_token" ]; then
        echo "[!] ERROR: No bot token provided for $expected_agent" >&2
        return 1
    fi

    # Check cached identity first
    local cache_file="$IDENTITY_CACHE_DIR/${bot_token:0:10}.identity"
    if [ -f "$cache_file" ]; then
        local cached_identity
        cached_identity=$(cat "$cache_file")
        if [ "$cached_identity" = "$expected_agent" ]; then
            echo "[✓] Identity verified from cache: $expected_agent"
            return 0
        else
            echo "[!] ERROR: Token belongs to $cached_identity, not $expected_agent" >&2
            return 1
        fi
    fi

    # Verify identity with Discord API
    local api_response
    api_response=$(curl -s -H "Authorization: Bot $bot_token" \
        "https://discord.com/api/v10/users/@me" 2>/dev/null || echo '{}')

    if ! command -v jq >/dev/null 2>&1; then
        echo "[!] WARNING: jq not available, skipping identity verification" >&2
        return 0
    fi

    local actual_username
    actual_username=$(echo "$api_response" | jq -r '.username // empty')

    if [ -z "$actual_username" ]; then
        echo "[!] ERROR: Failed to verify bot identity (API call failed)" >&2
        return 1
    fi

    # Expected username mapping
    local expected_username
    case "$expected_agent" in
        "Claude"|"Claude (Sonnet 4)") expected_username="ClaudeCLI" ;;
        "Codex"|"OpenAI Codex") expected_username="CodexCLI" ;;
        "Gemini"|"Gemini Pro") expected_username="GeminiCLI" ;;
        *) expected_username="$expected_agent" ;;
    esac

    if [ "$actual_username" != "$expected_username" ]; then
        echo "[!] ERROR: Identity mismatch!" >&2
        echo "    Expected: $expected_username (for agent $expected_agent)" >&2
        echo "    Actual:   $actual_username" >&2
        echo "    Token:    ${bot_token:0:20}..." >&2
        return 1
    fi

    # Cache successful verification
    echo "$expected_agent" > "$cache_file"
    echo "[✓] Identity verified and cached: $expected_agent → $actual_username"
    return 0
}

# Smart Discord configuration discovery
discover_discord_config() {
    local agent_name="$1"
    local found_config=""

    echo "[🔍] Discovering Discord configuration for $agent_name..."

    # Try each potential config path
    for config_path in "${DISCORD_CONFIG_PATHS[@]}"; do
        # Expand relative paths
        local expanded_path
        if [[ "$config_path" == ./* ]]; then
            expanded_path="$(pwd)/${config_path#./}"
        else
            expanded_path="$config_path"
        fi

        if [ -f "$expanded_path" ]; then
            echo "[📁] Found config: $expanded_path"

            # Test if this config contains a valid token
            local test_token
            test_token=$(grep -m1 '^DISCORD_BOT_TOKEN=' "$expanded_path" 2>/dev/null | cut -d'"' -f2 || true)

            if [ -n "$test_token" ] && [ "$test_token" != "YOUR_BOT_TOKEN_HERE" ]; then
                # Verify this token belongs to our agent
                if verify_agent_identity "$agent_name" "$test_token"; then
                    found_config="$expanded_path"
                    break
                else
                    echo "[⚠️] Config found but token belongs to different agent"
                fi
            else
                echo "[⚠️] Config found but no valid token"
            fi
        fi
    done

    if [ -z "$found_config" ]; then
        echo "[!] ERROR: No valid Discord configuration found for $agent_name" >&2
        echo "    Searched paths:" >&2
        printf '      %s\n' "${DISCORD_CONFIG_PATHS[@]}" >&2
        return 1
    fi

    echo "[✅] Using Discord config: $found_config"
    echo "$found_config"
}

# Load Discord configuration with identity verification
load_discord_config_safe() {
    local agent_name="$1"

    # Discover and verify config
    local config_file
    if ! config_file=$(discover_discord_config "$agent_name"); then
        echo "[!] ERROR: Failed to discover Discord configuration" >&2
        return 1
    fi

    if [ -z "$config_file" ]; then
        echo "[!] ERROR: No configuration file found" >&2
        return 1
    fi

    # Load configuration
    echo "[📋] Loading Discord configuration..."
    # shellcheck disable=SC1090
    source "$config_file"

    # Final verification
    if ! verify_agent_identity "$agent_name" "$DISCORD_BOT_TOKEN"; then
        echo "[!] ERROR: Final identity verification failed" >&2
        return 1
    fi

    # Set agent-specific environment
    export CURRENT_AGENT_NAME="$agent_name"
    export DISCORD_CONFIG_FILE="$config_file"

    echo "[🚀] Discord configuration loaded successfully for $agent_name"
    return 0
}

# Create agent-specific configuration
create_agent_config() {
    local agent_name="$1"
    local bot_token="$2"
    local guild_id="$3"

    # Verify token belongs to this agent
    if ! verify_agent_identity "$agent_name" "$bot_token"; then
        echo "[!] ERROR: Token verification failed during config creation" >&2
        return 1
    fi

    # Create agent-specific config directory
    local config_dir="${HOME}/.config/discord-agents"
    mkdir -p "$config_dir"

    local config_file="$config_dir/${agent_name,,}.env"

    cat > "$config_file" << EOF
# Discord Configuration for $agent_name
# Auto-generated on $(date)

DISCORD_BOT_TOKEN="$bot_token"
DISCORD_GUILD_ID="$guild_id"

# Channel IDs - these should be the same for all agents
DISCORD_AGENT_STATUS_CHANNEL="1406446098138714113"
DISCORD_FILE_RESERVATIONS_CHANNEL="1406446140954091540"
DISCORD_ACTIVE_WORK_CHANNEL="1406446168422060054"
DISCORD_CONFLICTS_CHANNEL="1406446206170914816"
DISCORD_COMPLETED_WORK_CHANNEL="1406446226693726248"

# Agent identity marker
AGENT_NAME="$agent_name"
CONFIG_CREATED="$(date -Iseconds)"
EOF

    echo "[✅] Created agent configuration: $config_file"
    echo "$config_file"
}

# Test Discord connection with identity verification
test_discord_connection() {
    local agent_name="${1:-$CURRENT_AGENT_NAME}"

    if [ -z "$agent_name" ]; then
        echo "[!] ERROR: No agent name provided" >&2
        return 1
    fi

    if [ -z "${DISCORD_BOT_TOKEN:-}" ]; then
        echo "[!] ERROR: No Discord bot token loaded" >&2
        return 1
    fi

    echo "[🔄] Testing Discord connection for $agent_name..."

    # Test API connection
    local api_response
    api_response=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "https://discord.com/api/v10/users/@me" 2>/dev/null || echo '{}')

    if command -v jq >/dev/null 2>&1; then
        local username
        username=$(echo "$api_response" | jq -r '.username // empty')

        if [ -n "$username" ]; then
            echo "[✅] Connected as: $username"

            # Verify identity
            if verify_agent_identity "$agent_name" "$DISCORD_BOT_TOKEN"; then
                echo "[✅] Identity verification passed"
                return 0
            else
                echo "[!] ERROR: Identity verification failed" >&2
                return 1
            fi
        else
            echo "[!] ERROR: Discord API connection failed" >&2
            return 1
        fi
    else
        echo "[⚠️] jq not available, basic connection test only"
        if [[ "$api_response" == *"username"* ]]; then
            echo "[✅] Discord API responds (basic test)"
            return 0
        else
            echo "[!] ERROR: Discord API connection failed" >&2
            return 1
        fi
    fi
}

# Show agent identity status
show_identity_status() {
    echo "=== Agent Identity Status ==="
    echo "Current Agent: ${CURRENT_AGENT_NAME:-'Not set'}"
    echo "Config File: ${DISCORD_CONFIG_FILE:-'Not loaded'}"
    echo "Bot Token: ${DISCORD_BOT_TOKEN:+${DISCORD_BOT_TOKEN:0:20}...} ${DISCORD_BOT_TOKEN:-'Not set'}"

    if [ -n "${CURRENT_AGENT_NAME:-}" ] && [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
        echo "Connection Test:"
        if test_discord_connection; then
            echo "✅ All systems go!"
        else
            echo "❌ Connection issues detected"
        fi
    fi
    echo "============================"
}

# Clear identity cache (for troubleshooting)
clear_identity_cache() {
    local confirm="${1:-}"

    if [ "$confirm" != "yes" ]; then
        echo "This will clear all cached agent identities."
        echo "Run: clear_identity_cache yes"
        return 0
    fi

    rm -rf "$IDENTITY_CACHE_DIR"
    echo "[✅] Identity cache cleared"
}

echo "[📦] Agent Identity Manager loaded"
echo "Commands: verify_agent_identity, discover_discord_config, load_discord_config_safe"
echo "          create_agent_config, test_discord_connection, show_identity_status"