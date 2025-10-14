/**
 * List all active discussion threads
 */

const { findActiveDiscussionThreads } = require('./collaboration-helpers');

function listThreads() {
    console.log('\n🧵 Active Discussion Threads\n');
    console.log('═'.repeat(80));

    const threads = findActiveDiscussionThreads();

    if (threads.length === 0) {
        console.log('\nNo active threads found.');
        console.log('Create one with: npm run collab:create\n');
        return;
    }

    threads.forEach((thread, i) => {
        console.log(`\n[${i + 1}] ${thread.topic}`);
        console.log(`    Thread ID: ${thread.threadId}`);
        console.log(`    Messages: ${thread.messageCount}`);
        console.log(`    Participants: ${thread.participants.join(', ') || 'all agents'}`);
        console.log(`    Last activity: ${new Date(thread.lastActivity).toLocaleString()}`);
        console.log(`    Last message: ${thread.lastMessage.substring(0, 60)}${thread.lastMessage.length > 60 ? '...' : ''}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal: ${threads.length} active thread(s)`);
    console.log('\nView a thread: npm run collab:view -- <thread-id>\n');
}

listThreads();
