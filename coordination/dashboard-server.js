#!/usr/bin/env node

/**
 * Web Dashboard Server
 * Real-time coordination system dashboard with WebSocket updates
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { WebSocketServer } = require('ws');

class DashboardServer {
    constructor(port = 3000, dbPath = './data/coordination.db') {
        this.port = port;
        this.dbPath = dbPath;
        this.db = null;
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        this.pollInterval = null;
        this.lastState = {
            agents: new Map(),
            tasks: new Map(),
            messages: new Map()
        };
    }

    async start() {
        console.log('🌐 Starting Dashboard Server...');

        // Open database
        this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('❌ Failed to open database:', err.message);
                process.exit(1);
            }
        });

        // Create HTTP server
        this.server = http.createServer((req, res) => this.handleRequest(req, res));

        // Create WebSocket server
        this.wss = new WebSocketServer({ server: this.server });
        this.wss.on('connection', (ws) => this.handleWebSocketConnection(ws));

        // Start server
        this.server.listen(this.port, () => {
            console.log(`✅ Dashboard running at http://localhost:${this.port}`);
            console.log(`📊 WebSocket server active for real-time updates`);
        });

        // Start polling for changes
        this.startPolling();

        // Handle shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    handleRequest(req, res) {
        if (req.url === '/' || req.url === '/index.html') {
            const html = this.getDashboardHTML();
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } else if (req.url === '/api/summary') {
            this.getSummary().then(summary => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(summary));
            });
        } else if (req.url === '/api/agents') {
            this.getAgents().then(agents => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(agents));
            });
        } else if (req.url === '/api/tasks') {
            this.getTasks().then(tasks => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(tasks));
            });
        } else if (req.url === '/api/messages') {
            this.getMessages().then(messages => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(messages));
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    }

    handleWebSocketConnection(ws) {
        console.log('🔌 Client connected');
        this.clients.add(ws);

        // Send initial state
        this.getSummary().then(summary => {
            ws.send(JSON.stringify({ type: 'summary', data: summary }));
        });

        this.getAgents().then(agents => {
            ws.send(JSON.stringify({ type: 'agents', data: agents }));
        });

        this.getTasks().then(tasks => {
            ws.send(JSON.stringify({ type: 'tasks', data: tasks }));
        });

        ws.on('close', () => {
            console.log('🔌 Client disconnected');
            this.clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.clients.delete(ws);
        });
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(data);
            }
        });
    }

    startPolling() {
        // Poll every 1 second for changes
        this.pollInterval = setInterval(() => this.checkForChanges(), 1000);
    }

    async checkForChanges() {
        const newState = {
            agents: new Map(),
            tasks: new Map(),
            messages: new Map()
        };

        await Promise.all([
            this.queryAgents(newState),
            this.queryTasks(newState),
            this.queryMessages(newState)
        ]);

        // Detect and broadcast changes
        this.detectChanges(newState);

        this.lastState = newState;
    }

    queryAgents(state) {
        return new Promise((resolve) => {
            // Only show agents active in the last 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            this.db.all(
                'SELECT * FROM agents WHERE last_heartbeat > ? ORDER BY registered_at DESC',
                [fiveMinutesAgo],
                (err, rows) => {
                    if (!err) {
                        rows.forEach(row => state.agents.set(row.id, row));
                    }
                    resolve();
                }
            );
        });
    }

    queryTasks(state) {
        return new Promise((resolve) => {
            // Show active tasks or recently completed (last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            this.db.all(
                `SELECT * FROM tasks
                 WHERE status != 'completed' OR updated_at > ?
                 ORDER BY created_at DESC LIMIT 100`,
                [oneHourAgo],
                (err, rows) => {
                    if (!err) {
                        rows.forEach(row => state.tasks.set(row.id, row));
                    }
                    resolve();
                }
            );
        });
    }

    queryMessages(state) {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
                if (!err) {
                    rows.forEach(row => state.messages.set(row.id, row));
                }
                resolve();
            });
        });
    }

    detectChanges(newState) {
        const changes = [];

        // Check agents
        for (const [id, agent] of newState.agents) {
            const old = this.lastState.agents.get(id);
            if (!old) {
                changes.push({ type: 'agent', action: 'new', data: agent });
            } else if (JSON.stringify(old) !== JSON.stringify(agent)) {
                changes.push({ type: 'agent', action: 'updated', data: agent, old });
            }
        }

        // Check tasks
        for (const [id, task] of newState.tasks) {
            const old = this.lastState.tasks.get(id);
            if (!old) {
                changes.push({ type: 'task', action: 'new', data: task });
            } else if (JSON.stringify(old) !== JSON.stringify(task)) {
                changes.push({ type: 'task', action: 'updated', data: task, old });
            }
        }

        // Check messages
        for (const [id, message] of newState.messages) {
            if (!this.lastState.messages.has(id)) {
                changes.push({ type: 'message', action: 'new', data: message });
            }
        }

        if (changes.length > 0) {
            this.broadcast({ type: 'changes', data: changes });
        }
    }

    getSummary() {
        return new Promise((resolve) => {
            const summary = {};

            this.db.get(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
                FROM agents
            `, [], (err, row) => {
                summary.agents = row || { total: 0, active: 0 };

                this.db.get(`
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                    FROM tasks
                `, [], (err, row) => {
                    summary.tasks = row || { total: 0, pending: 0, in_progress: 0, completed: 0 };

                    this.db.get(`
                        SELECT COUNT(*) as total FROM messages
                    `, [], (err, row) => {
                        summary.messages = row || { total: 0 };
                        resolve(summary);
                    });
                });
            });
        });
    }

    getAgents() {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM agents ORDER BY registered_at DESC', [], (err, rows) => {
                resolve(rows || []);
            });
        });
    }

    getTasks() {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100', [], (err, rows) => {
                resolve(rows || []);
            });
        });
    }

    getMessages() {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
                resolve(rows || []);
            });
        });
    }

    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coordination Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }

        .status {
            display: inline-block;
            padding: 4px 12px;
            background: #10b981;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #334155;
        }

        .stat-card h3 {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .stat-value {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .stat-details {
            color: #64748b;
            font-size: 14px;
        }

        .section {
            background: #1e293b;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #334155;
        }

        .section h2 {
            margin-bottom: 20px;
            font-size: 20px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th {
            text-align: left;
            padding: 12px;
            background: #334155;
            font-weight: 600;
            font-size: 14px;
            color: #cbd5e1;
        }

        .table td {
            padding: 12px;
            border-bottom: 1px solid #334155;
            font-size: 14px;
        }

        .table tr:last-child td {
            border-bottom: none;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge.pending { background: #fbbf24; color: #78350f; }
        .badge.in_progress { background: #3b82f6; color: #eff6ff; }
        .badge.completed { background: #10b981; color: #064e3b; }
        .badge.failed { background: #ef4444; color: #fef2f2; }
        .badge.active { background: #10b981; color: #064e3b; }
        .badge.inactive { background: #6b7280; color: #f9fafb; }

        .update-log {
            max-height: 300px;
            overflow-y: auto;
            background: #0f172a;
            border-radius: 8px;
            padding: 16px;
        }

        .update-item {
            padding: 8px 12px;
            margin-bottom: 8px;
            background: #1e293b;
            border-left: 3px solid #667eea;
            border-radius: 4px;
            font-size: 13px;
        }

        .update-item .time {
            color: #64748b;
            font-size: 11px;
        }

        .truncate {
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Coordination Dashboard</h1>
        <span class="status" id="connection-status">● CONNECTING</span>
    </div>

    <div class="stats">
        <div class="stat-card">
            <h3>Agents</h3>
            <div class="stat-value" id="agents-total">0</div>
            <div class="stat-details">
                <span id="agents-active">0</span> active
            </div>
        </div>

        <div class="stat-card">
            <h3>Tasks</h3>
            <div class="stat-value" id="tasks-total">0</div>
            <div class="stat-details">
                <span id="tasks-pending">0</span> pending ·
                <span id="tasks-in-progress">0</span> in progress ·
                <span id="tasks-completed">0</span> completed
            </div>
        </div>

        <div class="stat-card">
            <h3>Messages</h3>
            <div class="stat-value" id="messages-total">0</div>
            <div class="stat-details">Total messages exchanged</div>
        </div>
    </div>

    <div class="section">
        <h2>📋 Recent Tasks</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody id="tasks-table"></tbody>
        </table>
    </div>

    <div class="section">
        <h2>👥 Active Agents</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Capabilities</th>
                    <th>Last Heartbeat</th>
                </tr>
            </thead>
            <tbody id="agents-table"></tbody>
        </table>
    </div>

    <div class="section">
        <h2>🔔 Live Updates</h2>
        <div class="update-log" id="updates"></div>
    </div>

    <script>
        const ws = new WebSocket('ws://' + window.location.host);
        const updates = [];

        ws.onopen = () => {
            document.getElementById('connection-status').textContent = '● CONNECTED';
            document.getElementById('connection-status').style.background = '#10b981';
        };

        ws.onclose = () => {
            document.getElementById('connection-status').textContent = '● DISCONNECTED';
            document.getElementById('connection-status').style.background = '#ef4444';
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'summary') {
                updateSummary(message.data);
            } else if (message.type === 'agents') {
                updateAgentsTable(message.data);
            } else if (message.type === 'tasks') {
                updateTasksTable(message.data);
            } else if (message.type === 'changes') {
                handleChanges(message.data);
            }
        };

        function updateSummary(data) {
            document.getElementById('agents-total').textContent = data.agents.total;
            document.getElementById('agents-active').textContent = data.agents.active;
            document.getElementById('tasks-total').textContent = data.tasks.total;
            document.getElementById('tasks-pending').textContent = data.tasks.pending;
            document.getElementById('tasks-in-progress').textContent = data.tasks.in_progress;
            document.getElementById('tasks-completed').textContent = data.tasks.completed;
            document.getElementById('messages-total').textContent = data.messages.total;
        }

        function updateTasksTable(tasks) {
            const tbody = document.getElementById('tasks-table');
            tbody.innerHTML = tasks.slice(0, 10).map(task => \`
                <tr>
                    <td class="truncate" title="\${task.description}">\${task.description}</td>
                    <td>\${task.task_type}</td>
                    <td><span class="badge \${task.status}">\${task.status}</span></td>
                    <td>\${task.priority}</td>
                    <td>\${new Date(task.created_at).toLocaleString()}</td>
                </tr>
            \`).join('');
        }

        function updateAgentsTable(agents) {
            const tbody = document.getElementById('agents-table');
            tbody.innerHTML = agents.map(agent => {
                const caps = JSON.parse(agent.capabilities || '{}');
                const capNames = Object.keys(caps).join(', ') || 'none';

                // Calculate real status based on heartbeat (within last 10 seconds = active)
                let realStatus = 'inactive';
                if (agent.last_heartbeat) {
                    const heartbeatAge = Date.now() - new Date(agent.last_heartbeat).getTime();
                    if (heartbeatAge < 10000) {
                        realStatus = 'active';
                    }
                }

                return \`
                    <tr>
                        <td>\${agent.name}</td>
                        <td>\${agent.type}</td>
                        <td><span class="badge \${realStatus}">\${realStatus}</span></td>
                        <td class="truncate" title="\${capNames}">\${capNames}</td>
                        <td>\${agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'Never'}</td>
                    </tr>
                \`;
            }).join('');
        }

        function handleChanges(changes) {
            changes.forEach(change => {
                const time = new Date().toLocaleTimeString();
                let message = '';

                if (change.type === 'task') {
                    if (change.action === 'new') {
                        message = \`📝 New task: \${change.data.description}\`;
                    } else if (change.action === 'updated') {
                        message = \`✏️ Task updated: \${change.data.description} → \${change.data.status}\`;
                    }
                } else if (change.type === 'agent') {
                    if (change.action === 'new') {
                        message = \`🟢 New agent: \${change.data.name}\`;
                    } else if (change.action === 'updated') {
                        message = \`🔵 Agent updated: \${change.data.name}\`;
                    }
                } else if (change.type === 'message') {
                    message = \`📨 New message: \${change.data.message_type}\`;
                }

                if (message) {
                    addUpdate(time, message);
                    // Refresh data
                    ws.send(JSON.stringify({ action: 'refresh' }));
                }
            });
        }

        function addUpdate(time, message) {
            const updatesDiv = document.getElementById('updates');
            const item = document.createElement('div');
            item.className = 'update-item';
            item.innerHTML = \`<div class="time">\${time}</div><div>\${message}</div>\`;
            updatesDiv.insertBefore(item, updatesDiv.firstChild);

            // Keep only last 50 updates
            while (updatesDiv.children.length > 50) {
                updatesDiv.removeChild(updatesDiv.lastChild);
            }
        }

        // Fetch data every 2 seconds as fallback
        setInterval(() => {
            fetch('/api/summary').then(r => r.json()).then(updateSummary);
            fetch('/api/tasks').then(r => r.json()).then(updateTasksTable);
            fetch('/api/agents').then(r => r.json()).then(updateAgentsTable);
        }, 2000);
    </script>
</body>
</html>`;
    }

    shutdown() {
        console.log('\n🛑 Shutting down dashboard server...');

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        if (this.wss) {
            this.wss.close();
        }

        if (this.server) {
            this.server.close();
        }

        if (this.db) {
            this.db.close();
        }

        console.log('✅ Shutdown complete');
        process.exit(0);
    }
}

// CLI
if (require.main === module) {
    const port = parseInt(process.argv[2]) || 3000;
    const server = new DashboardServer(port);
    server.start().catch(console.error);
}

module.exports = DashboardServer;
