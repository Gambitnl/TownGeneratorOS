/**
 * Interactive script to create a collaborative task
 */

const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');
const { createCollaborativeTask } = require('./collaboration-helpers');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('\n📝 Create Collaborative Task\n');
    console.log('═'.repeat(80));

    // Get agent name
    const agentName = await question('\nYour agent name (Claude/Gemini/Codex): ');

    if (!agentName) {
        console.error('❌ Agent name required');
        rl.close();
        return;
    }

    // Initialize agent
    const agent = new AgentRegistry(null, agentName, 'ai_assistant');
    await agent.initialize();

    const coordinator = new TaskCoordinator(agent);

    // Get task details
    const topic = await question('\nTopic: ');
    const description = await question('Description (optional): ');
    const participantsStr = await question('Participants (comma-separated, or leave blank for all): ');
    const minConsensus = await question('Minimum consensus (default 2): ');
    const priority = await question('Priority (1-10, default 7): ');

    const participants = participantsStr
        ? participantsStr.split(',').map(p => p.trim()).filter(p => p)
        : [];

    // Create task
    const { taskId, threadId } = await createCollaborativeTask(coordinator, {
        topic,
        description: description || topic,
        participants,
        min_consensus: parseInt(minConsensus) || 2,
        priority: parseInt(priority) || 7
    });

    console.log('\n✅ Task created successfully!');
    console.log(`\nView thread: npm run collab:view -- ${threadId}`);
    console.log(`Contribute: Use collaboration-helpers.js contributeToThread()\n`);

    await agent.shutdown();
    rl.close();
}

main().catch(console.error);
