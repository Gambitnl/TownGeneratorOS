const CoordinationDatabase = require('./coordination-db');
const NamedPipeCoordinator = require('./named-pipes-coordinator');
const FileMessageQueue = require('./file-message-queue');
const crypto = require('crypto');

class AgentRegistry {
    constructor(agentId = null, agentName = 'Agent', agentType = 'general') {
        this.agentId = agentId || crypto.randomUUID();
        this.agentName = agentName;
        this.agentType = agentType;
        this.capabilities = new Map();
        this.status = 'initializing';

        // Coordination systems
        this.database = new CoordinationDatabase();
        this.namedPipeCoordinator = new NamedPipeCoordinator('agent_coordination', this.agentId);
        this.fileMessageQueue = new FileMessageQueue();

        // Health monitoring
        this.lastHeartbeat = Date.now();
        this.heartbeatInterval = null;
        this.healthCheckInterval = null;

        // Peer agents
        this.knownAgents = new Map();

        this.setupMessageHandlers();
    }

    async initialize() {
        try {
            console.log(`Initializing agent ${this.agentName} (${this.agentId})`);

            // Wait for database to be ready
            await this.database.ready;

            // Set up file message queue
            this.fileMessageQueue.setAgentId(this.agentId);

            // Register in database
            await this.database.registerAgent(
                this.agentId,
                this.agentName,
                this.agentType,
                Object.fromEntries(this.capabilities)
            );

            // Start named pipe coordination
            await this.namedPipeCoordinator.startAsServer();

            // Start file-based messaging
            await this.fileMessageQueue.startWatching();

            // Start health monitoring
            this.startHeartbeat();
            this.startHealthCheck();

            // Announce presence to other agents
            await this.announcePresence();

            this.status = 'active';
            console.log(`Agent ${this.agentName} initialized successfully`);

            return true;
        } catch (error) {
            console.error('Error initializing agent:', error);
            this.status = 'error';
            throw error;
        }
    }

    setupMessageHandlers() {
        // Named pipe message handlers
        this.namedPipeCoordinator.onMessage('agent_register', (message) => {
            this.handleAgentRegistration(message);
        });

        this.namedPipeCoordinator.onMessage('agent_announce', (message) => {
            this.handleAgentAnnouncement(message);
        });

        this.namedPipeCoordinator.onMessage('heartbeat', (message) => {
            this.handleHeartbeat(message);
        });

        this.namedPipeCoordinator.onMessage('capability_request', (message) => {
            this.handleCapabilityRequest(message);
        });

        this.namedPipeCoordinator.onMessage('discovery_request', (message) => {
            this.handleDiscoveryRequest(message);
        });

        // File message queue handlers
        this.fileMessageQueue.onMessage('agent_register', (message) => {
            this.handleAgentRegistration(message);
        });

        this.fileMessageQueue.onMessage('task_assignment', (message) => {
            this.handleTaskAssignment(message);
        });

        this.fileMessageQueue.onMessage('coordination_request', (message) => {
            this.handleCoordinationRequest(message);
        });
    }

    async addCapability(name, description, metadata = {}) {
        this.capabilities.set(name, {
            description,
            metadata,
            available: true,
            lastUsed: null
        });

        // Update database
        this.database.registerAgent(
            this.agentId,
            this.agentName,
            this.agentType,
            Object.fromEntries(this.capabilities)
        );
    }

    removeCapability(name) {
        this.capabilities.delete(name);

        // Update database
        this.database.registerAgent(
            this.agentId,
            this.agentName,
            this.agentType,
            Object.fromEntries(this.capabilities)
        );
    }

    async announcePresence() {
        const announcement = {
            agentId: this.agentId,
            name: this.agentName,
            type: this.agentType,
            capabilities: Array.from(this.capabilities.keys()),
            status: this.status,
            timestamp: new Date().toISOString()
        };

        // Announce via named pipes
        this.namedPipeCoordinator.sendMessage({
            type: 'agent_announce',
            ...announcement
        });

        // Announce via file system
        await this.fileMessageQueue.broadcastMessage('agent_announce', announcement, 8);
    }

    async discoverAgents() {
        console.log('Discovering available agents...');

        // Get from database
        const dbAgents = await this.database.getActiveAgents();
        for (const agent of dbAgents) {
            if (agent.id !== this.agentId) {
                this.knownAgents.set(agent.id, {
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    capabilities: agent.capabilities,
                    status: agent.status,
                    lastSeen: agent.last_heartbeat,
                    source: 'database'
                });
            }
        }

        // Request discovery via named pipes
        this.namedPipeCoordinator.sendMessage({
            type: 'discovery_request',
            requesterId: this.agentId
        });

        // Request discovery via file system
        await this.fileMessageQueue.broadcastMessage('discovery_request', {
            requesterId: this.agentId
        }, 7);

        return Array.from(this.knownAgents.values());
    }

