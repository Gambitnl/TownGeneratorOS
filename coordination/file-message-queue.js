const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileMessageQueue {
    constructor(baseDir = './coordination/messages') {
        this.baseDir = baseDir;
        this.agentId = null;
        this.watchInterval = null;
        this.messageHandlers = new Map();
        this.lastProcessedTime = Date.now();
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
            await fs.mkdir(path.join(this.baseDir, 'inbox'), { recursive: true });
            await fs.mkdir(path.join(this.baseDir, 'outbox'), { recursive: true });
            await fs.mkdir(path.join(this.baseDir, 'broadcast'), { recursive: true });
            await fs.mkdir(path.join(this.baseDir, 'processed'), { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    setAgentId(agentId) {
        this.agentId = agentId;
    }

    async sendMessage(toAgent, messageType, data, priority = 5) {
        const message = {
            id: crypto.randomUUID(),
            from: this.agentId,
            to: toAgent,
            type: messageType,
            data,
            priority,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const fileName = `${message.timestamp.replace(/[:.]/g, '-')}_${message.id}.json`;
        const targetDir = toAgent === 'all' ? 'broadcast' : 'outbox';
        const filePath = path.join(this.baseDir, targetDir, fileName);

        try {
            await fs.writeFile(filePath, JSON.stringify(message, null, 2));
            return message.id;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async broadcastMessage(messageType, data, priority = 5) {
        return this.sendMessage('all', messageType, data, priority);
    }

    async getInboxMessages() {
        try {
            const inboxDir = path.join(this.baseDir, 'inbox');
            const files = await fs.readdir(inboxDir);
            const messages = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(inboxDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const message = JSON.parse(content);

                        // Only process messages for this agent or broadcast messages
                        if (message.to === this.agentId || message.to === 'all') {
                            messages.push({
                                ...message,
                                filePath
                            });
                        }
                    } catch (error) {
                        console.error(`Error reading message file ${file}:`, error);
                    }
                }
            }

            // Sort by priority (higher first) then by timestamp
            return messages.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
        } catch (error) {
            console.error('Error reading inbox:', error);
            return [];
        }
    }

    async getBroadcastMessages() {
        try {
            const broadcastDir = path.join(this.baseDir, 'broadcast');
            const files = await fs.readdir(broadcastDir);
            const messages = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(broadcastDir, file);
                        const stats = await fs.stat(filePath);

                        // Only process messages newer than last processed time
                        if (stats.mtime.getTime() > this.lastProcessedTime) {
                            const content = await fs.readFile(filePath, 'utf8');
                            const message = JSON.parse(content);

                            // Don't process our own broadcast messages
                            if (message.from !== this.agentId) {
                                messages.push({
                                    ...message,
                                    filePath
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error reading broadcast file ${file}:`, error);
                    }
                }
            }

            return messages.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
        } catch (error) {
            console.error('Error reading broadcast messages:', error);
            return [];
        }
    }

    async processMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            try {
                await handler(message);
                await this.markMessageProcessed(message);
            } catch (error) {
                console.error(`Error processing message ${message.id}:`, error);
            }
        }
    }

    async markMessageProcessed(message) {
        try {
            if (message.filePath) {
                const fileName = path.basename(message.filePath);
                const processedPath = path.join(this.baseDir, 'processed', fileName);

                // Move file to processed directory
                await fs.rename(message.filePath, processedPath);
            }
        } catch (error) {
            console.error('Error marking message as processed:', error);
        }
    }

    onMessage(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    async startWatching(intervalMs = 1000) {
        this.stopWatching();

        this.watchInterval = setInterval(async () => {
            try {
                // Process inbox messages
                const inboxMessages = await this.getInboxMessages();
                for (const message of inboxMessages) {
                    await this.processMessage(message);
                }

                // Process broadcast messages
                const broadcastMessages = await this.getBroadcastMessages();
                for (const message of broadcastMessages) {
                    await this.processMessage(message);
                }

                this.lastProcessedTime = Date.now();
            } catch (error) {
                console.error('Error during message watching:', error);
            }
        }, intervalMs);
    }

    stopWatching() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
    }

    async distributeOutboxMessages() {
        try {
            const outboxDir = path.join(this.baseDir, 'outbox');
            const files = await fs.readdir(outboxDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(outboxDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const message = JSON.parse(content);

                        // Move to target agent's inbox
                        const targetInboxDir = path.join(this.baseDir, 'inbox');
                        const targetPath = path.join(targetInboxDir, file);

                        await fs.rename(filePath, targetPath);
                    } catch (error) {
                        console.error(`Error distributing message ${file}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error distributing outbox messages:', error);
        }
    }

    async getMessageHistory(limit = 100) {
        try {
            const processedDir = path.join(this.baseDir, 'processed');
            const files = await fs.readdir(processedDir);
            const messages = [];

            for (const file of files.slice(-limit)) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(processedDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const message = JSON.parse(content);
                        messages.push(message);
                    } catch (error) {
                        console.error(`Error reading processed message ${file}:`, error);
                    }
                }
            }

            return messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error reading message history:', error);
            return [];
        }
    }

    async cleanup(olderThanHours = 24) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        const directories = ['processed', 'inbox', 'outbox', 'broadcast'];

        for (const dir of directories) {
            try {
                const dirPath = path.join(this.baseDir, dir);
                const files = await fs.readdir(dirPath);

                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(dirPath, file);
                        const stats = await fs.stat(filePath);

                        if (stats.mtime.getTime() < cutoffTime) {
                            await fs.unlink(filePath);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error cleaning up directory ${dir}:`, error);
            }
        }
    }

    async getQueueStats() {
        const stats = {
            inbox: 0,
            outbox: 0,
            broadcast: 0,
            processed: 0
        };

        for (const [key, dir] of Object.entries(stats)) {
            try {
                const dirPath = path.join(this.baseDir, key);
                const files = await fs.readdir(dirPath);
                stats[key] = files.filter(f => f.endsWith('.json')).length;
            } catch (error) {
                console.error(`Error getting stats for ${key}:`, error);
            }
        }

        return stats;
    }
}

module.exports = FileMessageQueue;