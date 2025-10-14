/**
 * View a specific discussion thread
 * Usage: npm run collab:view -- <thread-id>
 */

const { viewThread } = require('./collaboration-helpers');

const threadId = process.argv[2];

if (!threadId) {
    console.error('\n❌ Error: Thread ID required');
    console.log('\nUsage: npm run collab:view -- <thread-id>');
    console.log('       node view-thread.js <thread-id>\n');
    process.exit(1);
}

try {
    viewThread(threadId);
} catch (error) {
    console.error(`\n❌ Error viewing thread: ${error.message}\n`);
    process.exit(1);
}
