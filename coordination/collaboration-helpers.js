/**
 * Collaboration Helper Functions
 * Convenient wrappers for common collaboration tasks
 */

const ThreadingSystem = require('./threading-system');
const TaskCoordinator = require('./task-coordinator');

/**
 * Create a collaborative task that opens a discussion thread
 */
async function createCollaborativeTask(coordinator, options) {
    const {
        topic,
        description,
        participants = [],
        min_consensus = 2,
        data = {}
    } = options;

    // Create the task
    const taskId = await coordinator.createTask(
        'collaborative_discussion',
        description || topic,
        {
            ...data,
            collaborative: true,
            topic,
            participants,
            min_consensus
        },
        {
            priority: options.priority || 7,
            requiredCapability: 'ai_assistant'
        }
    );

    // Create associated thread
    const threading = new ThreadingSystem('./threads');
    const threadId = await threading.createThread(topic, taskId, participants, {
        min_consensus,
        threadId: options.threadId
    });

    console.log(`\n✅ Collaborative task created`);
    console.log(`   Task ID: ${taskId}`);
    console.log(`   Thread ID: ${threadId}`);
    console.log(`   Topic: ${topic}`);
    console.log(`   Participants: ${participants.join(', ') || 'all agents'}`);
    console.log(`   Min consensus: ${min_consensus} agent(s)\n`);

    return { taskId, threadId };
}

/**
 * Contribute to an existing thread
 */
async function contributeToThread(threadId, contribution) {
    const threading = new ThreadingSystem('./threads');

    const messageSeq = await threading.contributeToThread(threadId, contribution);

    console.log(`\n✅ Contribution added`);
    console.log(`   Thread: ${threadId}`);
    console.log(`   From: ${contribution.agent}`);
    console.log(`   Message #${messageSeq}\n`);

    return messageSeq;
}

/**
 * View all messages in a thread
 */
function viewThread(threadId) {
    const threading = new ThreadingSystem('./threads');

    const metadata = threading.getThreadMetadata(threadId);
    const messages = threading.getThreadMessages(threadId);

    console.log(`\n📋 Thread: ${metadata.topic}`);
    console.log('═'.repeat(80));
    console.log(`Status: ${metadata.status} | Messages: ${metadata.message_count}`);
    console.log(`Participants: ${metadata.participants.join(', ') || 'all'}`);
    console.log(`Created: ${new Date(metadata.created_at).toLocaleString()}`);
    console.log('─'.repeat(80) + '\n');

    messages.forEach((msg, i) => {
        console.log(`[${i + 1}] ${msg.agent} (${new Date(msg.timestamp).toLocaleTimeString()})`);
        console.log(`    ${msg.message}\n`);

        if (msg.artifacts && msg.artifacts.length > 0) {
            console.log(`    📎 Artifacts: ${msg.artifacts.join(', ')}\n`);
        }
    });

    console.log('═'.repeat(80) + '\n');

    return { metadata, messages };
}

/**
 * Vote on a proposal in a thread
 */
async function voteOnProposal(threadId, proposalId, agentName, vote) {
    const threading = new ThreadingSystem('./threads');

    // Get existing consensus
    const consensusPath = `./threads/${threadId}/consensus.json`;
    const fs = require('fs');
    const consensus = JSON.parse(fs.readFileSync(consensusPath, 'utf8'));

    // Find proposal
    let proposal = consensus.proposals.find(p => p.id === proposalId);

    if (!proposal) {
        // Create new proposal
        proposal = {
            id: proposalId,
            votes: {}
        };
        consensus.proposals.push(proposal);
    }

    // Add vote
    proposal.votes[agentName] = vote;

    // Save
    await threading.updateConsensus(threadId, proposal);

    console.log(`\n✅ Vote recorded`);
    console.log(`   Proposal: ${proposalId}`);
    console.log(`   ${agentName}: ${vote}`);

    // Check if consensus reached
    const hasConsensus = threading.hasConsensus(threadId);

    if (hasConsensus.reached) {
        console.log(`\n🎉 CONSENSUS REACHED!`);
        console.log(`   Proposal: ${hasConsensus.proposal.id} approved\n`);
    }

    return hasConsensus;
}

/**
 * Find active discussion threads
 */
function findActiveDiscussionThreads() {
    const threading = new ThreadingSystem('./threads');
    const fs = require('fs');

    if (!fs.existsSync('./threads')) {
        return [];
    }

    const threadDirs = fs.readdirSync('./threads');
    const threads = [];

    for (const threadId of threadDirs) {
        const metadata = threading.getThreadMetadata(threadId);

        if (metadata.status === 'active') {
            const messages = threading.getThreadMessages(threadId);

            threads.push({
                threadId,
                topic: metadata.topic,
                messageCount: metadata.message_count,
                participants: metadata.participants,
                lastMessage: messages[messages.length - 1]?.message || 'No messages',
                lastActivity: metadata.last_activity
            });
        }
    }

    return threads.sort((a, b) =>
        new Date(b.lastActivity) - new Date(a.lastActivity)
    );
}

/**
 * Find all threads for a specific agent
 */
function findMyThreads(agentName) {
    const threading = new ThreadingSystem('./threads');
    return threading.findThreadsForAgent(agentName);
}

/**
 * Find mentions of an agent
 */
function findMentions(agentName) {
    const threading = new ThreadingSystem('./threads');
    return threading.findMentions(agentName);
}

/**
 * Close a session with summary
 */
async function closeSession(options) {
    const { agent, summary, next_actions = [] } = options;

    console.log(`\n👋 ${agent} closing session...`);
    console.log(`   Summary: ${summary}`);

    if (next_actions.length > 0) {
        console.log(`\n   📝 Next actions for other agents:`);
        next_actions.forEach(action => {
            console.log(`      • ${action.agent}: ${action.action}`);
        });
    }

    console.log('');

    // Could save session summary to database here
    return { closed: true, summary, next_actions };
}

module.exports = {
    createCollaborativeTask,
    contributeToThread,
    viewThread,
    voteOnProposal,
    findActiveDiscussionThreads,
    findMyThreads,
    findMentions,
    closeSession
};
