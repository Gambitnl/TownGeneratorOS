const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');

class MultiAgentDemo {
    constructor() {
        this.agents = new Map();
        this.isRunning = false;
    }

    async createAgent(name, type, capabilities = []) {
        const agent = new AgentRegistry(null, name, type);

        // Add capabilities
        for (const capability of capabilities) {
            await agent.addCapability(capability, `${capability} processing capability`);
        }

        // Initialize agent
        await agent.initialize();

        // Create task coordinator
        const taskCoordinator = new TaskCoordinator(agent);
        agent.taskCoordinator = taskCoordinator;

        this.agents.set(name, { agent, taskCoordinator });
        console.log(`✓ Created agent: ${name} (${type}) with capabilities: [${capabilities.join(', ')}]`);

        return { agent, taskCoordinator };
    }

    async runCoordinationDemo() {
        console.log('\n🚀 Starting Multi-Agent Coordination Demo\n');

        try {
            // Create multiple agents with different capabilities
            await this.createAgent('Claude', 'coordinator', ['coordination', 'planning', 'analysis']);
            await this.createAgent('Gemini', 'researcher', ['research', 'data_analysis', 'web_search']);
            await this.createAgent('Codex', 'developer', ['coding', 'testing', 'debugging']);

            // Wait for agents to discover each other
            console.log('\n⏳ Waiting for agent discovery...');
            await this.delay(3000);

            // Demonstrate agent discovery
            await this.demonstrateDiscovery();

            // Demonstrate task coordination
            await this.demonstrateTaskCoordination();

            // Demonstrate coordination patterns
            await this.demonstrateCoordinationPatterns();

            // Show final statistics
            await this.showFinalStats();

        } catch (error) {
            console.error('Demo error:', error);
        }
    }

    async demonstrateDiscovery() {
        console.log('\n🔍 Agent Discovery Demo');
        console.log('═'.repeat(50));

        for (const [name, { agent }] of this.agents) {
            console.log(`\n${name} discovering other agents...`);
            const discoveredAgents = await agent.discoverAgents();

            console.log(`Found ${discoveredAgents.length} other agents:`);
            for (const discoveredAgent of discoveredAgents) {
                console.log(`  • ${discoveredAgent.name} (${discoveredAgent.type})`);
                console.log(`    Capabilities: [${Object.keys(discoveredAgent.capabilities || {}).join(', ')}]`);
            }
        }
    }

    async demonstrateTaskCoordination() {
        console.log('\n📋 Task Coordination Demo');
        console.log('═'.repeat(50));

        const claude = this.agents.get('Claude').taskCoordinator;

        // Create different types of tasks
        const tasks = [
            {
                type: 'web_research',
                description: 'Research latest AI developments',
                requiredCapability: 'research',
                priority: 8
            },
            {
                type: 'code_review',
                description: 'Review authentication module',
                requiredCapability: 'coding',
                priority: 7
            },
            {
                type: 'data_analysis',
                description: 'Analyze user behavior metrics',
                requiredCapability: 'data_analysis',
                priority: 6
            },
            {
                type: 'planning',
                description: 'Create project roadmap',
                requiredCapability: 'planning',
                priority: 9
            }
        ];

        console.log('\nCreating tasks...');
        for (const taskData of tasks) {
            const taskId = await claude.createTask(
                taskData.type,
                taskData.description,
                { demoData: true },
                {
                    requiredCapability: taskData.requiredCapability,
                    priority: taskData.priority,
                    strategy: 'capability_based'
                }
            );
            console.log(`  ✓ Created task: ${taskData.description} (Priority: ${taskData.priority})`);
        }

        // Wait for task assignment and execution
        console.log('\n⏳ Waiting for task execution...');
        await this.delay(8000);

        // Show task status
        const stats = await claude.getCoordinationStats();
        console.log('\nTask Coordination Results:');
        console.log(`  • Queued: ${stats.queuedTasks}`);
        console.log(`  • Active: ${stats.activeTasks}`);
        console.log(`  • Completed: ${stats.completedTasks}`);
    }

