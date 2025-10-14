const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class CoordinationDatabase {
    constructor(dbPath = './data/coordination.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.ready = this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to coordination database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const tables = [
                `CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    capabilities TEXT,
                    last_heartbeat DATETIME,
                    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )`,

                `CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_agent TEXT NOT NULL,
                    to_agent TEXT,
                    message_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    priority INTEGER DEFAULT 5,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    processed_at DATETIME,
                    FOREIGN KEY (from_agent) REFERENCES agents (id)
                )`,

                `CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    assigned_to TEXT,
                    created_by TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    description TEXT,
                    data TEXT,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 5,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    started_at DATETIME,
                    completed_at DATETIME,
                    result TEXT,
                    FOREIGN KEY (assigned_to) REFERENCES agents (id),
                    FOREIGN KEY (created_by) REFERENCES agents (id)
                )`,

                `CREATE TABLE IF NOT EXISTS coordination_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_by TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (updated_by) REFERENCES agents (id)
                )`,

                `CREATE TABLE IF NOT EXISTS agent_locks (
                    resource_id TEXT PRIMARY KEY,
                    locked_by TEXT NOT NULL,
                    lock_type TEXT DEFAULT 'exclusive',
                    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME,
                    FOREIGN KEY (locked_by) REFERENCES agents (id)
                )`
            ];

            let completed = 0;
            tables.forEach((sql, index) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error(`Error creating table ${index}:`, err);
                        reject(err);
                    } else {
                        completed++;
                        if (completed === tables.length) {
                            console.log('All coordination tables created successfully');
                            resolve();
                        }
                    }
                });
            });
        });
    }

    registerAgent(agentId, name, type, capabilities = {}) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO agents
                        (id, name, type, capabilities, last_heartbeat)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;

            this.db.run(sql, [agentId, name, type, JSON.stringify(capabilities)], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    updateHeartbeat(agentId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE agents SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?`;

            this.db.run(sql, [agentId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getActiveAgents() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM agents
                        WHERE status = 'active'
                        AND last_heartbeat > datetime('now', '-30 seconds')`;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => ({
                        ...row,
                        capabilities: JSON.parse(row.capabilities || '{}')
                    })));
                }
            });
        });
    }

    sendMessage(fromAgent, toAgent, messageType, content, priority = 5) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO messages
                        (from_agent, to_agent, message_type, content, priority)
                        VALUES (?, ?, ?, ?, ?)`;

            this.db.run(sql, [fromAgent, toAgent, messageType, JSON.stringify(content), priority], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getMessagesForAgent(agentId, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM messages
                        WHERE (to_agent = ? OR to_agent IS NULL)
                        AND status = 'pending'
                        ORDER BY priority DESC, created_at ASC
                        LIMIT ?`;

            this.db.all(sql, [agentId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => ({
                        ...row,
                        content: JSON.parse(row.content)
                    })));
                }
            });
        });
    }

    markMessageProcessed(messageId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE messages
                        SET status = 'processed', processed_at = CURRENT_TIMESTAMP
                        WHERE id = ?`;

            this.db.run(sql, [messageId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    createTask(taskId, createdBy, taskType, description, data, assignedTo = null, priority = 5) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO tasks
                        (id, created_by, assigned_to, task_type, description, data, priority)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

            this.db.run(sql, [taskId, createdBy, assignedTo, taskType, description, JSON.stringify(data), priority], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(taskId);
                }
            });
        });
    }

    updateTaskStatus(taskId, status, result = null) {
        return new Promise((resolve, reject) => {
            const updates = ['status = ?'];
            const params = [status];

            if (status === 'in_progress') {
                updates.push('started_at = CURRENT_TIMESTAMP');
            } else if (status === 'completed') {
                updates.push('completed_at = CURRENT_TIMESTAMP');
                if (result) {
                    updates.push('result = ?');
                    params.push(JSON.stringify(result));
                }
            }

            params.push(taskId);

            const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getTasksForAgent(agentId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tasks
                        WHERE assigned_to = ? AND status IN ('pending', 'in_progress')
                        ORDER BY priority DESC, created_at ASC`;

            this.db.all(sql, [agentId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => ({
                        ...row,
                        data: JSON.parse(row.data || '{}'),
                        result: row.result ? JSON.parse(row.result) : null
                    })));
                }
            });
        });
    }

    acquireLock(resourceId, agentId, lockType = 'exclusive', expiresInMs = 30000) {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

            // First, clean up expired locks
            this.db.run(`DELETE FROM agent_locks WHERE expires_at < CURRENT_TIMESTAMP`, [], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Try to acquire lock
                const sql = `INSERT INTO agent_locks
                            (resource_id, locked_by, lock_type, expires_at)
                            VALUES (?, ?, ?, ?)`;

                this.db.run(sql, [resourceId, agentId, lockType, expiresAt], function(err) {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            resolve(false); // Lock already exists
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(true); // Lock acquired
                    }
                });
            });
        });
    }

    releaseLock(resourceId, agentId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM agent_locks WHERE resource_id = ? AND locked_by = ?`;

            this.db.run(sql, [resourceId, agentId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    setState(key, value, agentId) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO coordination_state
                        (key, value, updated_by, updated_at)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;

            this.db.run(sql, [key, JSON.stringify(value), agentId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getState(key) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT value FROM coordination_state WHERE key = ?`;

            this.db.get(sql, [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? JSON.parse(row.value) : null);
                }
            });
        });
    }

    close() {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
                resolve();
            });
        });
    }
}

module.exports = CoordinationDatabase;