    async findAgentByCapability(capability) {
        const agents = await this.discoverAgents();
        return agents.filter(agent =>
            agent.capabilities &&
            (agent.capabilities[capability] ||
             Object.keys(agent.capabilities).includes(capability))
        );
    }

    async findAgentByType(type) {
        const agents = await this.discoverAgents();
        return agents.filter(agent => agent.type === type);
    }

    handleAgentRegistration(message) {
        if (message.agentId && message.agentId !== this.agentId) {
            this.knownAgents.set(message.agentId, {
                id: message.agentId,
                name: message.name || 'Unknown',
                type: message.type || 'unknown',
                capabilities: message.capabilities || {},
                status: 'active',
                lastSeen: new Date().toISOString(),
                source: 'registration'
            });

            console.log(`Registered agent: ${message.name || message.agentId}`);
        }
    }

    handleAgentAnnouncement(message) {
        if (message.agentId && message.agentId !== this.agentId) {
            this.knownAgents.set(message.agentId, {
                id: message.agentId,
                name: message.name,
                type: message.type,
                capabilities: message.capabilities,
                status: message.status,
                lastSeen: message.timestamp,
                source: 'announcement'
            });

            console.log(`Agent announced: ${message.name} (${message.type})`);
        }
    }

    handleHeartbeat(message) {
        if (message.agentId && message.agentId !== this.agentId) {
            const agent = this.knownAgents.get(message.agentId);
            if (agent) {
                agent.lastSeen = new Date().toISOString();
                agent.status = 'active';
            }
        }
    }

    handleCapabilityRequest(message) {
        if (message.capability) {
            const hasCapability = this.capabilities.has(message.capability);

            // Respond with capability info
            this.namedPipeCoordinator.sendMessage({
                type: 'capability_response',
                requesterId: message.requesterId,
                capability: message.capability,
                available: hasCapability,
                agentId: this.agentId,
                agentName: this.agentName
            });
        }
    }

    handleDiscoveryRequest(message) {
        if (message.requesterId !== this.agentId) {
            // Respond with our info
            this.namedPipeCoordinator.sendMessage({
                type: 'discovery_response',
                requesterId: message.requesterId,
                agentId: this.agentId,
                name: this.agentName,
                type: this.agentType,
                capabilities: Object.fromEntries(this.capabilities),
                status: this.status
            });
        }
    }

    handleTaskAssignment(message) {
        console.log(`Task assigned: ${message.taskType} (${message.taskId})`);
        // Task handling will be implemented in coordination logic
    }

    handleCoordinationRequest(message) {
        console.log(`Coordination request: ${message.coordinationType}`);
        // Coordination handling will be implemented in coordination logic
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.database.updateHeartbeat(this.agentId);
                this.lastHeartbeat = Date.now();

                // Send heartbeat via named pipes
                this.namedPipeCoordinator.sendMessage({
                    type: 'heartbeat',
                    agentId: this.agentId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        }, 5000);
    }

    startHealthCheck() {
        this.healthCheckInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 30000; // 30 seconds

            // Check known agents
            for (const [agentId, agent] of this.knownAgents.entries()) {
                const lastSeenTime = new Date(agent.lastSeen).getTime();
                if (now - lastSeenTime > timeout) {
                    agent.status = 'inactive';
                    console.log(`Agent ${agent.name} appears to be inactive`);
                }
            }

            // Clean up very old agents
            for (const [agentId, agent] of this.knownAgents.entries()) {
                const lastSeenTime = new Date(agent.lastSeen).getTime();
                if (now - lastSeenTime > 300000) { // 5 minutes
                    this.knownAgents.delete(agentId);
                    console.log(`Removed inactive agent: ${agent.name}`);
                }
            }
        }, 10000);
    }

    async getAgentStats() {
        return {
            id: this.agentId,
            name: this.agentName,
            type: this.agentType,
            status: this.status,
            capabilities: Array.from(this.capabilities.keys()),
            knownAgents: this.knownAgents.size,
            lastHeartbeat: new Date(this.lastHeartbeat).toISOString(),
            uptime: Date.now() - this.lastHeartbeat
        };
    }

    async shutdown() {
        console.log(`Shutting down agent ${this.agentName}`);

        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Stop coordination systems
        this.namedPipeCoordinator.shutdown();
        this.fileMessageQueue.stopWatching();

        // Update status in database
        try {
            await this.database.registerAgent(
                this.agentId,
                this.agentName,
                this.agentType,
                Object.fromEntries(this.capabilities)
            );
        } catch (error) {
            console.error('Error updating shutdown status:', error);
        }

        // Close database
        await this.database.close();

        this.status = 'shutdown';
        console.log(`Agent ${this.agentName} shut down successfully`);
    }
}

module.exports = AgentRegistry;