# Claude Monitoring System

Background process that watches for situations where Claude needs to take action in the multi-agent coordination system.

## What It Monitors

### 1. @Mentions in Threads
When other agents (@Gemini, @Codex) mention `@Claude` in discussion threads, you get notified immediately.

### 2. Last Active Agent
When Claude is the only active agent and others have gone inactive, you're alerted to consider reactivating them to continue collaborative work.

## How to Use

### Start the Monitor (Background)

```bash
cd coordination
npm run monitor:claude
```

This runs continuously in the background and:
- Checks every 10 seconds for new @mentions
- Checks if you're the last active agent
- Creates notification files when action is needed

### Start the Notification Watcher (Interactive)

In a **separate terminal**:

```bash
cd coordination
npm run monitor:notifications
```

This watches for notification files and **prompts you interactively** when:
- New @mentions are found
- You're the last active agent

## Example Workflow

### Terminal 1: Monitor
```bash
cd coordination
npm run monitor:claude
```

Output:
```
🔔 Claude Monitor Starting...
════════════════════════════════════════════════════════════
Agent: Claude
Check interval: 10s
Monitoring for:
  • @mentions in discussion threads
  • Last active agent situations
════════════════════════════════════════════════════════════

⚠️  [2:34:15 PM] NEW @MENTION FOR CLAUDE
────────────────────────────────────────────────────────────
Thread: Implement caching strategy
From: Gemini
Message preview: @Claude - What are your thoughts on this vs Redis?

View thread: npm run collab:view -- implement-caching-strategy-abc123
────────────────────────────────────────────────────────────

📝 Notification saved: ./notifications/claude-1696524855123.json
```

### Terminal 2: Notification Watcher
```bash
cd coordination
npm run monitor:notifications
```

Output:
```
👁️  VSCode Notification Watcher Starting...
════════════════════════════════════════════════════════════
Watching: F:\Repos\TownGeneratorOS\coordination\notifications
Check interval: 2s
════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════════════
🔔 NEW NOTIFICATION
══════════════════════════════════════════════════════════════════════

📨 @Claude - Gemini needs your input

Thread: Implement caching strategy

"@Claude - What are your thoughts on this vs Redis? Given we're all
local, is the complexity worth it?"

──────────────────────────────────────────────────────────────────────

Suggested action: npm run collab:view -- implement-caching-strategy-abc123

══════════════════════════════════════════════════════════════════════

What would you like to do?
  [1] View thread
  [2] Ignore for now
  [3] Open in VSCode
Choice: 1

▶ Executing: npm run collab:view -- implement-caching-strategy-abc123

[Shows full thread...]
```

## How It Works

### Monitor Process (claude-monitor.js)
1. Connects to coordination system as Claude agent
2. Periodically checks:
   - `threading-system.findMentions('Claude')` - for @mentions
   - Database for active agents (via heartbeat timestamps)
3. When conditions are met, writes JSON notification files to `./notifications/`

### Notification Watcher (vscode-notification-watcher.js)
1. Watches `./notifications/` directory for new files
2. When found, shows interactive prompt
3. Offers actions:
   - View thread directly
   - Wake up inactive agents
   - Ignore/snooze
4. Moves processed notifications to `./notifications/processed/`

## Notification File Format

```json
{
  "timestamp": "2025-10-05T14:34:15.123Z",
  "agent": "Claude",
  "type": "mention",
  "title": "@Claude - Gemini needs your input",
  "message": "Thread: Implement caching strategy\n\n\"@Claude - ...\"",
  "action": "npm run collab:view -- thread-id",
  "threadId": "implement-caching-strategy-abc123"
}
```

## Configuration

### Monitor Check Interval
Edit `claude-monitor.js`:
```javascript
this.checkInterval = 10000; // 10 seconds (default)
```

### Last Active Agent Alert Frequency
Edit `claude-monitor.js`:
```javascript
const fiveMinutes = 5 * 60 * 1000; // Only alert every 5 minutes
```

### Heartbeat Threshold (What is "active"?)
Edit `claude-monitor.js`:
```javascript
const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
// Agent is "active" if heartbeat within 10 seconds
```

## Running in Background (Windows)

To run the monitor completely in the background:

```powershell
# PowerShell
Start-Process -WindowStyle Hidden -FilePath "npm" -ArgumentList "run", "monitor:claude"
```

Or use a task scheduler / VSCode task to start it automatically.

## VSCode Integration (Future)

You could create a VSCode extension that:
1. Watches the `notifications/` directory
2. Shows native VSCode notifications
3. Provides quick actions in the UI
4. Integrates with Claude Code's prompt system

For now, the CLI watcher works great in a terminal.

## Troubleshooting

### No notifications appearing
- Check that `claude-monitor.js` is running
- Check `./notifications/` directory exists and has `.json` files
- Verify monitor output shows "Notification saved"

### Monitor not detecting @mentions
- Ensure threads exist: `npm run threads`
- Check thread messages have `@Claude` mentions
- Verify threading system is working: `npm run collab:example`

### "Agent not found" errors
- Make sure coordination database exists: `./data/coordination.db`
- Run a session first: `npm run session -- Claude`

## Example Use Cases

### Scenario 1: Gemini asks Claude a question
1. Gemini contributes to thread with `@Claude what do you think?`
2. Monitor detects mention
3. Notification watcher prompts Claude
4. Claude views thread and responds

### Scenario 2: Claude is last agent standing
1. Claude is working on a task
2. Gemini and Codex sessions end (no more heartbeats)
3. Monitor detects Claude is alone
4. Notification watcher prompts: "Wake up Gemini and Codex?"
5. Claude chooses [1] to restart their sessions
6. All 3 agents are active again

### Scenario 3: Continuous collaboration
Run in 3 terminals:
- Terminal 1: `npm run monitor:claude` (background)
- Terminal 2: `npm run monitor:notifications` (interactive)
- Terminal 3: Work normally, respond to prompts from Terminal 2

## Files Created

- `coordination/claude-monitor.js` - Background monitoring process
- `coordination/vscode-notification-watcher.js` - Interactive notification handler
- `coordination/notifications/` - Notification queue (created automatically)
- `coordination/notifications/processed/` - Archived notifications

## Next Steps

To make this production-ready:
1. Create monitors for Gemini and Codex (copy and modify)
2. Build VSCode extension for native notifications
3. Add notification priorities/urgency levels
4. Implement notification batching (group multiple mentions)
5. Add notification history viewer
