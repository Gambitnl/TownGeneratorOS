# Agent Onboarding Guide

Welcome, new agent! This guide will help you join and use the multi-agent coordination system.

## 🚀 Quick Start (5 Minutes)

### Step 1: Register Yourself

```javascript
const AgentRegistry = require('./coordination/agent-registry');

// Create your agent identity
const myAgent = new AgentRegistry(
    null,                    // Auto-generate ID
    'YourAgentName',         // Your name
    'your_type'              // Type: 'ai_assistant', 'daemon', 'worker', 'researcher', etc.
);

// Connect to coordination system
await myAgent.initialize();
```

### Step 2: Add Your Capabilities

```javascript
// Tell others what you can do
await myAgent.addCapability('coding', 'Write and review code');
await myAgent.addCapability('research', 'Research information');
await myAgent.addCapability('data_analysis', 'Analyze data');
```

### Step 3: Start Coordinating

```javascript
const TaskCoordinator = require('./coordination/task-coordinator');
const coordinator = new TaskCoordinator(myAgent);

// Now you're ready to send and receive tasks!
```

## 📋 Communication Methods

### Method 1: Tasks (Recommended for Work)

**Send a task to another agent:**
```javascript
const taskId = await coordinator.createTask(
    'task_type',              // Type of task
    'Task description',       // What needs to be done
    { /* data */ },          // Task parameters
    {
        assignedTo: 'agent-id',  // Specific agent (optional)
        requiredCapability: 'coding',  // Or match by capability
        priority: 8           // 1-10 (higher = more urgent)
    }
);
```

**Check your assigned tasks:**
```javascript
const myTasks = await myAgent.database.getTasksForAgent(myAgent.agentId);

myTasks.forEach(task => {
    console.log(`Task: ${task.description}`);
    console.log(`Status: ${task.status}`);
    console.log(`Data:`, JSON.parse(task.data));
});
```

**Complete a task:**
```javascript
await myAgent.database.updateTaskStatus(taskId, 'in_progress');

// Do the work...

await myAgent.database.updateTaskStatus(taskId, 'completed', {
    result: 'Task completed successfully',
    output: { /* your results */ }
});
```

### Method 2: Direct Messages (For Quick Communication)

**Send a message:**
```javascript
await myAgent.database.sendMessage(
    myAgent.agentId,          // From you
    targetAgentId,            // To another agent
    'message_type',           // Type: 'request', 'response', 'notification'
    { /* message content */ },
    priority                  // 1-10
);
```

**Read your messages:**
```javascript
const messages = await myAgent.database.getMessagesForAgent(myAgent.agentId);

messages.forEach(msg => {
    const content = JSON.parse(msg.content);
    console.log(`From: ${msg.from_agent}`);
    console.log(`Type: ${msg.message_type}`);
    console.log(`Content:`, content);
});
```

**Mark message as processed:**
```javascript
await myAgent.database.markMessageProcessed(messageId);
```

### Method 3: Real-time Named Pipe (For Live Updates)

**Send real-time notification:**
```javascript
myAgent.namedPipeCoordinator.sendMessage({
    type: 'notification',
    message: 'I just completed a major task!',
    priority: 'high'
});
```

**Listen for messages:**
```javascript
myAgent.namedPipeCoordinator.onMessage('notification', (message) => {
    console.log('Received notification:', message);
});
```

### Method 4: Broadcast to All Agents

**Announce to everyone:**
```javascript
myAgent.namedPipeCoordinator.sendMessage({
    type: 'announcement',
    message: 'System maintenance starting in 5 minutes',
    sender: myAgent.agentName
});
```

## 🔍 Discovering Other Agents

**Find all active agents:**
```javascript
const agents = await myAgent.discoverAgents();

agents.forEach(agent => {
    console.log(`Name: ${agent.name}`);
    console.log(`Type: ${agent.type}`);
    console.log(`Capabilities:`, JSON.parse(agent.capabilities));
});
```

**Find agents by capability:**
```javascript
const coders = await myAgent.findAgentByCapability('coding');
const researchers = await myAgent.findAgentByCapability('research');
```

**Find agents by type:**
```javascript
const daemons = await myAgent.findAgentByType('daemon');
const workers = await myAgent.findAgentByType('worker');
```

## 🎯 Common Patterns

### Pattern 1: Request Help from Another Agent

```javascript
// Find an agent with the capability you need
const agents = await myAgent.findAgentByCapability('debugging');

if (agents.length > 0) {
    const helperId = agents[0].id;

    // Create a task for them
    await coordinator.createTask(
        'debugging',
        'Help debug authentication issue',
        {
            error: 'User login failing',
            file: 'src/auth.js',
            context: { /* relevant info */ }
        },
        {
            assignedTo: helperId,
            priority: 8
        }
    );
}
```

### Pattern 2: Delegate Work to Daemon

```javascript
// Send long-running tasks to the daemon
const daemons = await myAgent.findAgentByType('daemon');

if (daemons.length > 0) {
    await coordinator.createTask(
        'invoke_agent',
        'Call Claude Code to analyze security',
        {
            agentType: 'claude_code',
            command: 'Review codebase for security issues',
            context: { directory: './src' }
        },
        {
            assignedTo: daemons[0].id,
            priority: 7
        }
    );
}
```

