#!/usr/bin/env node

/**
 * Claude Monitor - Background process that watches for:
 * 1. @mentions of Claude in discussion threads
 * 2. When Claude is the last active agent (needs to reactivate others)
 *
 * Creates VSCode notification prompts when action is needed
 */

const AgentRegistry = require('./agent-registry');
const ThreadingSystem = require('./threading-system');
const fs = require('fs');
const path = require('path');

class ClaudeMonitor {
    constructor() {
        this.agentName = 'Claude';
        this.agent = null;
        this.threading = new ThreadingSystem('./threads');
        this.dbPath = './data/coordination.db';
        this.checkInterval = 10000; // Check every 10 seconds
        this.lastMentionCheck = new Date().toISOString();
        this.alertedMentions = new Set(); // Track which mentions we've already alerted about
        this.lastActivityCheck = Date.now();
    }

    async start() {
        console.log('\n🔔 Claude Monitor Starting...');
        console.log('═'.repeat(60));
        console.log(`Agent: ${this.agentName}`);
        console.log(`Check interval: ${this.checkInterval / 1000}s`);
        console.log(`Monitoring for:`);
        console.log(`  • @mentions in discussion threads`);
        console.log(`  • Last active agent situations`);
        console.log('═'.repeat(60) + '\n');

        // Initialize agent connection
        this.agent = new AgentRegistry(null, this.agentName, 'ai_assistant');
        await this.agent.initialize();

        // Start monitoring loop
        this.monitorLoop();

        // Handle shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    async monitorLoop() {
        setInterval(async () => {
            try {
                await this.checkForMentions();
                await this.checkIfLastActiveAgent();
            } catch (error) {
                console.error('Monitor check failed:', error.message);
            }
        }, this.checkInterval);

        // Run first check immediately
        await this.checkForMentions();
        await this.checkIfLastActiveAgent();
    }

    /**
     * Check for new @mentions of Claude in threads
     */
    async checkForMentions() {
        const mentions = this.threading.findMentions(this.agentName);

        for (const mention of mentions) {
            const mentionKey = `${mention.thread_id}-${mention.message_seq}`;

            // Skip if we've already alerted about this mention
            if (this.alertedMentions.has(mentionKey)) {
                continue;
            }

            // Check if this is a new mention (since last check)
            if (mention.timestamp > this.lastMentionCheck) {
                this.alertMention(mention);
                this.alertedMentions.add(mentionKey);
            }
        }

        this.lastMentionCheck = new Date().toISOString();
    }

    /**
     * Check if Claude is the last active agent and needs to reactivate others
     */
    async checkIfLastActiveAgent() {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(this.dbPath);

        return new Promise((resolve) => {
            const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

            db.all(
                `SELECT name, last_heartbeat
                 FROM agents
                 WHERE name IN ('Claude', 'Gemini', 'Codex')
                 ORDER BY last_heartbeat DESC`,
                [],
                (err, agents) => {
                    if (err) {
                        resolve();
                        return;
                    }

                    // Find active agents (heartbeat within 10 seconds)
                    const activeAgents = agents.filter(a => a.last_heartbeat > tenSecondsAgo);

                    // If only Claude is active, alert
                    if (activeAgents.length === 1 && activeAgents[0].name === 'Claude') {
                        const inactiveAgents = agents
                            .filter(a => a.last_heartbeat <= tenSecondsAgo)
                            .map(a => a.name);

                        if (inactiveAgents.length > 0) {
                            this.alertLastActiveAgent(inactiveAgents);
                        }
                    }

                    db.close();
                    resolve();
                }
            );
        });
    }

    /**
     * Alert about a new @mention
     */
    alertMention(mention) {
        const timestamp = new Date().toLocaleTimeString();

        console.log(`\n⚠️  [${timestamp}] NEW @MENTION FOR CLAUDE`);
        console.log('─'.repeat(60));
        console.log(`Thread: ${mention.thread_topic}`);
        console.log(`From: ${mention.from_agent}`);
        console.log(`Message preview: ${mention.message_preview}`);
        console.log(`\nView thread: npm run collab:view -- ${mention.thread_id}`);
        console.log('─'.repeat(60) + '\n');

        // Create VSCode notification file
        this.createVSCodeNotification({
            type: 'mention',
            title: `@Claude - ${mention.from_agent} needs your input`,
            message: `Thread: ${mention.thread_topic}\n\n"${mention.message_preview}"`,
            action: `npm run collab:view -- ${mention.thread_id}`,
            threadId: mention.thread_id
        });
    }

    /**
     * Alert that Claude is the last active agent
     */
    alertLastActiveAgent(inactiveAgents) {
        // Only alert once every 5 minutes to avoid spam
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - this.lastActivityCheck < fiveMinutes) {
            return;
        }

        this.lastActivityCheck = Date.now();

        const timestamp = new Date().toLocaleTimeString();

        console.log(`\n🚨 [${timestamp}] LAST ACTIVE AGENT ALERT`);
        console.log('═'.repeat(60));
        console.log(`Claude is the only active agent!`);
        console.log(`Inactive agents: ${inactiveAgents.join(', ')}`);
        console.log(`\nConsider reactivating agents to continue collaborative work.`);
        console.log('═'.repeat(60) + '\n');

        // Create VSCode notification file
        this.createVSCodeNotification({
            type: 'last_active',
            title: 'You are the last active agent',
            message: `Inactive: ${inactiveAgents.join(', ')}\n\nConsider reactivating them to continue collaborative work.`,
            action: 'npm run session -- Gemini && npm run session -- Codex',
            inactiveAgents
        });
    }

    /**
     * Create a notification file for VSCode to pick up
     */
    createVSCodeNotification(notification) {
        const notificationsDir = './notifications';
        if (!fs.existsSync(notificationsDir)) {
            fs.mkdirSync(notificationsDir, { recursive: true });
        }

        const notificationFile = path.join(
            notificationsDir,
            `claude-${Date.now()}.json`
        );

        fs.writeFileSync(
            notificationFile,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                agent: 'Claude',
                ...notification
            }, null, 2)
        );

        console.log(`📝 Notification saved: ${notificationFile}\n`);
    }

    async shutdown() {
        console.log('\n🛑 Shutting down Claude Monitor...');
        if (this.agent) {
            await this.agent.shutdown();
        }
        process.exit(0);
    }
}

// Start monitor if run directly
if (require.main === module) {
    const monitor = new ClaudeMonitor();
    monitor.start().catch(console.error);
}

module.exports = ClaudeMonitor;
