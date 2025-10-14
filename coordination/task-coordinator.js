const crypto = require('crypto');

class TaskCoordinator {
    constructor(agentRegistry) {
        this.agentRegistry = agentRegistry;
        this.activeTasks = new Map();
        this.completedTasks = new Map();
        this.taskQueue = [];
        this.coordinationStrategies = new Map();
        this.dependencies = new Map();

        this.setupDefaultStrategies();
        this.setupTaskHandlers();
    }

    setupDefaultStrategies() {
        // Round-robin assignment
        this.coordinationStrategies.set('round_robin', {
            assign: (task, availableAgents) => {
                if (availableAgents.length === 0) return null;
                const index = this.activeTasks.size % availableAgents.length;
                return availableAgents[index];
            }
        });

        // Capability-based assignment
        this.coordinationStrategies.set('capability_based', {
            assign: (task, availableAgents) => {
                if (!task.requiredCapability) return availableAgents[0];

                const capableAgents = availableAgents.filter(agent =>
                    agent.capabilities &&
                    (agent.capabilities[task.requiredCapability] ||
                     Object.keys(agent.capabilities).includes(task.requiredCapability))
                );

                return capableAgents.length > 0 ? capableAgents[0] : null;
            }
        });

        // Load-balanced assignment
        this.coordinationStrategies.set('load_balanced', {
            assign: (task, availableAgents) => {
                // Find agent with least active tasks
                let bestAgent = null;
                let minTasks = Infinity;

                for (const agent of availableAgents) {
                    const agentTasks = Array.from(this.activeTasks.values())
                        .filter(t => t.assignedTo === agent.id).length;

                    if (agentTasks < minTasks) {
                        minTasks = agentTasks;
                        bestAgent = agent;
                    }
                }

                return bestAgent;
            }
        });

        // Priority-based assignment
        this.coordinationStrategies.set('priority_based', {
            assign: (task, availableAgents) => {
                // Assign high-priority tasks to most capable agents
                if (task.priority >= 8) {
                    return availableAgents.sort((a, b) =>
                        Object.keys(b.capabilities || {}).length -
                        Object.keys(a.capabilities || {}).length
                    )[0];
                }
                return availableAgents[0];
            }
        });
    }

    setupTaskHandlers() {
        // Handle task assignments from other agents
        this.agentRegistry.fileMessageQueue.onMessage('task_assignment', async (message) => {
            await this.handleIncomingTask(message.data);
        });

        // Handle task completion notifications
        this.agentRegistry.fileMessageQueue.onMessage('task_complete', async (message) => {
            await this.handleTaskCompletion(message.data);
        });

        // Handle coordination requests
        this.agentRegistry.fileMessageQueue.onMessage('coordination_request', async (message) => {
            await this.handleCoordinationRequest(message.data);
        });

        // Handle task status updates
        this.agentRegistry.fileMessageQueue.onMessage('task_status', async (message) => {
            await this.handleTaskStatusUpdate(message.data);
        });
    }

    async createTask(taskType, description, data = {}, options = {}) {
        const task = {
            id: crypto.randomUUID(),
            type: taskType,
            description,
            data,
            priority: options.priority || 5,
            requiredCapability: options.requiredCapability,
            strategy: options.strategy || 'capability_based',
            dependencies: options.dependencies || [],
            timeout: options.timeout || 300000, // 5 minutes default
            retries: options.retries || 0,
            maxRetries: options.maxRetries || 2,
            createdBy: this.agentRegistry.agentId,
            createdAt: new Date().toISOString(),
            status: 'pending',
            assignedTo: null,
            startedAt: null,
            completedAt: null,
            result: null,
            error: null
        };

        // Store in database
        await this.agentRegistry.database.createTask(
            task.id,
            task.createdBy,
            task.type,
            task.description,
            task.data,
            null,
            task.priority
        );

        // Add to queue
        this.taskQueue.push(task);
        console.log(`Created task: ${task.type} (${task.id})`);

        // Try to assign immediately
        await this.processTaskQueue();

        return task.id;
    }

