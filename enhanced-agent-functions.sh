#!/bin/bash

# Enhanced Agent Functions with Live Discord Monitoring
# Source this file: source enhanced-agent-functions.sh

# Load agent-specific Discord functions based on current bot token
detect_and_load_bot_functions() {
    if [ -f .env ]; then
        local token=$(grep "^DISCORD_BOT_TOKEN=" .env | cut -d'"' -f2)
        case "$token" in
            "MTQwNjQxODU2MDU5NDQ4MTIzNQ"*) # ClaudeCLI token prefix
                echo "🤖 Loading ClaudeCLI functions..."
                source discord-bot-functions-claude.sh
                ;;
            "MTQwNzMzOTQxNTEwMTI0MzQ0NQ"*) # CodexCLI token prefix
                echo "🤖 Loading CodexCLI functions..."
                source discord-bot-functions-codex.sh
                ;;
            "MTQwNzQ4OTc2ODg5NTU0OTQ5MQ"*) # GeminiCLI token prefix
                echo "🤖 Loading GeminiCLI functions..."
                source discord-bot-functions-gemini.sh
                ;;
            *)
                echo "⚠️  Unknown bot token, loading generic functions..."
                source discord-bot-functions.sh
                ;;
        esac
    else
        echo "⚠️  No .env file found!"
        return 1
    fi
}

# Load the appropriate Discord functions
detect_and_load_bot_functions

# Start an agent session with live monitoring
start_agent_session() {
    local agent_name="$1"
    local task_description="$2"
    
    echo "🚀 Starting agent session with live Discord monitoring..."
    
    # Start Discord polling if not already running
    if ! ./discord-polling.sh status >/dev/null 2>&1; then
        echo "📡 Starting Discord polling..."
        ./discord-polling.sh start
        sleep 2
    fi
    
    # Announce start
    agent_start "$agent_name" "$task_description"
    
    echo "✅ Agent session started with live monitoring"
    echo "💡 Use 'check_coordination' during your work to see live updates"
    echo "💡 Use 'end_agent_session' when finished"
}

# End agent session and stop polling if desired
end_agent_session() {
    local agent_name="$1"
    local keep_polling="${2:-false}"
    
    agent_end "$agent_name"
    
    if [ "$keep_polling" != "true" ]; then
        echo "🛑 Stopping Discord polling..."
        ./discord-polling.sh stop
    fi
    
    echo "✅ Agent session ended"
}

# Check live coordination status
check_coordination() {
    echo "🔍 Live Coordination Check:"
    echo ""
    
    # Show polling status
    ./discord-polling.sh status
    echo ""
    
    # Show recent alerts
    ./discord-polling.sh alerts
    echo ""
    
    # Show active agents
    echo "🤖 Active Agents:"
    check_active_agents
    echo ""
    
    # Show recent file activity
    echo "📁 Recent File Activity:"
    discord_read_messages "$DISCORD_FILE_RESERVATIONS_CHANNEL" 5 | head -3
}

# Reserve file with live conflict checking
reserve_file_live() {
    local agent_name="$1"
    local file_path="$2"
    
    echo "🔒 Attempting to reserve: $file_path"
    
    # Check for real-time conflicts
    echo "🔍 Checking live Discord for conflicts..."
    local conflicts=$(check_file_conflicts "$file_path")
    
    if [ ! -z "$conflicts" ]; then
        echo "⚠️  CONFLICT DETECTED:"
        echo "$conflicts"
        echo ""
        echo "💡 Options:"
        echo "  1. Wait and try again: reserve_file_live '$agent_name' '$file_path'"
        echo "  2. Check coordination: check_coordination"
        echo "  3. Work on different file"
        return 1
    fi
    
    # Reserve the file
    reserve_file "$agent_name" "$file_path"
    
    echo "✅ File reserved successfully with live monitoring"
}

# Monitor specific file for conflicts during work
monitor_file() {
    local file_path="$1"
    local duration="${2:-300}"  # 5 minutes default
    
    echo "👀 Monitoring $file_path for conflicts (${duration}s)..."
    
    local end_time=$(($(date +%s) + duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        local conflicts=$(check_file_conflicts "$file_path" 2>/dev/null)
        if [ ! -z "$conflicts" ]; then
            echo "⚠️  [$(date +%H:%M)] CONFLICT DETECTED on $file_path:"
            echo "$conflicts"
            # Could send notification, pause work, etc.
        fi
        sleep 30
    done
    
    echo "✅ Monitoring complete for $file_path"
}

# Send progress with auto-conflict checking
progress_with_monitoring() {
    local agent_name="$1"
    local progress="$2"
    local task="$3"
    
    # Send progress update
    progress_update "$agent_name" "$progress" "$task"
    
    # Quick coordination check
    echo "📊 Progress sent. Quick coordination check:"
    ./discord-polling.sh alerts | tail -3
}

# Emergency stop - release all files and end session
emergency_stop() {
    local agent_name="$1"
    local reason="${2:-Emergency stop requested}"
    
    echo "🚨 EMERGENCY STOP: $reason"
    
    # Send emergency message to Discord
    discord_send_message "$DISCORD_CONFLICTS_CHANNEL" "🚨 EMERGENCY STOP: $agent_name - $reason"
    
    # End session
    agent_end "$agent_name"
    
    # Stop polling
    ./discord-polling.sh stop
    
    echo "🛑 Emergency stop complete"
}

# Show enhanced help
show_enhanced_help() {
    echo "🤖 Enhanced Agent Functions with Live Discord Monitoring"
    echo ""
    echo "Session Management:"
    echo "  start_agent_session 'Agent Name' 'task'  - Start with live monitoring"
    echo "  end_agent_session 'Agent Name' [keep]    - End session (keep=true to keep polling)"
    echo "  emergency_stop 'Agent Name' 'reason'     - Emergency session termination"
    echo ""
    echo "Live Coordination:"
    echo "  check_coordination                       - Check live agent/conflict status"
    echo "  reserve_file_live 'Agent' 'file.tsx'    - Reserve with live conflict check"
    echo "  progress_with_monitoring 'Agent' '50%' 'task' - Progress with auto-check"
    echo "  monitor_file 'file.tsx' [seconds]       - Monitor specific file for conflicts"
    echo ""
    echo "Polling Control:"
    echo "  ./discord-polling.sh start|stop|status   - Control background monitoring"
    echo "  ./discord-polling.sh alerts              - Show recent Discord alerts"
    echo ""
    echo "💡 The polling system runs in background and monitors:"
    echo "   - New agent activity"
    echo "   - File conflicts"
    echo "   - Urgent messages and mentions"
}

echo "🔧 Enhanced Agent Functions loaded!"
echo "💡 Use 'show_enhanced_help' for available commands"