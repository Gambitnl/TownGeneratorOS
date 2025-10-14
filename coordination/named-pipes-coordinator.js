const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class NamedPipeCoordinator {
    constructor(pipeName = 'agent_coordination', agentId = null) {
        this.pipeName = pipeName;
        this.agentId = agentId || crypto.randomUUID();
        this.pipePath = `\\\\.\\pipe\\${pipeName}`;
        this.server = null;
        this.clients = new Map();
        this.messageHandlers = new Map();
        this.isServer = false;
        this.connection = null;
        this.messageQueue = [];
        this.heartbeatInterval = null;
    }

    async startAsServer() {
        return new Promise((resolve, reject) => {
            this.server = net.createServer((socket) => {
                const clientId = crypto.randomUUID();
                this.clients.set(clientId, socket);
                let buffer = '';

                console.log(`Agent ${clientId} connected to coordination pipe`);

                socket.on('data', (data) => {
                    buffer += data.toString();
                    let boundary = buffer.indexOf('\n');
                    while (boundary !== -1) {
                        const messageString = buffer.substring(0, boundary);
                        buffer = buffer.substring(boundary + 1);
                        if (messageString) {
                            try {
                                const message = JSON.parse(messageString);
                                this.handleMessage(message, clientId);
                            } catch (error) {
                                console.error('Failed to parse message:', error, `Original: "${messageString}"`);
                            }
                        }
                        boundary = buffer.indexOf('\n');
                    }
                });

                socket.on('end', () => {
                    this.clients.delete(clientId);
                    console.log(`Agent ${clientId} disconnected`);
                });

                socket.on('error', (error) => {
                    console.error(`Client ${clientId} error:`, error);
                    this.clients.delete(clientId);
                });
            });

            this.server.listen(this.pipePath, () => {
                this.isServer = true;
                console.log(`Coordination server listening on ${this.pipePath}`);
                this.startHeartbeat();
                resolve();
            });

            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log('Pipe already in use, connecting as client...');
                    this.connectAsClient().then(resolve).catch(reject);
                } else {
                    reject(error);
                }
            });
        });
    }

    async connectAsClient() {
        return new Promise((resolve, reject) => {
            this.connection = net.createConnection(this.pipePath, () => {
                console.log(`Agent ${this.agentId} connected to coordination server`);
                this.sendMessage({
                    type: 'agent_register',
                    agentId: this.agentId,
                    timestamp: new Date().toISOString()
                });
                this.startHeartbeat();
                resolve();
            });

            let buffer = '';
            this.connection.on('data', (data) => {
                buffer += data.toString();
                let boundary = buffer.indexOf('\n');
                while (boundary !== -1) {
                    const messageString = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 1);
                    if (messageString) {
                        try {
                            const message = JSON.parse(messageString);
                            this.handleMessage(message);
                        } catch (error) {
                            console.error('Failed to parse message:', error, `Original: "${messageString}"`);
                        }
                    }
                    boundary = buffer.indexOf('\n');
                }
            });

            this.connection.on('error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.connection.on('end', () => {
                console.log('Disconnected from coordination server');
            });
        });
    }

    sendMessage(message) {
        const messageData = JSON.stringify({
            ...message,
            from: this.agentId,
            timestamp: message.timestamp || new Date().toISOString()
        }) + '\n';

        if (this.isServer) {
            // Broadcast to all clients
            this.clients.forEach((client, clientId) => {
                try {
                    client.write(messageData);
                } catch (error) {
                    console.error(`Failed to send to client ${clientId}:`, error);
                    this.clients.delete(clientId);
                }
            });
        } else if (this.connection) {
            try {
                this.connection.write(messageData);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        } else {
            this.messageQueue.push(messageData);
        }
    }

    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    handleMessage(message, fromClientId = null) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message, fromClientId);
        }

        // Forward message to other clients if we're the server
        if (this.isServer && fromClientId) {
            this.clients.forEach((client, clientId) => {
                if (clientId !== fromClientId) {
                    try {
                        client.write(JSON.stringify(message) + '\n');
                    } catch (error) {
                        console.error(`Failed to forward to client ${clientId}:`, error);
                        this.clients.delete(clientId);
                    }
                }
            });
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendMessage({
                type: 'heartbeat',
                agentId: this.agentId
            });
        }, 5000);
    }

    assignTask(targetAgent, taskType, taskData) {
        this.sendMessage({
            type: 'task_assignment',
            targetAgent,
            taskType,
            taskData,
            taskId: crypto.randomUUID()
        });
    }

    reportTaskComplete(taskId, result) {
        this.sendMessage({
            type: 'task_complete',
            taskId,
            result
        });
    }

    requestCoordination(coordinationType, data) {
        this.sendMessage({
            type: 'coordination_request',
            coordinationType,
            data
        });
    }

    shutdown() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.server) {
            this.server.close();
        }

        if (this.connection) {
            this.connection.end();
        }
    }
}

module.exports = NamedPipeCoordinator;