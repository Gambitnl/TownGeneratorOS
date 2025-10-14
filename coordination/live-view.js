#!/usr/bin/env node

/**
 * Live Database View
 * Real-time monitoring of coordination database changes
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class LiveDatabaseView {
    constructor(dbPath = './data/coordination.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.pollInterval = null;
        this.lastState = {
            agents: new Map(),
            tasks: new Map(),
            messages: new Map()
        };
        this.updateCount = 0;
    }

    async start() {
        console.log('🔴 LIVE DATABASE VIEW');
        console.log('═══════════════════════════════════════════════════\n');

        // Open database
        this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('❌ Failed to open database:', err.message);
                process.exit(1);
            }
        });

        // Initial snapshot
        await this.refresh();

        // Poll for changes every 1 second
        this.pollInterval = setInterval(() => this.refresh(), 1000);

        // Handle shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());

        console.log('\n💡 Press Ctrl+C to exit\n');
        console.log('Monitoring for changes...\n');
    }

    async refresh() {
        const newState = {
            agents: new Map(),
            tasks: new Map(),
            messages: new Map()
        };

        // Get current state
        await Promise.all([
            this.queryAgents(newState),
            this.queryTasks(newState),
            this.queryMessages(newState)
        ]);

        // Detect changes
        this.detectChanges(newState);

        // Update last state
        this.lastState = newState;
    }

    queryAgents(state) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM agents ORDER BY registered_at DESC', [], (err, rows) => {
                if (err) {
                    console.error('Error querying agents:', err.message);
                    reject(err);
                } else {
                    rows.forEach(row => {
                        state.agents.set(row.id, row);
                    });
                    resolve();
                }
            });
        });
    }

    queryTasks(state) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
                if (err) {
                    console.error('Error querying tasks:', err.message);
                    reject(err);
                } else {
                    rows.forEach(row => {
                        state.tasks.set(row.id, row);
                    });
                    resolve();
                }
            });
        });
    }

    queryMessages(state) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
                if (err) {
                    console.error('Error querying messages:', err.message);
                    reject(err);
                } else {
                    rows.forEach(row => {
                        state.messages.set(row.id, row);
                    });
                    resolve();
                }
            });
        });
    }

    detectChanges(newState) {
        let hasChanges = false;

        // Check for new or updated agents
        for (const [id, agent] of newState.agents) {
            const old = this.lastState.agents.get(id);
            if (!old) {
                this.logChange('AGENT', 'NEW', agent);
                hasChanges = true;
            } else if (this.hasChanged(old, agent)) {
                this.logChange('AGENT', 'UPDATED', agent, old);
                hasChanges = true;
            }
        }

        // Check for removed agents
        for (const [id, agent] of this.lastState.agents) {
            if (!newState.agents.has(id)) {
                this.logChange('AGENT', 'REMOVED', agent);
                hasChanges = true;
            }
        }

        // Check for new or updated tasks
        for (const [id, task] of newState.tasks) {
            const old = this.lastState.tasks.get(id);
            if (!old) {
                this.logChange('TASK', 'NEW', task);
                hasChanges = true;
            } else if (this.hasChanged(old, task)) {
                this.logChange('TASK', 'UPDATED', task, old);
                hasChanges = true;
            }
        }

        // Check for removed tasks
        for (const [id, task] of this.lastState.tasks) {
            if (!newState.tasks.has(id)) {
                this.logChange('TASK', 'REMOVED', task);
                hasChanges = true;
            }
        }

        // Check for new messages
        for (const [id, message] of newState.messages) {
            const old = this.lastState.messages.get(id);
            if (!old) {
                this.logChange('MESSAGE', 'NEW', message);
                hasChanges = true;
            } else if (this.hasChanged(old, message)) {
                this.logChange('MESSAGE', 'UPDATED', message, old);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            this.updateCount++;
            console.log(`\n${'─'.repeat(60)}`);
        }
    }

    hasChanged(old, current) {
        // Compare relevant fields
        return JSON.stringify(old) !== JSON.stringify(current);
    }

    logChange(type, action, item, oldItem = null) {
        const timestamp = new Date().toLocaleTimeString();

        console.log(`\n[${timestamp}] ${this.getIcon(type, action)} ${type} ${action}`);

        if (type === 'AGENT') {
            console.log(`   Name: ${item.name} (${item.type})`);
            console.log(`   ID: ${item.id.substring(0, 8)}...`);
            console.log(`   Status: ${item.status}`);

            if (action === 'UPDATED' && oldItem) {
                this.showDiff(oldItem, item);
            }
        }

        if (type === 'TASK') {
            console.log(`   Description: ${item.description}`);
            console.log(`   Type: ${item.task_type}`);
            console.log(`   Status: ${item.status} | Priority: ${item.priority}`);
            console.log(`   Assigned To: ${item.assigned_to || 'unassigned'}`);

            if (action === 'UPDATED' && oldItem) {
                this.showDiff(oldItem, item);
            }
        }

        if (type === 'MESSAGE') {
            console.log(`   Type: ${item.message_type}`);
            console.log(`   From: ${item.from_agent.substring(0, 8)}...`);
            console.log(`   To: ${item.to_agent ? item.to_agent.substring(0, 8) + '...' : 'broadcast'}`);
            console.log(`   Status: ${item.status}`);
        }
    }

    showDiff(oldItem, newItem) {
        const changes = [];

        for (const key in newItem) {
            if (oldItem[key] !== newItem[key]) {
                changes.push(`${key}: ${oldItem[key]} → ${newItem[key]}`);
            }
        }

        if (changes.length > 0) {
            console.log(`   Changes: ${changes.join(', ')}`);
        }
    }

    getIcon(type, action) {
        const icons = {
            AGENT: {
                NEW: '🟢',
                UPDATED: '🔵',
                REMOVED: '🔴'
            },
            TASK: {
                NEW: '📝',
                UPDATED: '✏️',
                REMOVED: '🗑️'
            },
            MESSAGE: {
                NEW: '📨',
                UPDATED: '📬',
                REMOVED: '📭'
            }
        };

        return icons[type]?.[action] || '•';
    }

    async getSummary() {
        return new Promise((resolve, reject) => {
            const summary = {
                agents: { total: 0, active: 0, inactive: 0 },
                tasks: { total: 0, pending: 0, in_progress: 0, completed: 0, failed: 0 },
                messages: { total: 0, pending: 0, processed: 0 }
            };

            this.db.get(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as inactive
                FROM agents
            `, [], (err, row) => {
                if (!err && row) {
                    summary.agents = row;
                }
            });

            this.db.get(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM tasks
            `, [], (err, row) => {
                if (!err && row) {
                    summary.tasks = row;
                }
            });

            this.db.get(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed
                FROM messages
            `, [], (err, row) => {
                if (!err && row) {
                    summary.messages = row;
                }
                resolve(summary);
            });
        });
    }

    async showSummary() {
        const summary = await this.getSummary();

        console.log('\n📊 SUMMARY');
        console.log('═══════════════════════════════════════════════════');
        console.log(`\nAgents: ${summary.agents.total} total`);
        console.log(`  • Active: ${summary.agents.active}`);
        console.log(`  • Inactive: ${summary.agents.inactive}`);

        console.log(`\nTasks: ${summary.tasks.total} total`);
        console.log(`  • Pending: ${summary.tasks.pending}`);
        console.log(`  • In Progress: ${summary.tasks.in_progress}`);
        console.log(`  • Completed: ${summary.tasks.completed}`);
        console.log(`  • Failed: ${summary.tasks.failed}`);

        console.log(`\nMessages: ${summary.messages.total} total`);
        console.log(`  • Pending: ${summary.messages.pending}`);
        console.log(`  • Processed: ${summary.messages.processed}`);

        console.log(`\nUpdates detected: ${this.updateCount}`);
        console.log('═══════════════════════════════════════════════════\n');
    }

    shutdown() {
        console.log('\n\n🛑 Shutting down live view...');

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        if (this.db) {
            this.showSummary().then(() => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    }
                    console.log('✅ Shutdown complete');
                    process.exit(0);
                });
            });
        } else {
            process.exit(0);
        }
    }
}

// CLI
if (require.main === module) {
    const dbPath = process.argv[2] || './data/coordination.db';

    if (!fs.existsSync(dbPath)) {
        console.error(`❌ Database not found: ${dbPath}`);
        console.log('\n💡 Usage: node live-view.js [path/to/db]');
        console.log('   Default: ./data/coordination.db');
        process.exit(1);
    }

    const viewer = new LiveDatabaseView(dbPath);
    viewer.start().catch(console.error);
}

module.exports = LiveDatabaseView;
