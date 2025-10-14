/**
 * Complete example of collaboration workflow
 * Shows how agents collaborate asynchronously through threading
 */

const agentSessionStartup = require('./session-startup');
const {
    createCollaborativeTask,
    contributeToThread,
    viewThread,
    findMyThreads
} = require('./collaboration-helpers');

async function collaborateExample() {
    console.log('\n🤖 Agent Collaboration Example\n');
    console.log('═'.repeat(80));

    // 1. Start session as Claude
    console.log('\n[STEP 1] Starting Claude session...\n');
    const session = await agentSessionStartup('Claude');

    // 2. Create a collaborative task
    console.log('\n[STEP 2] Creating collaborative task...\n');
    const { threadId } = await createCollaborativeTask(session.coordinator, {
        topic: 'Implement caching strategy',
        description: 'Design and implement a caching layer for the coordination system',
        participants: ['Claude', 'Gemini', 'Codex'],
        min_consensus: 2,
        priority: 8
    });

    // 3. Contribute to the thread
    console.log('\n[STEP 3] Adding Claude\'s contribution...\n');
    await contributeToThread(threadId, {
        agent: 'Claude',
        message: `For our 3-agent setup, I propose in-memory caching with LRU eviction:

Pros:
- Fast (no network overhead)
- Simple (no external deps)
- Sufficient for < 10k items
- Works well for local VSCode environment

Cons:
- Not shared between agents
- Lost on restart
- Memory usage scales with cache size

Proposed implementation:
- Use Map for O(1) lookups
- Track access order for LRU
- Max size: 1000 items
- TTL: 5 minutes

@Gemini - What are your thoughts on this vs Redis? Given we're all local, is the complexity worth it?
@Codex - Can you benchmark both approaches with our typical workload?`,

        type: 'proposal',
        code_proposal: `
class LRUCache {
    constructor(maxSize = 1000, ttl = 300000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check expiry
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key, value) {
        // Remove if exists
        this.cache.delete(key);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
}
`
    });

    // 4. View the thread
    console.log('\n[STEP 4] Current thread state:\n');
    viewThread(threadId);

    // 5. Check all my threads
    console.log('\n[STEP 5] Claude\'s active threads:\n');
    const myThreads = findMyThreads('Claude');
    console.log(`Total: ${myThreads.length} thread(s)`);

    myThreads.forEach((thread, i) => {
        console.log(`  ${i + 1}. ${thread.topic} (${thread.status})`);
        console.log(`     Waiting for: ${thread.waiting_for || 'none'}`);
    });

    // 6. Demonstrate session continuation
    console.log('\n[STEP 6] Simulating Gemini\'s next session...\n');
    console.log('─'.repeat(80));
    console.log('(In a real scenario, Gemini would run this in their own session)\n');

    await contributeToThread(threadId, {
        agent: 'Gemini',
        message: `@Claude - Good analysis! I agree in-memory is the right choice for our use case.

Additional considerations:
- We should add cache statistics (hit rate, evictions)
- Consider warming the cache on startup with common queries
- Add cache invalidation hooks for data updates

The LRU implementation looks solid. One suggestion: add a clear() method for testing.

I vote: APPROVE

@Codex - Once you benchmark, can you also test cache warming strategies?`,

        type: 'response'
    });

    console.log('\n[STEP 7] View updated thread:\n');
    viewThread(threadId);

    console.log('\n[STEP 8] Demonstrating Codex\'s response...\n');
    console.log('─'.repeat(80));

    await contributeToThread(threadId, {
        agent: 'Codex',
        message: `@Claude @Gemini - Benchmark results:

In-memory LRU:
- Avg read: 0.02ms
- Avg write: 0.03ms
- Memory: ~50MB for 10k items

Redis (local):
- Avg read: 1.2ms (60x slower)
- Avg write: 1.5ms (50x slower)
- Memory: ~45MB for 10k items
- Setup complexity: High (requires Redis server)

**Verdict**: In-memory LRU is clearly superior for our local use case.

I've implemented Claude's design with Gemini's suggestions:
- Added cache stats tracking
- Implemented clear() method
- Added invalidation hooks
- Tested cache warming (reduces startup latency by 40%)

See attached implementation.

I vote: APPROVE

Ready to merge?`,

        type: 'answer',
        artifacts: ['lru-cache.js', 'cache-benchmark.js']
    });

    console.log('\n[STEP 9] Final thread view:\n');
    viewThread(threadId);

    console.log('\n✅ Collaboration Example Complete!\n');
    console.log('This demonstrates:');
    console.log('  • Asynchronous discussion across multiple agent sessions');
    console.log('  • @mention system for directed questions');
    console.log('  • Code proposals and artifacts');
    console.log('  • Consensus building through discussion');
    console.log('  • Persistent threading that survives session ends\n');

    await session.agent.shutdown();
}

// Run if called directly
if (require.main === module) {
    collaborateExample().catch(console.error);
}

module.exports = collaborateExample;
