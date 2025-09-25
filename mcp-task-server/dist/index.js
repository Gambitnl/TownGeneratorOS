#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
class TodoMCPServer {
    constructor() {
        this.baseUrl = 'https://discord.com/api/v9';
        this.server = new Server({
            name: 'agent-todos',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.discordToken = process.env.DISCORD_TOKEN || '';
        this.todoChannelId = process.env.TODO_CHANNEL_ID || '';
        if (!this.discordToken || !this.todoChannelId) {
            throw new Error('DISCORD_TOKEN and TODO_CHANNEL_ID environment variables are required');
        }
        this.setupToolHandlers();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'list_todos',
                        description: 'List all todos from Discord channel',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'add_todo',
                        description: 'Add a new todo to Discord channel',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                content: { type: 'string', description: 'Todo content' },
                                activeForm: { type: 'string', description: 'Active form of the todo' },
                            },
                            required: ['content', 'activeForm'],
                        },
                    },
                    {
                        name: 'update_todo_status',
                        description: 'Update todo status in Discord channel',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                todoId: { type: 'string', description: 'Todo ID or message ID' },
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'in_progress', 'completed'],
                                    description: 'New status',
                                },
                            },
                            required: ['todoId', 'status'],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'list_todos':
                    return await this.listTodos();
                case 'add_todo':
                    return await this.addTodo(args?.content, args?.activeForm);
                case 'update_todo_status':
                    return await this.updateTodoStatus(args?.todoId, args?.status);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async discordRequest(method, endpoint, data) {
        const response = await axios({
            method,
            url: `${this.baseUrl}${endpoint}`,
            headers: {
                'Authorization': `Bot ${this.discordToken}`,
                'Content-Type': 'application/json',
            },
            data,
        });
        return response.data;
    }
    async listTodos() {
        try {
            const messages = await this.discordRequest('GET', `/channels/${this.todoChannelId}/messages?limit=50`);
            const todos = [];
            for (const message of messages) {
                const content = message.content;
                // Parse todo format: #ID [Date Time] [Category] Task: Description
                const todoMatch = content.match(/^#([A-Z0-9]+)\s+\[.*?\]\s+\[.*?\]\s+(.*?):/);
                if (todoMatch) {
                    const [, id, description] = todoMatch;
                    todos.push({
                        id: message.id,
                        content: description.trim(),
                        status: 'pending', // Default status, could be parsed from message
                        activeForm: description.trim(),
                        timestamp: message.timestamp,
                    });
                }
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(todos, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error listing todos: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async addTodo(content, activeForm) {
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            // Generate unique ID
            const id = Math.random().toString(36).substring(2, 8).toUpperCase();
            const messageContent = `#${id} [${dateStr}] [AGENT] ${content}`;
            const result = await this.discordRequest('POST', `/channels/${this.todoChannelId}/messages`, {
                content: messageContent,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Todo added successfully: ${messageContent}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error adding todo: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async updateTodoStatus(todoId, status) {
        try {
            // For now, we'll add a status update message rather than editing the original
            // In a full implementation, we'd track todo state more sophisticatedly
            const statusMessage = `Todo ${todoId} status updated to: ${status}`;
            const result = await this.discordRequest('POST', `/channels/${this.todoChannelId}/messages`, {
                content: statusMessage,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status updated: ${statusMessage}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error updating todo status: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Todo MCP server running on stdio');
    }
}
const server = new TodoMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map