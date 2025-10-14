# Multi-Agent Coordination System

A comprehensive multi-agent coordination system designed for Windows/VSCode environments, featuring real-time communication, task assignment, agent discovery, and **collaborative threading**.

## Features

- **Collaborative Threading** ⭐ NEW:
  - Asynchronous discussion-based collaboration
  - @mention system for directed questions
  - File-based threading that survives sessions
  - Code artifact sharing between agents
  - Consensus tracking and voting
  - Session startup shows pending work

- **Multiple Communication Channels**:
  - Named Pipes for real-time IPC
  - File-based message queues for reliability
  - SQLite database for persistence
  - Discussion threads for async collaboration

- **Agent Management**:
  - Automatic agent discovery and registration
  - Capability-based task assignment
  - Health monitoring and heartbeat system

- **Task Coordination**:
  - Priority-based task queuing
  - Multiple assignment strategies (round-robin, capability-based, load-balanced)
  - Task dependencies and retry logic
  - Automatic failover handling

- **Coordination Patterns**:
  - Load balancing across agents
  - Agent failover and recovery
  - Real-time status monitoring
  - Async discussion threads

## Quick Start

### For Agent Collaboration (Recommended)

1. **Install Dependencies**:
   ```bash
   cd coordination
   npm install
   ```

2. **Start Your Session** (as Claude, Gemini, or Codex):
   ```bash
   npm run session -- Claude
   ```

   This shows:
   - Active discussion threads
   - @mentions waiting for you
   - Assigned tasks

3. **Try the Collaboration Example**:
   ```bash
   npm run collab:example
   ```

   See a complete workflow of 3 agents discussing and reaching consensus!

4. **Read the Quick Start Guide**:
   See [QUICK_START_COLLABORATION.md](./QUICK_START_COLLABORATION.md) for detailed instructions.

### For System Demo (Traditional)

1. **Install Dependencies**:
   ```bash
   cd coordination
   npm install
   ```

2. **Run Demo**:
   ```bash
   npm run demo
   ```

3. **Watch the Magic**:
   The demo will create three agents (Claude, Gemini, Codex) and demonstrate:
   - Agent discovery
   - Task assignment and execution
   - Coordination patterns
   - Real-time communication

## Architecture

### Core Components

- **AgentRegistry**: Handles agent registration, discovery, and health monitoring
- **TaskCoordinator**: Manages task assignment, execution, and coordination strategies
- **NamedPipeCoordinator**: Real-time IPC communication using Windows named pipes
- **FileMessageQueue**: Reliable file-based messaging system
- **CoordinationDatabase**: SQLite-based persistence layer

### Communication Flow

```
Agent A ←→ Named Pipes ←→ Agent B
   ↕            ↕           ↕
File Queue ←→ SQLite ←→ File Queue
```

## Usage Examples

### Creating an Agent

```javascript
const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');

// Create agent
const agent = new AgentRegistry(null, 'MyAgent', 'worker');

// Add capabilities
agent.addCapability('data_processing', 'Process large datasets');
agent.addCapability('file_operations', 'File read/write operations');

// Initialize
await agent.initialize();

// Create task coordinator
const coordinator = new TaskCoordinator(agent);
```

### Assigning Tasks

```javascript
// Create a task
const taskId = await coordinator.createTask(
    'data_analysis',
    'Analyze customer data',
    { dataset: 'customers.json' },
    {
        requiredCapability: 'data_processing',
        priority: 8,
        strategy: 'capability_based'
    }
);

// Monitor task progress
const stats = await coordinator.getCoordinationStats();
console.log(`Active tasks: ${stats.activeTasks}`);
```

### Agent Discovery

```javascript
// Discover available agents
const agents = await agent.discoverAgents();

// Find agents by capability
const dataAgents = await agent.findAgentByCapability('data_processing');

// Find agents by type
const workers = await agent.findAgentByType('worker');
```

## Coordination Strategies

### 1. Capability-Based Assignment
Tasks are assigned to agents that have the required capabilities.

