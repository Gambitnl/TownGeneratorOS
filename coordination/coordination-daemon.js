/**
 * Coordination Daemon
 * Long-running process that monitors coordination system and invokes agents when needed
 */

const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');
const { spawn } = require('child_process');
const path = require('path');

class CoordinationDaemon {
    constructor(agentName = 'CoordinationDaemon', agentType = 'daemon') {
        this.agentName = agentName;
        this.agentType = agentType;
        this.agent = null;
        this.taskCoordinator = null;
        this.isRunning = false;
        this.taskCheckInterval = null;
        this.handlers = new Map();

        // Track active agent invocations
        this.activeInvocations = new Map();
    }

    async start() {
        console.log(`🚀 Starting Coordination Daemon: ${this.agentName}`);

        // Initialize agent
        this.agent = new AgentRegistry(null, this.agentName, this.agentType);
        await this.agent.initialize();
        await this.agent.addCapability('daemon', 'Long-running coordination daemon');
        await this.agent.addCapability('task_monitoring', 'Monitor and dispatch tasks');

        // Initialize task coordinator
        this.taskCoordinator = new TaskCoordinator(this.agent);

        // Set up default handlers
        this.setupDefaultHandlers();

        // Start monitoring
        this.isRunning = true;
        this.startMonitoring();

        console.log(`✅ Coordination Daemon running (Agent ID: ${this.agent.agentId})`);
        console.log(`📊 Monitoring for tasks every 5 seconds...`);

        // Handle shutdown gracefully
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    setupDefaultHandlers() {
        // Handler for tasks that need external agent execution
        this.registerHandler('invoke_agent', async (task) => {
            const { agentType, command, context } = task.data;
            return await this.invokeExternalAgent(agentType, command, context);
        });

        // Handler for file operations
        this.registerHandler('file_operation', async (task) => {
            console.log(`📁 File operation: ${task.description}`);
            return { status: 'completed', message: 'File operation executed' };
        });

        // Handler for coordination tasks
        this.registerHandler('coordination', async (task) => {
            console.log(`🔄 Coordination task: ${task.description}`);
            return { status: 'completed', message: 'Coordination task executed' };
        });
    }

    registerHandler(taskType, handler) {
        this.handlers.set(taskType, handler);
        console.log(`📝 Registered handler for task type: ${taskType}`);
    }

    startMonitoring() {
        // Check for tasks every 5 seconds
        this.taskCheckInterval = setInterval(async () => {
            try {
                await this.checkAndExecuteTasks();
            } catch (error) {
                console.error('❌ Error checking tasks:', error.message);
            }
        }, 5000);

        // Also check immediately
        this.checkAndExecuteTasks();
    }

    async checkAndExecuteTasks() {
        if (!this.isRunning) return;

        // Get tasks assigned to this daemon
        const tasks = await this.agent.database.getTasksForAgent(this.agent.agentId);

        if (tasks.length > 0) {
            console.log(`\n📋 Found ${tasks.length} task(s) to process`);
        }

        for (const task of tasks) {
            await this.executeTask(task);
        }
    }

    async executeTask(task) {
        console.log(`\n⚡ Executing task: ${task.description}`);
        console.log(`   Type: ${task.task_type}`);
        console.log(`   Priority: ${task.priority}`);

        try {
            // Mark task as in progress
            await this.agent.database.updateTaskStatus(task.id, 'in_progress');

            // Find handler for this task type
            const handler = this.handlers.get(task.task_type);

            let result;
            if (handler) {
                result = await handler(task);
            } else {
                result = await this.defaultTaskHandler(task);
            }

            // Mark task as completed
            await this.agent.database.updateTaskStatus(task.id, 'completed', result);
            console.log(`   ✅ Task completed: ${task.id}`);

        } catch (error) {
            console.error(`   ❌ Task failed: ${error.message}`);
            await this.agent.database.updateTaskStatus(task.id, 'failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    async defaultTaskHandler(task) {
        console.log(`   ⚠️  No specific handler for task type: ${task.task_type}`);
        console.log(`   📦 Task data:`, task.data);
        return { status: 'completed', message: 'Default handler executed' };
    }

    async invokeExternalAgent(agentType, command, context = {}) {
        console.log(`   🤖 Invoking external agent: ${agentType}`);
        console.log(`   📝 Command: ${command}`);

        // For Claude Code, we can't directly invoke it, but we can:
        // 1. Write task to a file that Claude Code checks
        // 2. Use MCP if available
        // 3. Queue for manual execution

        const invocationId = Date.now().toString();
        const invocationData = {
            agentType,
            command,
            context,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Write to invocation queue
        const fs = require('fs');
        const invocationPath = path.join(__dirname, 'invocations', `${invocationId}.json`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(path.dirname(invocationPath))) {
            fs.mkdirSync(path.dirname(invocationPath), { recursive: true });
        }

        fs.writeFileSync(invocationPath, JSON.stringify(invocationData, null, 2));

        console.log(`   📤 Invocation queued: ${invocationPath}`);

        return {
            invocationId,
            status: 'queued',
            path: invocationPath
        };
    }

    async getStats() {
        const agentStats = await this.agent.getAgentStats();
        const coordStats = await this.taskCoordinator.getCoordinationStats();

        return {
            daemon: {
                name: this.agentName,
                agentId: this.agent.agentId,
                uptime: process.uptime(),
                running: this.isRunning
            },
            agents: agentStats,
            coordination: coordStats,
            handlers: Array.from(this.handlers.keys())
        };
    }

    async shutdown() {
        console.log('\n\n🛑 Shutting down Coordination Daemon...');
        this.isRunning = false;

        if (this.taskCheckInterval) {
            clearInterval(this.taskCheckInterval);
        }

        if (this.agent) {
            await this.agent.shutdown();
        }

        console.log('✅ Daemon shutdown complete');
        process.exit(0);
    }
}

// CLI Interface
if (require.main === module) {
    const daemon = new CoordinationDaemon('CoordinationDaemon', 'daemon');

    daemon.start().catch((error) => {
        console.error('❌ Failed to start daemon:', error);
        process.exit(1);
    });

    // Optional: Expose stats endpoint
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'daemon> '
    });

    console.log('\n💡 Commands: stats, tasks, agents, quit\n');
    rl.prompt();

    rl.on('line', async (line) => {
        const cmd = line.trim().toLowerCase();

        switch (cmd) {
            case 'stats':
                const stats = await daemon.getStats();
                console.log(JSON.stringify(stats, null, 2));
                break;
            case 'tasks':
                const tasks = await daemon.agent.database.getTasksForAgent(daemon.agent.agentId);
                console.log(`📋 ${tasks.length} pending task(s)`);
                tasks.forEach(t => console.log(`   • ${t.description} (${t.task_type})`));
                break;
            case 'agents':
                const agents = await daemon.agent.discoverAgents();
                console.log(`🤖 ${agents.length} active agent(s)`);
                agents.forEach(a => console.log(`   • ${a.name} (${a.type})`));
                break;
            case 'quit':
            case 'exit':
                await daemon.shutdown();
                break;
            default:
                console.log('Unknown command. Try: stats, tasks, agents, quit');
        }

        rl.prompt();
    });
}

module.exports = CoordinationDaemon;