    async assignTask(taskId, agentId) {
        const task = this.activeTasks.get(taskId) || this.taskQueue.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Check if agent exists and is available
        const agent = this.agentRegistry.knownAgents.get(agentId);
        if (!agent || agent.status !== 'active') {
            throw new Error(`Agent ${agentId} not available`);
        }

        // Update task
        task.assignedTo = agentId;
        task.status = 'assigned';

        // Move from queue to active tasks
        if (this.taskQueue.includes(task)) {
            this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
        }
        this.activeTasks.set(taskId, task);

        // Update database
        await this.agentRegistry.database.updateTaskStatus(taskId, 'assigned');

        // Send assignment to agent
        await this.sendTaskAssignment(task, agent);

        console.log(`Assigned task ${task.type} to agent ${agent.name}`);
        return true;
    }

    async processTaskQueue() {
        if (this.taskQueue.length === 0) return;

        const availableAgents = Array.from(this.agentRegistry.knownAgents.values())
            .filter(agent => agent.status === 'active');

        if (availableAgents.length === 0) {
            console.log('No available agents for task assignment');
            return;
        }

        // Sort tasks by priority
        this.taskQueue.sort((a, b) => b.priority - a.priority);

        for (const task of [...this.taskQueue]) {
            // Check dependencies
            if (!await this.checkTaskDependencies(task)) {
                continue;
            }

            // Get assignment strategy
            const strategy = this.coordinationStrategies.get(task.strategy);
            if (!strategy) {
                console.error(`Unknown strategy: ${task.strategy}`);
                continue;
            }

            // Find suitable agent
            const assignedAgent = strategy.assign(task, availableAgents);
            if (assignedAgent) {
                await this.assignTask(task.id, assignedAgent.id);
            }
        }
    }

    async checkTaskDependencies(task) {
        if (!task.dependencies || task.dependencies.length === 0) {
            return true;
        }

        for (const depId of task.dependencies) {
            const depTask = this.completedTasks.get(depId) || this.activeTasks.get(depId);
            if (!depTask || depTask.status !== 'completed') {
                return false;
            }
        }

        return true;
    }

    async sendTaskAssignment(task, agent) {
        const assignment = {
            taskId: task.id,
            taskType: task.type,
            description: task.description,
            data: task.data,
            priority: task.priority,
            timeout: task.timeout,
            assignedBy: this.agentRegistry.agentId
        };

        // Send via named pipes for real-time delivery
        this.agentRegistry.namedPipeCoordinator.assignTask(
            agent.id,
            task.type,
            assignment
        );

        // Also send via file system for reliability
        await this.agentRegistry.fileMessageQueue.sendMessage(
            agent.id,
            'task_assignment',
            assignment,
            task.priority
        );
    }

    async handleIncomingTask(taskData) {
        console.log(`Received task assignment: ${taskData.taskType}`);

        // Check if we can handle this task
        const hasCapability = !taskData.requiredCapability ||
            this.agentRegistry.capabilities.has(taskData.requiredCapability);

        if (!hasCapability) {
            await this.rejectTask(taskData.taskId, 'Missing required capability');
            return;
        }

        // Accept and start task
        await this.acceptTask(taskData);
    }

    async acceptTask(taskData) {
        const task = {
            ...taskData,
            status: 'in_progress',
            startedAt: new Date().toISOString()
        };

        this.activeTasks.set(task.taskId, task);

        // Update database
        await this.agentRegistry.database.updateTaskStatus(task.taskId, 'in_progress');

        // Send acceptance notification
        await this.agentRegistry.fileMessageQueue.sendMessage(
            task.assignedBy,
            'task_status',
            {
                taskId: task.taskId,
                status: 'accepted',
                agentId: this.agentRegistry.agentId,
                timestamp: new Date().toISOString()
            },
            7
        );

        console.log(`Accepted task: ${task.taskType} (${task.taskId})`);

        // Execute the task
        await this.executeTask(task);
    }

    async rejectTask(taskId, reason) {
        // Send rejection notification
        await this.agentRegistry.fileMessageQueue.sendMessage(
            null, // Will be handled by task creator
            'task_status',
            {
                taskId,
                status: 'rejected',
                reason,
                agentId: this.agentRegistry.agentId,
                timestamp: new Date().toISOString()
            },
            8
        );

        console.log(`Rejected task ${taskId}: ${reason}`);
    }

    async executeTask(task) {
        try {
            console.log(`Executing task: ${task.taskType}`);

            // Task execution logic would go here
            // For now, simulate work with a timeout
            const result = await this.simulateTaskExecution(task);

            await this.completeTask(task.taskId, result);
        } catch (error) {
            await this.failTask(task.taskId, error.message);
        }
    }

