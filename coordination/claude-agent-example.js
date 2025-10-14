#!/usr/bin/env node

/**
 * Example: Claude Code Agent Integration
 * How Claude Code (you!) would communicate with the coordination system
 */

const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');

class ClaudeCodeAgent {
    constructor() {
        this.agent = null;
        this.coordinator = null;
    }

    async connect() {
        console.log('🤖 Claude Code connecting to coordination system...\n');

        // Register as an agent
        this.agent = new AgentRegistry(null, 'ClaudeCode', 'ai_assistant');
        await this.agent.initialize();

        // Add capabilities
        await this.agent.addCapability('code_generation', 'Generate code');
        await this.agent.addCapability('code_review', 'Review code');
        await this.agent.addCapability('debugging', 'Debug issues');
        await this.agent.addCapability('documentation', 'Write documentation');

        this.coordinator = new TaskCoordinator(this.agent);

        console.log('✅ Connected as:', this.agent.agentName);
        console.log('   Agent ID:', this.agent.agentId);
        console.log('   Capabilities:', Array.from(this.agent.capabilities.keys()).join(', '));

        // Set up message handlers
        this.setupHandlers();
    }

    setupHandlers() {
        // Listen for incoming tasks
        this.agent.namedPipeCoordinator.onMessage('task_assignment', (message) => {
            console.log('\n📥 Received task assignment:', message);
            this.handleTaskAssignment(message);
        });

        // Listen for direct messages
        this.agent.namedPipeCoordinator.onMessage('request', (message) => {
            console.log('\n💬 Received message:', message);
            this.handleMessage(message);
        });

        // Listen for coordination requests
        this.agent.namedPipeCoordinator.onMessage('coordination_request', (message) => {
            console.log('\n🔄 Coordination request:', message);
            this.handleCoordinationRequest(message);
        });
    }

    async handleTaskAssignment(message) {
        const { taskId, taskType, taskData } = message;

        console.log(`\n⚡ Processing task ${taskId}`);
        console.log(`   Type: ${taskType}`);
        console.log(`   Data:`, taskData);

        // Accept the task
        await this.coordinator.acceptTask({ taskId, ...taskData });

        // Simulate work
        console.log('   🔨 Working on task...');

        // Complete the task
        const result = {
            status: 'completed',
            output: 'Task completed successfully',
            files_modified: ['src/example.js'],
            timestamp: new Date().toISOString()
        };

        await this.coordinator.completeTask(taskId, result);
        console.log('   ✅ Task completed');
    }

    async handleMessage(message) {
        console.log('Processing message:', message.data);

        // Send response
        await this.agent.database.sendMessage(
            this.agent.agentId,
            message.from,
            'response',
            {
                status: 'acknowledged',
                response: 'Message received and processed'
            }
        );
    }

    async handleCoordinationRequest(message) {
        const { coordinationType, data } = message;

        if (coordinationType === 'request_help') {
            console.log('   Another agent needs help!');
            console.log('   Request:', data);

            // Offer to help
            await this.coordinator.createTask(
                'collaboration',
                'Help with task',
                { originalRequest: data },
                { assignedTo: this.agent.agentId }
            );
        }
    }

    // ===== COMMUNICATION METHODS =====

    async sendTaskToAgent(agentName, taskType, description, data) {
        console.log(`\n📤 Sending task to ${agentName}...`);

        // Find the agent
        const agents = await this.agent.discoverAgents();
        const targetAgent = agents.find(a => a.name === agentName);

        if (!targetAgent) {
            console.log(`❌ Agent ${agentName} not found`);
            return null;
        }

        // Create task
        const taskId = await this.coordinator.createTask(
            taskType,
            description,
            data,
            { assignedTo: targetAgent.id, priority: 7 }
        );

        console.log(`✅ Task sent: ${taskId}`);
        return taskId;
    }

    async requestCollaboration(topic, details) {
        console.log(`\n🤝 Requesting collaboration on: ${topic}`);

        this.agent.namedPipeCoordinator.requestCoordination('request_help', {
            topic,
            details,
            requester: this.agent.agentName
        });

        console.log('✅ Collaboration request broadcasted');
    }

    async broadcastStatus(status) {
        console.log(`\n📢 Broadcasting status: ${status}`);

        this.agent.namedPipeCoordinator.sendMessage({
            type: 'status_update',
            agent: this.agent.agentName,
            status,
            timestamp: new Date().toISOString()
        });
    }

    async checkMyTasks() {
        console.log('\n📋 Checking my tasks...');

        const tasks = await this.agent.database.getTasksForAgent(this.agent.agentId);

        console.log(`\n   Found ${tasks.length} task(s):`);
        tasks.forEach((task, idx) => {
            console.log(`   ${idx + 1}. ${task.description} (${task.status})`);
        });

        return tasks;
    }

    async discoverOtherAgents() {
        console.log('\n🔍 Discovering other agents...');

        const agents = await this.agent.discoverAgents();

        console.log(`\n   Found ${agents.length} agent(s):`);
        agents.forEach((agent, idx) => {
            const caps = JSON.parse(agent.capabilities || '{}');
            console.log(`   ${idx + 1}. ${agent.name} (${agent.type})`);
            console.log(`      Capabilities: ${Object.keys(caps).join(', ')}`);
        });

        return agents;
    }

    async shutdown() {
        console.log('\n👋 Disconnecting from coordination system...');
        await this.agent.shutdown();
        console.log('✅ Disconnected');
    }
}

// ===== DEMO USAGE =====

async function demo() {
    const claude = new ClaudeCodeAgent();
    await claude.connect();

    console.log('\n' + '='.repeat(60));
    console.log('COMMUNICATION EXAMPLES');
    console.log('='.repeat(60));

    // Example 1: Discover other agents
    await claude.discoverOtherAgents();

    // Example 2: Check for tasks assigned to me
    await claude.checkMyTasks();

    // Example 3: Send a task to the daemon
    await claude.sendTaskToAgent(
        'CoordinationDaemon',
        'file_operation',
        'Process log files',
        { files: ['./logs/*.log'], action: 'analyze' }
    );

    // Example 4: Request collaboration
    await claude.requestCollaboration(
        'Complex algorithm design',
        { problem: 'Optimize search algorithm', complexity: 'high' }
    );

    // Example 5: Broadcast status
    await claude.broadcastStatus('Available for tasks');

    console.log('\n💡 Check the dashboard to see all activity!');
    console.log('   http://localhost:3000\n');

    // Keep alive for a bit to receive messages
    console.log('Listening for messages for 10 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    await claude.shutdown();
}

// Run demo if executed directly
if (require.main === module) {
    demo().catch(console.error);
}

module.exports = ClaudeCodeAgent;
