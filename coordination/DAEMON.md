# Coordination Daemon - Keeping Agents "Alive"

The Coordination Daemon solves the problem of keeping agents active for async coordination by running as a long-lived background process.

## The Problem

AI agents like Claude Code can't stay "alive" continuously - each inference session ends when a response is complete. This makes real-time coordination challenging.

## The Solution

A **long-running Node.js daemon** that:
- ✅ Stays alive continuously
- ✅ Monitors the coordination system for tasks
- ✅ Invokes AI agents when needed
- ✅ Handles async coordination seamlessly

## How It Works

```
┌─────────────────────────────────────────────┐
│  Coordination Daemon (Always Running)       │
│  - Monitors task queue every 5 seconds      │
│  - Executes tasks or queues invocations     │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Coordination System   │
        │ - Named Pipes         │
        │ - SQLite Database     │
        │ - File Message Queue  │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Agent Invocations     │
        │ - Queue tasks for AI  │
        │ - Check periodically  │
        └───────────────────────┘
```

## Quick Start

### 1. Start the Daemon

```bash
cd coordination
npm run daemon
```

The daemon will:
- Register itself as an agent
- Start monitoring for tasks
- Provide an interactive CLI

### 2. Create Tasks for the Daemon

From another terminal or agent:

```javascript
const TaskCoordinator = require('./task-coordinator');
const coordinator = new TaskCoordinator(yourAgent);

// Create a task for the daemon
await coordinator.createTask(
    'file_operation',
    'Process data file',
    { file: 'data.json', operation: 'analyze' },
    { assignedTo: 'daemon' }
);
```

### 3. Check for AI Agent Invocations (Claude Code)

When you start a Claude Code session:

```bash
cd coordination
npm run check
```

This shows pending invocations that need AI agent processing.

## Daemon Commands

While the daemon is running, use these interactive commands:

- **`stats`** - Show daemon statistics
- **`tasks`** - List pending tasks
- **`agents`** - Show active agents
- **`quit`** - Shutdown daemon gracefully

## Task Handlers

The daemon has built-in handlers for:

### 1. Agent Invocation
```javascript
{
    task_type: 'invoke_agent',
    data: {
        agentType: 'claude_code',
        command: 'analyze codebase for security issues',
        context: { repo: '/path/to/repo' }
    }
}
```

### 2. File Operations
```javascript
{
    task_type: 'file_operation',
    data: {
        operation: 'read',
        path: '/path/to/file'
    }
}
```

### 3. Coordination Tasks
```javascript
{
    task_type: 'coordination',
    data: {
        action: 'synchronize_agents',
        agents: ['agent1', 'agent2']
    }
}
```

## Custom Handlers

Add your own task handlers:

```javascript
const daemon = new CoordinationDaemon('MyDaemon');

// Register custom handler
daemon.registerHandler('custom_task', async (task) => {
    // Your logic here
    return { status: 'completed', result: 'done' };
});

await daemon.start();
```

## Claude Code Integration

### At Session Start

Check for pending invocations:

```bash
npm run check
```

### Process an Invocation

```bash
# View details and mark as processing
npm run check process <invocation-id>

# After completing the task manually
npm run check complete <invocation-id>
```

### Automated Check (Add to your workflow)

```bash
# In your Claude Code startup script
cd coordination && npm run check
```

## Invocation Queue

Invocations are stored in `coordination/invocations/`:
- **Pending** - New invocations waiting for agent
- **Processing** - Currently being worked on
- **Archive** - Completed invocations

### Cleanup

```bash
# Clean up invocations older than 7 days
npm run check cleanup

# Custom retention period (30 days)
npm run check cleanup 30
```

## Production Deployment

### As a Windows Service

Use [node-windows](https://github.com/coreybutler/node-windows):

```javascript
const Service = require('node-windows').Service;

const svc = new Service({
    name: 'Coordination Daemon',
    description: 'Multi-agent coordination daemon',
    script: 'F:\\Repos\\TownGeneratorOS\\coordination\\coordination-daemon.js'
});

svc.on('install', () => svc.start());
svc.install();
```

### With PM2

```bash
npm install -g pm2

# Start daemon
pm2 start coordination-daemon.js --name coordination-daemon

# Save configuration
pm2 save

# Start on boot
pm2 startup
```

### Docker Container

```dockerfile
FROM node:18
WORKDIR /app
COPY coordination /app
RUN npm install
CMD ["node", "coordination-daemon.js"]
```

## Monitoring

### Real-time Stats

```javascript
// From daemon CLI
stats

// Output:
{
  "daemon": {
    "name": "CoordinationDaemon",
    "agentId": "...",
    "uptime": 3600,
    "running": true
  },
  "agents": { "knownAgents": 5 },
  "coordination": {
    "queuedTasks": 2,
    "activeTasks": 1,
    "completedTasks": 42
  }
}
```

### Logging

Add logging to daemon:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'daemon.log' })
    ]
});
```

## Architecture Patterns

### Pattern 1: Request-Response
```
Agent A → Create Task → Daemon → Execute → Result → Agent A
```

### Pattern 2: Event-Driven
```
Agent A → Trigger Event → Daemon → Notify → Multiple Agents
```

### Pattern 3: Scheduled Tasks
```
Daemon → Check Schedule → Execute Task → Store Result
```

## Troubleshooting

### Daemon won't start
- Check if port/pipe is already in use
- Verify database permissions
- Check Node.js version (requires v14+)

### Tasks not executing
- Verify task assignment (use `assignedTo` field)
- Check daemon logs
- Ensure task type has a registered handler

### Invocations not appearing
- Check `coordination/invocations/` directory exists
- Verify file permissions
- Run `npm run check list`

## Security Considerations

- Named pipes use Windows ACLs for security
- Invocation files should have restricted permissions
- Validate all task data before execution
- Implement rate limiting for task creation

## Performance Tips

- Adjust monitoring interval (default: 5 seconds)
- Implement task batching for high volumes
- Use database connection pooling
- Archive old invocations regularly

## Next Steps

1. **Start the daemon**: `npm run daemon`
2. **Create some tasks** from other agents
3. **Check for invocations**: `npm run check`
4. **Build custom handlers** for your use cases

The daemon keeps your coordination system "alive" 24/7, ready to handle tasks and coordinate agents even when they're not actively running!
