#!/usr/bin/env node

/**
 * Send Task to Agent
 * Example script showing how to communicate with agents via task assignment
 */

const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');

async function sendTask() {
    console.log('📤 Sending Task to Agent\n');

    // Create a temporary agent to send the task
    const sender = new AgentRegistry(null, 'TaskSender', 'script');
    await sender.initialize();
    await sender.addCapability('task_creation', 'Can create tasks for others');

    const coordinator = new TaskCoordinator(sender);

    // Get list of available agents
    const agents = await sender.discoverAgents();
    console.log(`Found ${agents.length} active agent(s):`);
    agents.forEach((agent, idx) => {
        console.log(`  ${idx + 1}. ${agent.name} (${agent.type})`);
    });

    if (agents.length === 0) {
        console.log('\n❌ No agents available. Start the daemon first!');
        await sender.shutdown();
        process.exit(1);
    }

    // Create a task for the daemon
    const daemonAgent = agents.find(a => a.type === 'daemon');

    if (!daemonAgent) {
        console.log('\n⚠️  No daemon found, assigning to first available agent');
    }

    const targetAgent = daemonAgent || agents[0];

    console.log(`\n🎯 Creating task for: ${targetAgent.name}\n`);

    // Example 1: Simple task
    const taskId = await coordinator.createTask(
        'invoke_agent',
        'Analyze the codebase for security issues',
        {
            agentType: 'claude_code',
            command: 'Review all files in src/ for potential security vulnerabilities',
            context: {
                directory: './src',
                focus: 'security',
                report_format: 'markdown'
            }
        },
        {
            assignedTo: targetAgent.id,
            priority: 8,
            strategy: 'capability_based'
        }
    );

    console.log(`✅ Task created: ${taskId}`);
    console.log(`   Assigned to: ${targetAgent.name}`);
    console.log(`   Type: invoke_agent`);
    console.log(`   Priority: 8`);

    // Example 2: File operation task
    const fileTaskId = await coordinator.createTask(
        'file_operation',
        'Process data file',
        {
            operation: 'analyze',
            file: './data/metrics.json',
            output: './reports/analysis.md'
        },
        {
            assignedTo: targetAgent.id,
            priority: 5
        }
    );

    console.log(`\n✅ Another task created: ${fileTaskId}`);

    // Show coordination stats
    const stats = await coordinator.getCoordinationStats();
    console.log('\n📊 Coordination Stats:');
    console.log(`   Queued: ${stats.queuedTasks}`);
    console.log(`   Active: ${stats.activeTasks}`);
    console.log(`   Completed: ${stats.completedTasks}`);

    console.log('\n💡 Check the dashboard to see the tasks!');
    console.log('   http://localhost:3000\n');

    await sender.shutdown();
}

sendTask().catch(console.error);