### Pattern 3: Collaborate on Complex Task

```javascript
// Request collaboration from multiple agents
myAgent.namedPipeCoordinator.requestCoordination('collaboration', {
    topic: 'Build new feature',
    roles_needed: ['coding', 'testing', 'documentation'],
    coordinator: myAgent.agentId
});

// Listen for responses
myAgent.namedPipeCoordinator.onMessage('collaboration_response', (msg) => {
    console.log(`${msg.agent} is willing to help!`);
});
```

### Pattern 4: Monitor Task Progress

```javascript
// Create task
const taskId = await coordinator.createTask(...);

// Poll for status
const checkStatus = setInterval(async () => {
    const task = await myAgent.database.db.get(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
    );

    console.log(`Task status: ${task.status}`);

    if (task.status === 'completed') {
        console.log('Result:', JSON.parse(task.result));
        clearInterval(checkStatus);
    }
}, 2000);
```

## 📊 Monitoring & Debugging

### View Live Dashboard

Open **http://localhost:3000** to see:
- All active agents
- Task queue and status
- Message flow
- Real-time updates

### Check Your Stats

```javascript
const stats = await myAgent.getAgentStats();
console.log(`Known agents: ${stats.knownAgents}`);
console.log(`My capabilities: ${stats.capabilities}`);
```

### Coordination Stats

```javascript
const coordStats = await coordinator.getCoordinationStats();
console.log(`Queued tasks: ${coordStats.queuedTasks}`);
console.log(`Active tasks: ${coordStats.activeTasks}`);
console.log(`Completed: ${coordStats.completedTasks}`);
```

## 🔒 Resource Locking (Prevent Conflicts)

**Acquire a lock:**
```javascript
const locked = await myAgent.database.acquireLock(
    'file_data.json',      // Resource ID
    myAgent.agentId,       // Your ID
    'exclusive',           // Lock type
    30000                  // Expires in 30 seconds
);

if (locked) {
    // Safe to modify resource
    // ... do work ...

    // Release when done
    await myAgent.database.releaseLock('file_data.json', myAgent.agentId);
}
```

## 🗄️ Shared State

**Store shared data:**
```javascript
await myAgent.database.setState(
    'project_status',
    { phase: 'development', progress: 75 },
    myAgent.agentId
);
```

**Read shared data:**
```javascript
const status = await myAgent.database.getState('project_status');
console.log(`Project: ${status.phase}, ${status.progress}% complete`);
```

## 🛑 Graceful Shutdown

**Always cleanup when done:**
```javascript
// Cleanup
await myAgent.shutdown();
```

## 💡 Pro Tips

1. **Set heartbeats** - Your agent automatically sends heartbeats. Other agents can detect if you go offline.

2. **Priority matters** - Use priority 8-10 for urgent tasks, 5-7 for normal, 1-4 for low priority.

3. **Use capabilities** - Always declare what you can do. This enables automatic task assignment.

4. **Check the dashboard** - The web dashboard (port 3000) shows everything in real-time.

5. **Handle errors gracefully** - If a task fails, update its status to 'failed' with error details.

6. **Use descriptive names** - Task descriptions appear in the dashboard and logs.

7. **Clean up old data** - Completed tasks older than 7 days can be archived.

## 📚 Full API Reference

See these files for complete documentation:
- `README.md` - System overview
- `DAEMON.md` - Daemon and invocation queue
- API docs in each module's JSDoc comments

## 🆘 Troubleshooting

**Can't connect to coordination system:**
- Check if database exists: `coordination/data/coordination.db`
- Verify Node.js version: `node --version` (need v14+)
- Try: `npm install` in coordination directory

**Tasks not appearing:**
- Check task assignment: is `assignedTo` correct?
- Verify agent is active: check heartbeat
- View dashboard: http://localhost:3000

**Named pipe errors:**
- Only one server allowed - daemon usually runs as server
- Clients connect automatically
- Windows only - use database messages on other OS

## 🎓 Example: Complete Agent

```javascript
const AgentRegistry = require('./coordination/agent-registry');
const TaskCoordinator = require('./coordination/task-coordinator');

class MyAgent {
    async start() {
        // 1. Connect
        this.agent = new AgentRegistry(null, 'MyAgent', 'worker');
        await this.agent.initialize();

        // 2. Declare capabilities
        await this.agent.addCapability('data_processing', 'Process data');

        // 3. Set up coordinator
        this.coordinator = new TaskCoordinator(this.agent);

        // 4. Listen for tasks
        this.agent.namedPipeCoordinator.onMessage('task_assignment', (msg) => {
            this.handleTask(msg);
        });

        // 5. Start working
        console.log('Agent ready!');
    }

    async handleTask(task) {
        // Mark in progress
        await this.agent.database.updateTaskStatus(task.taskId, 'in_progress');

        // Do work
        const result = await this.processTask(task);

        // Mark complete
        await this.agent.database.updateTaskStatus(task.taskId, 'completed', result);
    }

    async processTask(task) {
        // Your logic here
        return { success: true };
    }
}

const agent = new MyAgent();
agent.start();
```

---

**Welcome to the coordination system! You're now ready to collaborate with other agents.** 🤖🤝🤖
