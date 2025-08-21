# Discord Multi-Agent Coordination System - Complete Guide

## 🎯 What This System Does

This Discord integration allows multiple AI agents to work on the same codebase simultaneously without conflicts by providing:

- **Real-time file locking** - Agents reserve files before editing
- **Live progress updates** - See what other agents are doing
- **Conflict detection** - Automatic detection when agents want the same file
- **Background monitoring** - Continuous Discord polling for live coordination

## 🚀 Quick Start for New Agents

### Step 1: Copy Required Files
You need these 4 files from the project:
```bash
cp .env your_agent_directory/
cp discord-bot-functions.sh your_agent_directory/
cp enhanced-agent-functions.sh your_agent_directory/
cp discord-polling.sh your_agent_directory/
chmod +x discord-polling.sh
```

### Step 2: Test Your Connection
```bash
# Load the system
source enhanced-agent-functions.sh

# Test connection (should show bot username)
test_bot_connection

# Start a test session
start_agent_session "Your Agent Name" "testing coordination system"

# End the session  
end_agent_session "Your Agent Name"
```

### Step 3: Follow the Agent Protocol
See `AGENTS.md` for the complete 7-phase workflow. With Discord, it's:

1. **SESSION_START**: `start_agent_session "Agent Name" "task"`
2. **PLANNING**: Research and plan your approach
3. **FILE_RESERVATION**: `reserve_file_live "Agent Name" "path/to/file.tsx"`
4. **IMPLEMENTATION**: Work on files, send progress updates
5. **TESTING**: Validate your changes
6. **CLEANUP**: `release_file "Agent Name" "path/to/file.tsx"`
7. **HANDOFF**: `end_agent_session "Agent Name"`

## 📋 Essential Commands Reference

### Session Management
```bash
# Start session with live monitoring
start_agent_session "Agent Name" "task description"

# Check live coordination status
check_coordination

# End session (optionally keep polling for others)
end_agent_session "Agent Name" [keep_polling]

# Emergency stop (releases all files)
emergency_stop "Agent Name" "reason"
```

### File Coordination
```bash
# Reserve file with conflict detection
reserve_file_live "Agent Name" "src/components/File.tsx"

# Check if file is already reserved
check_file_conflicts "src/components/File.tsx"

# Release file when done
release_file "Agent Name" "src/components/File.tsx"

# Monitor specific file during work
monitor_file "src/components/File.tsx" 300  # 5 minutes
```

### Progress & Communication
```bash
# Send progress with auto-coordination check
progress_with_monitoring "Agent Name" "75% complete" "task description"

# Check active agents
check_active_agents

# View recent Discord alerts
./discord-polling.sh alerts
```

### Polling Control
```bash
# Start background monitoring (10s intervals)
./discord-polling.sh start

# Check polling status
./discord-polling.sh status  

# Stop polling
./discord-polling.sh stop

# Restart polling
./discord-polling.sh restart
```

## 🤖 Example Agent Workflow

```bash
# 1. Load the system
source enhanced-agent-functions.sh

# 2. Start coordinated session
start_agent_session "Gemini Pro" "village generation improvements"

# 3. Check what others are doing
check_coordination

# 4. Reserve your files
reserve_file_live "Gemini Pro" "src/services/VillageGenerator.ts"
reserve_file_live "Gemini Pro" "src/components/VillagePane.tsx"

# 5. Work and send progress
progress_with_monitoring "Gemini Pro" "25% complete" "analyzing village generation logic"

# 6. During work, check for conflicts/updates
check_coordination

# 7. More progress
progress_with_monitoring "Gemini Pro" "75% complete" "implementing improvements"

# 8. Release files and end session
release_file "Gemini Pro" "src/services/VillageGenerator.ts"
release_file "Gemini Pro" "src/components/VillagePane.tsx"
end_agent_session "Gemini Pro"
```

## 📱 Discord Channels

The system uses these Discord channels (all configured in `.env`):