    async demonstrateCoordinationPatterns() {
        console.log('\n🔄 Coordination Patterns Demo');
        console.log('═'.repeat(50));

        const claude = this.agents.get('Claude').taskCoordinator;

        // Demonstrate different coordination strategies
        console.log('\n1. Load Balancing:');
        await claude.redistributeTasks();
        console.log('   ✓ Tasks redistributed for optimal load balancing');

        // Demonstrate priority boost
        console.log('\n2. Priority Management:');
        const highPriorityTask = await claude.createTask(
            'urgent_fix',
            'Critical bug fix required',
            { severity: 'high' },
            { priority: 10, strategy: 'priority_based' }
        );
        console.log('   ✓ High-priority task created and assigned');

        // Demonstrate agent coordination
        console.log('\n3. Agent Coordination:');
        const collaborativeTask = await claude.createTask(
            'collaborative_project',
            'Multi-agent collaboration task',
            { requiresMultipleAgents: true },
            { priority: 7, strategy: 'load_balanced' }
        );
        console.log('   ✓ Collaborative task distributed across agents');

        await this.delay(5000);
    }

    async showFinalStats() {
        console.log('\n📊 Final Coordination Statistics');
        console.log('═'.repeat(50));

        for (const [name, { agent, taskCoordinator }] of this.agents) {
            console.log(`\n${name} Agent Stats:`);

            const agentStats = await agent.getAgentStats();
            console.log(`  • Status: ${agentStats.status}`);
            console.log(`  • Known Agents: ${agentStats.knownAgents}`);
            console.log(`  • Capabilities: [${agentStats.capabilities.join(', ')}]`);

            const coordStats = await taskCoordinator.getCoordinationStats();
            console.log(`  • Queued Tasks: ${coordStats.queuedTasks}`);
            console.log(`  • Active Tasks: ${coordStats.activeTasks}`);
            console.log(`  • Completed Tasks: ${coordStats.completedTasks}`);
        }

        // Show message queue statistics
        console.log('\nMessage Queue Statistics:');
        for (const [name, { agent }] of this.agents) {
            const queueStats = await agent.fileMessageQueue.getQueueStats();
            console.log(`  ${name}: Inbox(${queueStats.inbox}) Outbox(${queueStats.outbox}) Processed(${queueStats.processed})`);
        }
    }

    async demonstrateFailover() {
        console.log('\n🔄 Agent Failover Demo');
        console.log('═'.repeat(50));

        // Simulate agent failure
        const geminiAgent = this.agents.get('Gemini').agent;
        console.log('\nSimulating Gemini agent failure...');

        // Shutdown Gemini
        await geminiAgent.shutdown();
        this.agents.delete('Gemini');

        console.log('✓ Gemini agent offline');

        // Wait for failure detection
        await this.delay(3000);

        // Create replacement agent
        console.log('\nCreating replacement agent...');
        await this.createAgent('Gemini-2', 'researcher', ['research', 'data_analysis', 'backup_ops']);

        console.log('✓ Failover completed - new agent online');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async shutdown() {
        console.log('\n🛑 Shutting down demo...');

        for (const [name, { agent }] of this.agents) {
            console.log(`Shutting down ${name}...`);
            await agent.shutdown();
        }

        console.log('✓ All agents shut down successfully');
    }
}

// Main demo execution
async function runDemo() {
    const demo = new MultiAgentDemo();

    try {
        await demo.runCoordinationDemo();

        // Optional: Demonstrate failover
        // await demo.demonstrateFailover();

        console.log('\n✅ Demo completed successfully!');
        console.log('\nPress Ctrl+C to exit or wait 10 seconds for automatic shutdown...');

        // Auto-shutdown after 10 seconds
        setTimeout(async () => {
            await demo.shutdown();
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('Demo failed:', error);
        await demo.shutdown();
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received shutdown signal...');
    const demo = new MultiAgentDemo();
    await demo.shutdown();
    process.exit(0);
});

// Export for use as module
module.exports = MultiAgentDemo;

// Run demo if this file is executed directly
if (require.main === module) {
    console.log('🤖 Multi-Agent Coordination System Demo');
    console.log('═'.repeat(50));
    runDemo();
}