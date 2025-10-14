#!/usr/bin/env node

/**
 * Send Message to Agent
 * Direct messaging between agents via named pipes or database
 */

const AgentRegistry = require('./agent-registry');

async function sendMessage() {
    console.log('💬 Sending Message to Agent\n');

    // Create sender agent
    const sender = new AgentRegistry(null, 'MessageSender', 'script');
    await sender.initialize();

    // Get available agents
    const agents = await sender.discoverAgents();
    console.log(`Found ${agents.length} active agent(s):`);
    agents.forEach((agent, idx) => {
        console.log(`  ${idx + 1}. ${agent.name} (${agent.type})`);
    });

    if (agents.length === 0) {
        console.log('\n❌ No agents available');
        await sender.shutdown();
        process.exit(1);
    }

    const targetAgent = agents[0];
    console.log(`\n📨 Sending message to: ${targetAgent.name}\n`);

    // Method 1: Send via database
    await sender.database.sendMessage(
        sender.agentId,
        targetAgent.id,
        'request',
        {
            action: 'analyze_code',
            parameters: {
                directory: './src',
                type: 'security_audit'
            }
        },
        8 // priority
    );

    console.log('✅ Message sent via database');

    // Method 2: Send via named pipe (real-time)
    sender.namedPipeCoordinator.sendMessage({
        type: 'task_request',
        targetAgent: targetAgent.id,
        data: {
            task: 'code_review',
            files: ['src/index.js', 'src/utils.js']
        }
    });

    console.log('✅ Message sent via named pipe');

    // Method 3: Broadcast to all agents
    sender.namedPipeCoordinator.sendMessage({
        type: 'announcement',
        message: 'System maintenance in 5 minutes',
        priority: 'high'
    });

    console.log('✅ Broadcast message sent to all agents');

    console.log('\n💡 Messages are now in the coordination system!');

    await sender.shutdown();
}

sendMessage().catch(console.error);