    async simulateTaskExecution(task) {
        // Simulate different types of tasks
        const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    message: `Task ${task.taskType} completed successfully`,
                    data: task.data,
                    executionTime,
                    timestamp: new Date().toISOString()
                });
            }, executionTime);
        });
    }

    async completeTask(taskId, result) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;

        // Move to completed tasks
        this.activeTasks.delete(taskId);
        this.completedTasks.set(taskId, task);

        // Update database
        await this.agentRegistry.database.updateTaskStatus(taskId, 'completed', result);

        // Notify task creator
        await this.agentRegistry.fileMessageQueue.sendMessage(
            task.assignedBy || task.createdBy,
            'task_complete',
            {
                taskId,
                result,
                completedBy: this.agentRegistry.agentId,
                completedAt: task.completedAt
            },
            8
        );

        console.log(`Completed task: ${task.taskType} (${taskId})`);

        // Process any dependent tasks
        await this.processTaskQueue();
    }

    async failTask(taskId, error) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        task.error = error;
        task.retries++;

        // Retry if possible
        if (task.retries <= task.maxRetries) {
            console.log(`Retrying task ${taskId} (attempt ${task.retries})`);
            task.status = 'pending';
            task.assignedTo = null;

            // Move back to queue
            this.activeTasks.delete(taskId);
            this.taskQueue.push(task);

            await this.processTaskQueue();
        } else {
            // Mark as failed
            task.status = 'failed';
            task.completedAt = new Date().toISOString();

            this.activeTasks.delete(taskId);

            // Update database
            await this.agentRegistry.database.updateTaskStatus(taskId, 'failed', { error });

            // Notify task creator
            await this.agentRegistry.fileMessageQueue.sendMessage(
                task.assignedBy || task.createdBy,
                'task_failed',
                {
                    taskId,
                    error,
                    failedBy: this.agentRegistry.agentId,
                    failedAt: task.completedAt
                },
                9
            );

            console.log(`Failed task: ${task.taskType} (${taskId}) - ${error}`);
        }
    }

    async handleTaskCompletion(data) {
        console.log(`Task completed by ${data.completedBy}: ${data.taskId}`);

        // Remove from our active tasks if we assigned it
        if (this.activeTasks.has(data.taskId)) {
            const task = this.activeTasks.get(data.taskId);
            task.status = 'completed';
            task.result = data.result;
            task.completedAt = data.completedAt;

            this.activeTasks.delete(data.taskId);
            this.completedTasks.set(data.taskId, task);
        }
    }

    async handleCoordinationRequest(data) {
        const { type, parameters } = data;

        switch (type) {
            case 'load_balance':
                await this.redistributeTasks();
                break;
            case 'priority_boost':
                await this.boostTaskPriority(parameters.taskId, parameters.newPriority);
                break;
            case 'agent_failover':
                await this.handleAgentFailover(parameters.failedAgentId);
                break;
            default:
                console.log(`Unknown coordination request: ${type}`);
        }
    }

    async redistributeTasks() {
        console.log('Redistributing tasks for load balancing');
        await this.processTaskQueue();
    }

    async boostTaskPriority(taskId, newPriority) {
        const task = this.taskQueue.find(t => t.id === taskId) || this.activeTasks.get(taskId);
        if (task) {
            task.priority = newPriority;
            console.log(`Boosted priority for task ${taskId} to ${newPriority}`);
            await this.processTaskQueue();
        }
    }

    async handleAgentFailover(failedAgentId) {
        console.log(`Handling failover for agent: ${failedAgentId}`);

        // Reassign tasks from failed agent
        for (const [taskId, task] of this.activeTasks.entries()) {
            if (task.assignedTo === failedAgentId) {
                task.assignedTo = null;
                task.status = 'pending';
                task.retries++;

                this.activeTasks.delete(taskId);
                this.taskQueue.push(task);
            }
        }

        await this.processTaskQueue();
    }

    async getCoordinationStats() {
        return {
            queuedTasks: this.taskQueue.length,
            activeTasks: this.activeTasks.size,
            completedTasks: this.completedTasks.size,
            availableAgents: Array.from(this.agentRegistry.knownAgents.values())
                .filter(agent => agent.status === 'active').length,
            strategies: Array.from(this.coordinationStrategies.keys())
        };
    }
}

module.exports = TaskCoordinator;