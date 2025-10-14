/**
 * Threading System for Multi-Agent Collaboration
 * Enables async discussion-based collaboration between agents
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ThreadingSystem {
    constructor(baseDir = './threads') {
        this.baseDir = baseDir;
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    /**
     * Create a new discussion thread
     */
    async createThread(topic, taskId, participants = [], options = {}) {
        const threadId = options.threadId || this.generateThreadId(topic);
        const threadDir = path.join(this.baseDir, threadId);

        if (fs.existsSync(threadDir)) {
            throw new Error(`Thread ${threadId} already exists`);
        }

        // Create thread directory
        fs.mkdirSync(threadDir, { recursive: true });
        fs.mkdirSync(path.join(threadDir, 'artifacts'), { recursive: true });

        // Create metadata
        const metadata = {
            thread_id: threadId,
            task_id: taskId,
            topic,
            participants,
            status: 'active',
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            message_count: 0,
            consensus_level: 'none',
            ...options
        };

        fs.writeFileSync(
            path.join(threadDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        // Create empty messages file
        fs.writeFileSync(path.join(threadDir, 'messages.jsonl'), '');

        // Create consensus tracking
        const consensus = {
            proposals: [],
            votes: {},
            status: 'no_consensus'
        };

        fs.writeFileSync(
            path.join(threadDir, 'consensus.json'),
            JSON.stringify(consensus, null, 2)
        );

        console.log(`✅ Thread created: ${threadId}`);
        return threadId;
    }

    /**
     * Contribute to a thread
     */
    async contributeToThread(threadId, contribution) {
        const threadDir = path.join(this.baseDir, threadId);

        if (!fs.existsSync(threadDir)) {
            throw new Error(`Thread ${threadId} not found`);
        }

        // Load metadata
        const metadata = this.getThreadMetadata(threadId);

        // Create message entry
        const message = {
            seq: metadata.message_count + 1,
            agent: contribution.agent,
            timestamp: new Date().toISOString(),
            message: contribution.message,
            type: contribution.type || 'comment',
            references: contribution.references || [],
            artifacts: contribution.artifacts || []
        };

        // Append to messages file
        const messagesPath = path.join(threadDir, 'messages.jsonl');
        fs.appendFileSync(messagesPath, JSON.stringify(message) + '\n');

        // Save artifacts if any
        if (contribution.code_proposal) {
            const artifactName = `${contribution.agent}-proposal-${message.seq}.js`;
            fs.writeFileSync(
                path.join(threadDir, 'artifacts', artifactName),
                contribution.code_proposal
            );
            message.artifacts.push(artifactName);
        }

        // Update metadata
        metadata.message_count++;
        metadata.last_activity = new Date().toISOString();
        fs.writeFileSync(
            path.join(threadDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        console.log(`✅ Contribution added to thread ${threadId}`);
        return message.seq;
    }

    /**
     * Get all messages in a thread
     */
    getThreadMessages(threadId) {
        const messagesPath = path.join(this.baseDir, threadId, 'messages.jsonl');

        if (!fs.existsSync(messagesPath)) {
            return [];
        }

        const content = fs.readFileSync(messagesPath, 'utf8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
    }

    /**
     * Get thread metadata
     */
    getThreadMetadata(threadId) {
        const metadataPath = path.join(this.baseDir, threadId, 'metadata.json');

        if (!fs.existsSync(metadataPath)) {
            throw new Error(`Thread ${threadId} not found`);
        }

        return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    /**
     * Find threads for a specific agent
     */
    findThreadsForAgent(agentName) {
        if (!fs.existsSync(this.baseDir)) {
            return [];
        }

        const threadDirs = fs.readdirSync(this.baseDir);
        const threads = [];

        for (const threadId of threadDirs) {
            const metadataPath = path.join(this.baseDir, threadId, 'metadata.json');

            if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

                if (metadata.participants.includes(agentName) || metadata.participants.length === 0) {
                    const messages = this.getThreadMessages(threadId);
                    const lastMessage = messages[messages.length - 1];

                    threads.push({
                        ...metadata,
                        last_message: lastMessage ? lastMessage.message.substring(0, 100) : 'No messages yet',
                        waiting_for: this.determineWaitingFor(messages, agentName)
                    });
                }
            }
        }

        return threads.sort((a, b) =>
            new Date(b.last_activity) - new Date(a.last_activity)
        );
    }

    /**
     * Find @mentions for a specific agent
     */
    findMentions(agentName) {
        const mentions = [];
        const threadDirs = fs.readdirSync(this.baseDir);

        for (const threadId of threadDirs) {
            const messages = this.getThreadMessages(threadId);

            for (const msg of messages) {
                if (msg.message.includes(`@${agentName}`)) {
                    mentions.push({
                        thread: threadId,
                        agent: msg.agent,
                        message: msg.message,
                        timestamp: msg.timestamp
                    });
                }
            }
        }

        return mentions.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    /**
     * Update consensus for a thread
     */
    async updateConsensus(threadId, proposal) {
        const consensusPath = path.join(this.baseDir, threadId, 'consensus.json');
        const consensus = JSON.parse(fs.readFileSync(consensusPath, 'utf8'));

        // Add or update proposal
        const existingIndex = consensus.proposals.findIndex(p => p.id === proposal.id);

        if (existingIndex >= 0) {
            consensus.proposals[existingIndex] = proposal;
        } else {
            consensus.proposals.push(proposal);
        }

        // Calculate consensus status
        consensus.status = this.calculateConsensusStatus(consensus);

        fs.writeFileSync(consensusPath, JSON.stringify(consensus, null, 2));

        return consensus;
    }

    /**
     * Check if consensus is reached
     */
    hasConsensus(threadId, minApprovals = 2) {
        const consensusPath = path.join(this.baseDir, threadId, 'consensus.json');

        if (!fs.existsSync(consensusPath)) {
            return false;
        }

        const consensus = JSON.parse(fs.readFileSync(consensusPath, 'utf8'));

        for (const proposal of consensus.proposals) {
            const approvals = Object.values(proposal.votes || {})
                .filter(vote => vote === 'approve').length;

            if (approvals >= minApprovals) {
                return { reached: true, proposal };
            }
        }

        return { reached: false };
    }

    /**
     * Close a thread
     */
    async closeThread(threadId, summary) {
        const metadata = this.getThreadMetadata(threadId);

        metadata.status = 'closed';
        metadata.closed_at = new Date().toISOString();
        metadata.summary = summary;

        fs.writeFileSync(
            path.join(this.baseDir, threadId, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        console.log(`✅ Thread ${threadId} closed`);
    }

    /**
     * Helper: Generate thread ID from topic
     */
    generateThreadId(topic) {
        const slug = topic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);

        const hash = crypto.createHash('md5').update(topic + Date.now()).digest('hex').substring(0, 8);

        return `${slug}-${hash}`;
    }

    /**
     * Helper: Determine who/what thread is waiting for
     */
    determineWaitingFor(messages, currentAgent) {
        if (messages.length === 0) {
            return 'initial contribution';
        }

        const lastMessage = messages[messages.length - 1];

        // Check for @mentions in last message
        const mentions = lastMessage.message.match(/@(\w+)/g);

        if (mentions) {
            const mentionedAgents = mentions.map(m => m.substring(1));

            if (mentionedAgents.includes(currentAgent)) {
                return `${lastMessage.agent}'s question`;
            }

            return mentionedAgents.join(', ');
        }

        return 'any response';
    }

    /**
     * Helper: Calculate overall consensus status
     */
    calculateConsensusStatus(consensus) {
        if (consensus.proposals.length === 0) {
            return 'no_proposals';
        }

        for (const proposal of consensus.proposals) {
            const votes = Object.values(proposal.votes || {});
            const approvals = votes.filter(v => v === 'approve').length;
            const total = votes.length;

            if (total > 0 && approvals === total) {
                return 'unanimous';
            }

            if (approvals >= Math.ceil(total * 0.67)) {
                return 'majority';
            }
        }

        return 'partial';
    }
}

module.exports = ThreadingSystem;
