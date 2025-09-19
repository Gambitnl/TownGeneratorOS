# Multi-Agent Discord Setup Guide

## 🎯 Problem Solved

This guide fixes two major issues with multi-agent Discord coordination:

1. **Agent Identity Confusion** - Agents accidentally use wrong bot tokens and post under incorrect identities
2. **Context Reset Configuration Loss** - Agents can't find Discord setup after VSCode context resets

## 🚀 Quick Setup for Any Agent

### Step 1: One-Line Bootstrap
```bash
# Auto-detects your agent type and loads Discord coordination
source discord/scripts/universal-agent-bootstrap.sh

# Or specify your agent explicitly:
source discord/scripts/universal-agent-bootstrap.sh "Claude (Sonnet 4)"
source discord/scripts/universal-agent-bootstrap.sh "OpenAI Codex"
source discord/scripts/universal-agent-bootstrap.sh "Gemini Pro"
```

### Step 2: Verify Setup
```bash
# Check that everything loaded correctly
show_identity_status

# Test Discord connection
test_discord_connection
```

### Step 3: Start Working
```bash
# Begin coordinated work session
start_agent_session_protected "Claude (Sonnet 4)" "implementing new features"

# Reserve files before editing
reserve_file_protected "Claude (Sonnet 4)" "src/components/MyComponent.tsx"

# Send progress updates
progress_update_protected "Claude (Sonnet 4)" "50% complete" "refactoring component logic"

# Release files when done
release_file_protected "Claude (Sonnet 4)" "src/components/MyComponent.tsx"

# End session
end_agent_session_protected "Claude (Sonnet 4)"
```

## 🔧 Advanced Configuration

### Creating Agent-Specific Configs

If auto-discovery fails, create your agent's configuration:

```bash
# Load identity manager first
source discord/scripts/agent-identity-manager.sh

# Create config with your bot token
create_agent_config "Claude (Sonnet 4)" "YOUR_BOT_TOKEN" "YOUR_GUILD_ID"
```

### Manual Configuration Locations

The system searches these locations in order:
1. `discord/config/.env`
2. `./.env`
3. `~/.config/discord-agents/.env`
4. `/tmp/discord-agents/.env`

### Environment Variables

You can also set these directly:
```bash
export DISCORD_BOT_TOKEN="your_token"
export DISCORD_GUILD_ID="your_guild_id"
export DISCORD_AGENT_STATUS_CHANNEL="channel_id"
export DISCORD_FILE_RESERVATIONS_CHANNEL="channel_id"
export DISCORD_ACTIVE_WORK_CHANNEL="channel_id"
export DISCORD_CONFLICTS_CHANNEL="channel_id"
export DISCORD_COMPLETED_WORK_CHANNEL="channel_id"
```

## 🛡️ Identity Protection Features

### Automatic Identity Verification
- Each agent's bot token is verified before any Discord operation
- Cached identity verification for performance
- Prevents agents from posting under wrong identities

### Agent Name Mapping
- `Claude (Sonnet 4)` → Discord bot: `ClaudeCLI`
- `OpenAI Codex` → Discord bot: `CodexCLI`
- `Gemini Pro` → Discord bot: `GeminiCLI`

### Error Prevention
```bash
# This will FAIL if you try to use wrong token
start_agent_session_protected "Claude (Sonnet 4)" "task"
# [!] ERROR: Identity verification failed before sending message
# Agent: Claude (Sonnet 4)
# Token: REDACTED_DISCORD_BOT_TOKEN  # This is Codex's token!
```

## 🔍 Troubleshooting

### Common Issues and Solutions

**Issue**: `[!] ERROR: No valid Discord configuration found`

**Solution**:
```bash
# Check what configs are available
discover_discord_config "Your Agent Name"

# Create a new config if needed
create_agent_config "Your Agent Name" "YOUR_BOT_TOKEN" "YOUR_GUILD_ID"
```

---

**Issue**: `[!] ERROR: Identity mismatch! Expected: ClaudeCLI, Actual: CodexCLI`

**Solution**: You're using the wrong bot token
```bash
# Clear cached identities and reconfigure
clear_identity_cache yes

# Use the correct token for your agent
create_agent_config "Claude (Sonnet 4)" "CLAUDE_BOT_TOKEN" "GUILD_ID"
```

---

**Issue**: `[!] Could not auto-detect agent type`

**Solution**: Specify your agent explicitly
```bash
source discord/scripts/universal-agent-bootstrap.sh "Claude (Sonnet 4)"
```

---

**Issue**: Functions not available after context reset

**Solution**: Re-run the bootstrap
```bash
source discord/scripts/universal-agent-bootstrap.sh
```

### Diagnostic Commands

```bash
# Show current identity status
show_identity_status

# Test Discord connection
test_discord_connection

# Check coordination status
check_coordination_enhanced

# View recent Discord alerts
discord-polling.sh alerts

# Clear identity cache (if confused)
clear_identity_cache yes
```

## 📋 Available Functions

### Session Management
- `start_agent_session_protected "Agent" "task"`
- `end_agent_session_protected "Agent" [keep_polling]`
- `emergency_stop_protected "Agent" "reason"`

### File Operations
- `reserve_file_protected "Agent" "file.ts"`
- `release_file_protected "Agent" "file.ts"`
- `reserve_multiple_files "Agent" file1.ts file2.tsx`
- `release_multiple_files "Agent" file1.ts file2.tsx`

### Communication
- `progress_update_protected "Agent" "50%" "task description"`
- `protected_discord_send "channel_id" "message"`

### Monitoring
- `check_coordination_enhanced`
- `monitor_file_protected "Agent" "file.ts" [seconds]`

### Identity Management
- `show_identity_status`
- `test_discord_connection`
- `verify_agent_identity "Agent" "token"`

## 🔄 Workflow Example

```bash
# 1. Bootstrap (works from any environment)
source discord/scripts/universal-agent-bootstrap.sh

# 2. Check setup
show_identity_status

# 3. Start session
start_agent_session_protected "Claude (Sonnet 4)" "building new feature"

# 4. Check what others are doing
check_coordination_enhanced

# 5. Reserve files
reserve_multiple_files "Claude (Sonnet 4)" \
    src/components/Feature.tsx \
    src/services/FeatureService.ts \
    tests/Feature.test.ts

# 6. Work and update progress
progress_update_protected "Claude (Sonnet 4)" "25%" "implementing core logic"
# ... do work ...
progress_update_protected "Claude (Sonnet 4)" "75%" "adding tests"

# 7. Release files and end session
release_multiple_files "Claude (Sonnet 4)" \
    src/components/Feature.tsx \
    src/services/FeatureService.ts \
    tests/Feature.test.ts

end_agent_session_protected "Claude (Sonnet 4)"
```

## 💡 Pro Tips

1. **Always bootstrap first** - Run the bootstrap script in every new session
2. **Verify identity** - Check `show_identity_status` if you suspect issues
3. **Use protected functions** - All functions ending in `_protected` have identity verification
4. **Monitor conflicts** - Run `check_coordination_enhanced` periodically
5. **Reserve early** - Reserve all files you plan to edit before starting work

---

## 🎉 Benefits

✅ **No more identity confusion** - Each agent uses only their own bot token
✅ **Works across environments** - Auto-discovers configuration in any VSCode setup
✅ **Self-healing** - Attempts to recover from configuration issues
✅ **Conflict prevention** - Real-time file conflict detection
✅ **Easy troubleshooting** - Clear error messages and diagnostic tools
✅ **Backward compatible** - Existing scripts continue to work

This system ensures that each agent maintains its proper identity and can reliably coordinate with others, regardless of environment or context resets.