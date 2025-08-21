# Discord MCP Setup for Multi-Agent Coordination

## Overview
This guide sets up Discord MCP integration for real-time agent coordination on the TownGeneratorOS project.

## Prerequisites
- Discord account
- Discord server (or create new one)
- Node.js installed
- Claude Desktop with MCP support

## Step 1: Create Discord Bot

### 1.1 Go to Discord Developer Portal
- Visit: https://discord.com/developers/applications
- Click "New Application"
- Name: "TownGenerator-Agent-Coordinator"

### 1.2 Create Bot
- Go to "Bot" section
- Click "Add Bot"
- Copy the **Bot Token** (keep this secret!)

### 1.3 Set Bot Permissions
Required permissions:
- [x] Send Messages
- [x] Read Message History
- [x] View Channels
- [x] Add Reactions
- [x] Manage Messages (for cleanup)

### 1.4 Invite Bot to Server
- Go to "OAuth2" > "URL Generator"
- Select "bot" scope
- Select permissions above
- Use generated URL to invite bot

## Step 2: Create Discord Channels

Create these channels in your Discord server:
```
📁 AGENT COORDINATION
├── 🤖 #agent-status          - Agent check-ins/heartbeats
├── 🔒 #file-reservations     - File locking notifications  
├── ⚙️  #active-work          - Current task updates
├── ⚠️  #conflicts            - Coordination conflicts
└── 📋 #completed-work        - Finished task summaries
```

## Step 3: Install Discord MCP Server

### 3.1 Install MCP Server
```bash
npm install -g @modelcontextprotocol/server-discord
```

### 3.2 Get Channel IDs
In Discord:
1. Enable Developer Mode (User Settings > Advanced > Developer Mode)
2. Right-click each channel > "Copy Channel ID"
3. Save these IDs for configuration

### 3.3 Environment Variables
Create `.env` file:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_AGENT_STATUS_CHANNEL=channel_id_here
DISCORD_FILE_RESERVATIONS_CHANNEL=channel_id_here  
DISCORD_ACTIVE_WORK_CHANNEL=channel_id_here
DISCORD_CONFLICTS_CHANNEL=channel_id_here
DISCORD_COMPLETED_WORK_CHANNEL=channel_id_here
```

## Step 4: Configure Claude Desktop MCP

### 4.1 Add to Claude Desktop config
Location: `~/.claude-desktop/config.json` (or `%APPDATA%/Claude/config.json` on Windows)

```json
{
  "mcpServers": {
    "discord-agent-coordination": {
      "command": "mcp-server-discord",
      "args": [],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here",
        "DISCORD_DEFAULT_CHANNEL": "your_agent_status_channel_id"
      }
    }
  }
}
```

### 4.2 Restart Claude Desktop
- Close Claude Desktop completely
- Reopen to load MCP configuration

## Step 5: Test Integration

### 5.1 Test Bot Connection
In Discord, try:
```
@TownGenerator-Agent-Coordinator ping
```

### 5.2 Test Claude MCP
In Claude Desktop:
```
Can you send a test message to the Discord agent coordination channel?
```

## Step 6: Agent Discord Protocol

### Message Formats
```
🟢 AGENT_START: Claude (Sonnet 4) starting work on building generation
🔒 FILE_RESERVE: src/components/BuildingPane.tsx - Claude (Sonnet 4)
⚙️ PROGRESS: 50% complete - BuildingPane refactor - Claude (Sonnet 4)  
✅ FILE_RELEASE: src/components/BuildingPane.tsx - Claude (Sonnet 4)
🏁 AGENT_COMPLETE: Claude (Sonnet 4) finished building generation
⚠️ CONFLICT: Need help with BuildingPane.tsx - conflicts with Gemini work
```

### Channel Usage
- **#agent-status**: Lifecycle events (start/end sessions)
- **#file-reservations**: File locking/unlocking
- **#active-work**: Progress updates and coordination
- **#conflicts**: When agents need to coordinate
- **#completed-work**: Summary of completed tasks

## Agent System Clock Protocol

### Getting Accurate Timestamps
Agents MUST use system clock, not log timestamps or assumptions:

**Correct way to get current time:**
```bash
date
```

**Example output:**
```
Sat, Aug 16, 2025 12:49:45 AM
```

**For Discord messages, use this format:**
```
🟢 [00:49] AGENT_START: Claude (Sonnet 4) starting work on building generation
```

**For file timestamps:**
```bash
# Get timestamp for filenames
date +"%Y-%m-%d-%H%M%S"
# Output: 2025-08-16-004945
```

**Important reminders for agents:**
- ALWAYS query system clock with `date` command
- NEVER assume time from log files or dev server timestamps  
- Use consistent timezone (system default)
- Include time in all Discord coordination messages

## Security Notes
- Keep bot token secure
- Use environment variables, not hardcoded tokens
- Bot only has minimum required permissions
- Consider using Discord webhooks for read-only notifications

## Troubleshooting
- If bot doesn't respond: Check token and permissions
- If MCP not working: Restart Claude Desktop
- Channel ID issues: Verify Developer Mode enabled
- Rate limits: Discord has message rate limits (consider throttling)

---

## Next Steps
Once setup is complete:
1. Update AGENTS.md to include Discord workflow
2. Test with multiple agents
3. Create Discord command shortcuts
4. Set up automated notifications