- **#agent-status** - Agent start/end announcements
- **#file-reservations** - File locking/unlocking messages  
- **#active-work** - Progress updates during tasks
- **#conflicts** - Conflict detection and resolution
- **#completed-work** - Task completion summaries

## 🔧 Configuration Details

### Environment Variables (`.env`)
```env
DISCORD_BOT_TOKEN="your_bot_token"
DISCORD_GUILD_ID="your_server_id"
DISCORD_AGENT_STATUS_CHANNEL="channel_id"
DISCORD_FILE_RESERVATIONS_CHANNEL="channel_id"
DISCORD_ACTIVE_WORK_CHANNEL="channel_id"
DISCORD_CONFLICTS_CHANNEL="channel_id"
DISCORD_COMPLETED_WORK_CHANNEL="channel_id"
```

### Message Format
All Discord messages follow this format:
```
🟢 [HH:MM] AGENT_START: Agent Name starting work on task
🔒 [HH:MM] FILE_RESERVE: path/to/file.ts - Agent Name
⚙️ [HH:MM] PROGRESS: 50% complete - task description - Agent Name
✅ [HH:MM] FILE_RELEASE: path/to/file.ts - Agent Name
🔴 [HH:MM] AGENT_END: Agent Name session complete
```

## ⚠️ Conflict Resolution

### When File Conflicts Occur:
1. **System detects conflict**: `reserve_file_live` fails
2. **Shows conflict details**: Which agent has the file reserved
3. **Options**:
   - Wait and try again later
   - Work on different files
   - Coordinate directly via Discord `#conflicts` channel
   - Use `emergency_stop` if critical

### When Agent Conflicts Occur:
1. **Check active agents**: `check_active_agents`
2. **View recent activity**: `./discord-polling.sh alerts`
3. **Coordinate in Discord**: Use `#conflicts` channel
4. **Report conflicts**: `report_conflict "Agent Name" "description"`

## 🔍 Monitoring & Alerts

### Background Polling System:
- **Runs every 10 seconds** in background
- **Monitors**: New agents, file conflicts, urgent messages
- **Logs**: `/tmp/discord-polling.log` and `/tmp/discord-alerts.log`
- **Auto-detects**: Mentions, help requests, priority messages

### Live Coordination Checks:
```bash
# Full coordination status
check_coordination

# Recent alerts only
./discord-polling.sh alerts

# Polling system status
./discord-polling.sh status
```

## 🚨 Troubleshooting

### Common Issues:

**Bot connection fails:**
```bash
test_bot_connection  # Check if bot token is valid
```

**Polling not working:**
```bash
./discord-polling.sh restart  # Restart background monitoring
```

**Function not found errors:**
```bash
source enhanced-agent-functions.sh  # Reload functions
```

**Permission errors:**
```bash
chmod +x discord-polling.sh  # Make script executable
```

**Message reading fails:**
- Check bot has "Read Message History" permission
- Verify channel IDs in `.env` are correct

## 📚 Additional Resources

- **`AGENTS.md`** - Complete agent workflow protocol
- **`AGENTS-QUICKREF.md`** - Quick reference commands
- **`DISCORD-MCP-SETUP.md`** - Original Discord bot setup guide
- **File-based coordination** - `/agents/active/` directory for offline coordination

## 🎯 Success Indicators

You know the system is working when:
- ✅ `test_bot_connection` shows your bot username
- ✅ Messages appear in Discord when you run commands
- ✅ `check_coordination` shows live agent status
- ✅ File conflicts are detected automatically
- ✅ Background polling shows active status

---

## 💡 Pro Tips for New Agents

1. **Always check coordination first**: `check_coordination`
2. **Reserve files before editing**: `reserve_file_live`
3. **Send progress updates**: `progress_with_monitoring`
4. **Use background polling**: `./discord-polling.sh start`
5. **Clean up when done**: Release files and end session

**Welcome to coordinated multi-agent development!** 🤖🤝🤖

---

*This system was created for the TownGeneratorOS project to enable safe, coordinated development by multiple AI agents working simultaneously on the same codebase.*