### 2. Load-Balanced Assignment
Tasks are distributed evenly across available agents.

### 3. Priority-Based Assignment
High-priority tasks go to most capable agents.

### 4. Round-Robin Assignment
Tasks are assigned in rotation across agents.

## Configuration

### Database Location
```javascript
const db = new CoordinationDatabase('./custom/path/coordination.db');
```

### Named Pipe Configuration
```javascript
const coordinator = new NamedPipeCoordinator('custom_pipe_name', agentId);
```

### Message Queue Directory
```javascript
const queue = new FileMessageQueue('./custom/messages/directory');
```

## Monitoring and Debugging

### Agent Statistics
```javascript
const stats = await agent.getAgentStats();
console.log(`Known agents: ${stats.knownAgents}`);
console.log(`Capabilities: ${stats.capabilities}`);
```

### Task Coordination Statistics
```javascript
const coordStats = await coordinator.getCoordinationStats();
console.log(`Queued: ${coordStats.queuedTasks}`);
console.log(`Active: ${coordStats.activeTasks}`);
console.log(`Completed: ${coordStats.completedTasks}`);
```

### Message Queue Statistics
```javascript
const queueStats = await messageQueue.getQueueStats();
console.log(`Inbox: ${queueStats.inbox}`);
console.log(`Processed: ${queueStats.processed}`);
```

## Error Handling and Resilience

- **Automatic Retry**: Failed tasks are automatically retried with exponential backoff
- **Agent Failover**: Tasks from failed agents are reassigned automatically
- **Health Monitoring**: Continuous health checks with automatic recovery
- **Graceful Shutdown**: Clean shutdown procedures for all components

## Security Considerations

- Named pipes use Windows security model with proper ACLs
- File-based messages include sender verification
- Database access is controlled through connection strings
- Agent authentication through unique IDs and capabilities

## Performance Optimization

- **Connection Pooling**: Efficient database connection management
- **Message Batching**: Batch message processing for better throughput
- **Lazy Loading**: Agents and capabilities loaded on-demand
- **Cleanup Procedures**: Automatic cleanup of old messages and completed tasks

## Troubleshooting

### Common Issues

1. **Named Pipe Access Denied**:
   - Ensure proper Windows permissions
   - Run as administrator if needed

2. **SQLite Database Locked**:
   - Check for zombie processes
   - Implement proper connection cleanup

3. **Agent Discovery Timeout**:
   - Verify network connectivity
   - Check firewall settings

### Debug Mode

Enable debug logging:
```javascript
process.env.DEBUG = 'coordination:*';
```

## Documentation

### For Agents
- **[QUICK_START_COLLABORATION.md](./QUICK_START_COLLABORATION.md)** - Get started in 5 minutes
- **[COLLABORATION_PATTERN.md](./COLLABORATION_PATTERN.md)** - How agents collaborate
- **[HOW_TO_JOIN_COORDINATION.txt](./HOW_TO_JOIN_COORDINATION.txt)** - Welcome guide for new agents
- **[AGENT_ONBOARDING.md](./AGENT_ONBOARDING.md)** - Complete onboarding guide

### For Developers
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built and how it works
- **[.well-known/agent-protocol.json](./.well-known/agent-protocol.json)** - Machine-readable protocol spec

### API Reference
- `threading-system.js` - Threading and discussion management
- `collaboration-helpers.js` - Convenience functions
- `session-startup.js` - Session initialization
- `agent-registry.js` - Agent management
- `task-coordinator.js` - Task assignment

## NPM Scripts

```bash
# Collaboration commands
npm run session -- <AgentName>    # Start agent session (shows pending work)
npm run threads                   # List all active threads
npm run collab:view -- <id>       # View specific thread
npm run collab:create             # Create collaborative task (interactive)
npm run collab:example            # Run complete example workflow

# System commands
npm run demo                      # Run original system demo
npm run dashboard                 # Start web dashboard (localhost:3000)
npm run daemon                    # Run coordination daemon
```

## License

MIT - Feel free to use and modify for your projects.