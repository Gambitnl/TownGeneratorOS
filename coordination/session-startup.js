#!/usr/bin/env node

/**
 * Agent Session Startup
 * Run this at the start of every agent session to check for collaborative work
 */

const AgentRegistry = require('./agent-registry');
const TaskCoordinator = require('./task-coordinator');
const ThreadingSystem = require('./threading-system');

/**
 * Startup routine for any agent
 * @param {string} agentName - Name of the agent (Claude, Gemini, Codex, etc.)
 * @returns {Object} Session context
 */
async function agentSessionStartup(agentName) {
    console.log(`\n🤖 ${agentName} Session Starting...`);
    console.log('═'.repeat(60) + '\n');

    try {
        // 1. Connect to coordination system
        const agent = new AgentRegistry(null, agentName, 'ai_assistant');
        await agent.initialize();

        const coordinator = new TaskCoordinator(agent);
        const threading = new ThreadingSystem('./threads');

        console.log(`✅ Connected as: ${agentName}`);
        console.log(`   Agent ID: ${agent.agentId.substring(0, 16)}...`);

        // 2. Check for discussion threads
        console.log(`\n📋 Checking active discussion threads...\n`);

        const threads = threading.findThreadsForAgent(agentName);

        if (threads.length > 0) {
            console.log(`   Found ${threads.length} active thread(s):\n`);

            threads.forEach((thread, i) => {
                console.log(`   ${i + 1}. ${thread.topic}`);
                console.log(`      Status: ${thread.status}`);
                console.log(`      Messages: ${thread.message_count}`);
                console.log(`      Last: "${thread.last_message}..."`);
                console.log(`      Waiting for: ${thread.waiting_for}`);
                console.log('');
            });
        } else {
            console.log(`   No active discussions\n`);
        }

        // 3. Check for @mentions
        console.log(`💬 Checking for @mentions...\n`);

        const mentions = threading.findMentions(agentName);

        if (mentions.length > 0) {
            console.log(`   ⚠️  You were mentioned ${mentions.length} time(s):\n`);

            mentions.forEach((mention, i) => {
                console.log(`   ${i + 1}. ${mention.agent} in ${mention.thread}:`);
                console.log(`      "${mention.message.substring(0, 80)}..."`);
                console.log('');
            });
        } else {
            console.log(`   No pending mentions\n`);
        }

        // 4. Check for assigned tasks
        console.log(`📝 Checking assigned tasks...\n`);

        const tasks = await agent.database.getTasksForAgent(agent.agentId);

        if (tasks.length > 0) {
            console.log(`   You have ${tasks.length} task(s) assigned:\n`);

            tasks.forEach((task, i) => {
                console.log(`   ${i + 1}. ${task.description}`);
                console.log(`      Status: ${task.status} | Priority: ${task.priority}`);
                console.log('');
            });
        } else {
            console.log(`   No assigned tasks\n`);
        }

        // 5. Summary
        console.log('═'.repeat(60));
        console.log('\n📊 Session Summary:');
        console.log(`   Active threads: ${threads.length}`);
        console.log(`   Pending mentions: ${mentions.length}`);
        console.log(`   Assigned tasks: ${tasks.length}`);

        if (mentions.length > 0) {
            console.log(`\n   💡 Respond to @mentions first - other agents are waiting!\n`);
        }

        // Return context for agent to use
        return {
            agent,
            coordinator,
            threading,
            threads,
            mentions,
            tasks
        };

    } catch (error) {
        console.error('\n❌ Session startup failed:', error.message);
        console.error('   Check that coordination system is properly initialized\n');
        throw error;
    }
}

// CLI Usage
if (require.main === module) {
    const agentName = process.argv[2] || 'UnknownAgent';

    if (!process.argv[2]) {
        console.log('\nUsage: node session-startup.js <AgentName>');
        console.log('\nExample:');
        console.log('   node session-startup.js Claude');
        console.log('   node session-startup.js Gemini');
        console.log('   node session-startup.js Codex\n');
        process.exit(1);
    }

    agentSessionStartup(agentName)
        .then(async session => {
            console.log(`\n✅ Session ready! Start collaborating with contributeToThread().\n`);

            // Shut down agent to exit cleanly
            await session.agent.shutdown();
            process.exit(0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = agentSessionStartup;
