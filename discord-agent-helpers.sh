#!/bin/bash

# Discord Agent Helper Functions
# Source this file in agent scripts: source discord-agent-helpers.sh

# Set your webhook URLs here (get from Discord channel settings)
AGENT_STATUS_WEBHOOK="https://discord.com/api/webhooks/1406416325697339554/mjNw9Me4R2AVvK2YnN_YfpGAI2E3-YK0j8yp7PtnlFISUbT5RZGQEC702HlBj7CruxT3"
FILE_RESERVATIONS_WEBHOOK="https://discord.com/api/webhooks/1406416325697339554/mjNw9Me4R2AVvK2YnN_YfpGAI2E3-YK0j8yp7PtnlFISUbT5RZGQEC702HlBj7CruxT3"
ACTIVE_WORK_WEBHOOK="https://discord.com/api/webhooks/1406416325697339554/mjNw9Me4R2AVvK2YnN_YfpGAI2E3-YK0j8yp7PtnlFISUbT5RZGQEC702HlBj7CruxT3"
CONFLICTS_WEBHOOK="https://discord.com/api/webhooks/1406416325697339554/mjNw9Me4R2AVvK2YnN_YfpGAI2E3-YK0j8yp7PtnlFISUbT5RZGQEC702HlBj7CruxT3"
COMPLETED_WORK_WEBHOOK="https://discord.com/api/webhooks/1406416325697339554/mjNw9Me4R2AVvK2YnN_YfpGAI2E3-YK0j8yp7PtnlFISUbT5RZGQEC702HlBj7CruxT3"

# Get current timestamp in HH:MM format
get_timestamp() {
    date +"%H:%M"
}

# Send message to Discord channel
send_discord_message() {
    local webhook_url="$1"
    local message="$2"
    local agent_name="${3:-Agent}"
    
    curl -s -X POST "$webhook_url" \
      -H "Content-Type: application/json" \
      -d "{
        \"content\": \"$message\",
        \"username\": \"$agent_name\"
      }"
}

# Agent lifecycle functions
agent_start() {
    local agent_name="$1"
    local task="$2"
    local timestamp=$(get_timestamp)
    send_discord_message "$AGENT_STATUS_WEBHOOK" "🟢 [$timestamp] AGENT_START: $agent_name starting work on $task" "$agent_name"
}

agent_end() {
    local agent_name="$1"
    local timestamp=$(get_timestamp)
    send_discord_message "$AGENT_STATUS_WEBHOOK" "🔴 [$timestamp] AGENT_END: $agent_name session complete" "$agent_name"
}

# File reservation functions
reserve_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    send_discord_message "$FILE_RESERVATIONS_WEBHOOK" "🔒 [$timestamp] FILE_RESERVE: $file_path - $agent_name" "$agent_name"
}

release_file() {
    local agent_name="$1"
    local file_path="$2"
    local timestamp=$(get_timestamp)
    send_discord_message "$FILE_RESERVATIONS_WEBHOOK" "✅ [$timestamp] FILE_RELEASE: $file_path - $agent_name" "$agent_name"
}

# Progress updates
progress_update() {
    local agent_name="$1"
    local progress="$2"
    local task="$3"
    local timestamp=$(get_timestamp)
    send_discord_message "$ACTIVE_WORK_WEBHOOK" "⚙️ [$timestamp] PROGRESS: $progress - $task - $agent_name" "$agent_name"
}

# Conflict reporting
report_conflict() {
    local agent_name="$1"
    local conflict_description="$2"
    local timestamp=$(get_timestamp)
    send_discord_message "$CONFLICTS_WEBHOOK" "⚠️ [$timestamp] CONFLICT: $conflict_description - $agent_name" "$agent_name"
}

# Task completion
task_complete() {
    local agent_name="$1"
    local task="$2"
    local summary="$3"
    local timestamp=$(get_timestamp)
    send_discord_message "$COMPLETED_WORK_WEBHOOK" "🏁 [$timestamp] AGENT_COMPLETE: $agent_name finished $task - $summary" "$agent_name"
}

echo "Discord agent helper functions loaded!"
echo "Remember to set your webhook URLs in this file!"