import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { Client, GatewayIntentBits, Message, TextChannel } from "discord.js";
import { z } from "zod";

dotenv.config();

const discordToken = process.env.DISCORD_TOKEN ?? process.env.DISCORD_BOT_TOKEN;
const todoChannelId = process.env.TODO_CHANNEL_ID;

if (!discordToken) {
  throw new Error("DISCORD_TOKEN (or DISCORD_BOT_TOKEN) environment variable is required");
}

if (!todoChannelId) {
  throw new Error("TODO_CHANNEL_ID environment variable is required");
}

const TODO_CHANNEL_ID = todoChannelId as string;
const CHECK_MARK = "\u2705";
const checkPattern = /^\u2705\s*/u;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let cachedChannel: TextChannel | null = null;

const amsterdamFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Amsterdam",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface ParsedTask {
  messageId: string;
  taskId?: string;
  title: string;
  category?: string;
  rawTimestamp?: string;
  completed: boolean;
  body?: string;
  createdAt: string;
  author: string;
  url: string;
}

function formatAmsterdamTime(date: Date): string {
  return amsterdamFormatter.format(date).replace(/,/g, "");
}

async function resolveChannel(): Promise<TextChannel> {
  if (cachedChannel) {
    return cachedChannel;
  }

  const channel = await client.channels.fetch(TODO_CHANNEL_ID);
  if (!channel) {
    throw new Error(`Channel ${TODO_CHANNEL_ID} could not be fetched`);
  }

  if (!(channel instanceof TextChannel)) {
    throw new Error(`Channel ${TODO_CHANNEL_ID} is not a text channel`);
  }

  cachedChannel = channel;
  return channel;
}

function extractTaskId(content: string): string | undefined {
  const withoutCheck = content.trim().replace(checkPattern, "");
  const match = withoutCheck.match(/^#([0-9A-Z]+)/i);
  return match ? `#${match[1].toUpperCase()}` : undefined;
}

function parseTask(message: Message): ParsedTask {
  const rawContent = message.content ?? "";
  const lines = rawContent.split(/\r?\n/);
  const firstLine = (lines[0] ?? "").trim();
  const cleanedHeader = firstLine.replace(checkPattern, "");
  const headerMatch = cleanedHeader.match(/^#([0-9A-Z]+)\s+\[([^\]]+)\]\s+(?:\[([^\]]+)\]\s+)?(.+)$/i);

  const taskId = headerMatch ? `#${headerMatch[1].toUpperCase()}` : extractTaskId(firstLine);
  const timestampLabel = headerMatch?.[2];
  const category = headerMatch?.[3];
  const title = headerMatch?.[4]?.trim() ?? cleanedHeader;
  const body = lines.slice(1).join("\n").trim();

  return {
    messageId: message.id,
    taskId,
    title,
    category: category?.trim(),
    rawTimestamp: timestampLabel?.trim(),
    completed: firstLine.startsWith(CHECK_MARK),
    body: body.length > 0 ? body : undefined,
    createdAt: message.createdAt.toISOString(),
    author: `${message.author.username}#${message.author.discriminator}`,
    url: message.url,
  };
}

function normaliseTaskId(input?: string): string | undefined {
  if (!input) {
    return undefined;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  const normalised = trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
  if (!/^#[0-9A-Z]+$/.test(normalised)) {
    throw new Error(`Invalid task id format: ${input}`);
  }
  return normalised;
}

async function generateNextTaskId(channel: TextChannel, requested?: string): Promise<string> {
  const override = normaliseTaskId(requested);
  if (override) {
    return override;
  }

  let highest = 0;
  let cursor: string | undefined;

  for (let i = 0; i < 3; i += 1) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: cursor,
    });

    if (batch.size === 0) {
      break;
    }

    for (const msg of batch.values()) {
      const code = extractTaskId(msg.content ?? "");
      if (code) {
        const parsed = parseInt(code.replace(/^#/, ""), 36);
        if (!Number.isNaN(parsed) && parsed > highest) {
          highest = parsed;
        }
      }
    }

    if (batch.size < 100) {
      break;
    }
    cursor = batch.last()?.id;
    if (!cursor) {
      break;
    }
  }

  const nextValue = highest + 1;
  return `#${nextValue.toString(36).toUpperCase()}`;
}

async function findMessageByTaskId(channel: TextChannel, taskId: string): Promise<Message | undefined> {
  const normalised = normaliseTaskId(taskId);
  if (!normalised) {
    return undefined;
  }

  let cursor: string | undefined;
  for (let i = 0; i < 4; i += 1) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: cursor,
    });

    if (batch.size === 0) {
      break;
    }

    const found = batch.find((msg) => extractTaskId(msg.content ?? "") === normalised);
    if (found) {
      return found;
    }

    if (batch.size < 100) {
      break;
    }
    cursor = batch.last()?.id;
    if (!cursor) {
      break;
    }
  }
  return undefined;
}

const ListTodosArgsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  includeCompleted: z.boolean().default(true),
});

const AddTodoArgsSchema = z.object({
  title: z.string().min(1, "title is required"),
  body: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  timestamp: z.string().optional(),
});

const CompleteTodoArgsSchema = z
  .object({
    taskId: z.string().optional(),
    messageId: z.string().optional(),
    note: z.string().optional(),
    markOnly: z.boolean().default(true),
  })
  .refine((value) => Boolean(value.taskId || value.messageId), {
    message: "Provide either taskId or messageId",
  });

const server = new Server(
  {
    name: "agent-todos",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list-todos",
      description: "List recent tasks from the #agent-todos Discord channel",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of tasks to fetch (max 100)",
            default: 20,
          },
          includeCompleted: {
            type: "boolean",
            description: "Include completed tasks in the response",
            default: true,
          },
        },
      },
    },
    {
      name: "add-todo",
      description: "Publish a new task to the #agent-todos channel",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Task title (appears on the first line)",
          },
          body: {
            type: "string",
            description: "Optional additional context appended to the message",
          },
          category: {
            type: "string",
            description: "Optional bracketed label, e.g. IDE or OPS",
          },
          tag: {
            type: "string",
            description: "Override the auto-generated task id (e.g. #1N)",
          },
          timestamp: {
            type: "string",
            description: "Optional timestamp label to embed instead of the current Amsterdam time",
          },
        },
        required: ["title"],
      },
    },
    {
      name: "complete-todo",
      description: "Mark a task complete by prepending a check mark and optionally append a note",
      inputSchema: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "Task identifier such as #1M",
          },
          messageId: {
            type: "string",
            description: "Discord message id if known",
          },
          note: {
            type: "string",
            description: "Optional completion note appended to the message",
          },
          markOnly: {
            type: "boolean",
            description: "If false the message will be deleted instead of edited",
            default: true,
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  switch (name) {
    case "list-todos": {
      const args = ListTodosArgsSchema.parse(rawArgs ?? {});
      const channel = await resolveChannel();
      const messages = await channel.messages.fetch({ limit: args.limit });
      const sorted = Array.from(messages.values()).sort((a, b) => b.createdTimestamp - a.createdTimestamp);
      const tasks = sorted
        .map(parseTask)
        .filter((task) => args.includeCompleted || !task.completed);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    }

    case "add-todo": {
      const args = AddTodoArgsSchema.parse(rawArgs ?? {});
      const channel = await resolveChannel();
      const taskId = await generateNextTaskId(channel, args.tag);
      const timestampLabel = args.timestamp ?? formatAmsterdamTime(new Date());
      const parts = [taskId, `[${timestampLabel}]`];
      if (args.category) {
        parts.push(`[${args.category}]`);
      }
      parts.push(args.title.trim());
      const header = parts.join(" ");
      const body = args.body?.trim();
      const message = body && body.length > 0 ? `${header}\n\n${body}` : header;
      const sent = await channel.send(message);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                messageId: sent.id,
                taskId,
                url: sent.url,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "complete-todo": {
      const args = CompleteTodoArgsSchema.parse(rawArgs ?? {});
      const channel = await resolveChannel();

      let targetMessage: Message | undefined;
      if (args.messageId) {
        targetMessage = await channel.messages.fetch(args.messageId).catch(() => undefined);
      }
      if (!targetMessage && args.taskId) {
        targetMessage = await findMessageByTaskId(channel, args.taskId);
      }

      if (!targetMessage) {
        throw new Error("Task message could not be located");
      }

      if (args.markOnly) {
        const lines = targetMessage.content.split(/\r?\n/);
        if (lines.length === 0) {
          throw new Error("Task message is empty and cannot be marked complete");
        }
        const header = lines[0];
        if (!header.trim().startsWith(CHECK_MARK)) {
          lines[0] = `${CHECK_MARK} ${header.trim()}`;
        }
        if (args.note) {
          const trimmedNote = args.note.trim();
          if (trimmedNote.length > 0 && !lines.some((line) => line.startsWith("Completion note:"))) {
            lines.push("", `Completion note: ${trimmedNote}`);
          }
        }
        await targetMessage.edit(lines.join("\n"));
      } else {
        await targetMessage.delete();
        if (args.note) {
          await channel.send(`${CHECK_MARK} ${args.taskId ?? targetMessage.id} completed: ${args.note}`);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                messageId: targetMessage.id,
                taskId: extractTaskId(targetMessage.content),
                action: args.markOnly ? "marked_complete" : "deleted",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

client.once("ready", () => {
  console.error("Discord client ready for mcp-task-server");
});

async function main() {
  try {
    await client.login(discordToken);
    await resolveChannel();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("mcp-task-server running on stdio");
  } catch (error) {
    console.error("Fatal error in mcp-task-server", error);
    process.exit(1);
  }
}

void main();


