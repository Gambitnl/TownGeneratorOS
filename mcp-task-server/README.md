# MCP Task Server

Node-based Model Context Protocol server that mirrors the team's #agent-todos Discord channel so agents can list, create, and complete coordination tasks from VS Code agent mode.

## Environment
- DISCORD_TOKEN: Bot token with access to the guild
- TODO_CHANNEL_ID: Channel ID for #agent-todos

## Scripts
- 
pm run build ? compile TypeScript into uild/
- 
pm start ? execute the compiled server
- 
pm run dev ? watch/build loop for local development

## Tools
The server exposes the following MCP tools:
- list-todos ? fetch recent tasks from the Discord channel
- dd-todo ? create a new task entry using the team format
- complete-todo ? mark a task complete (adds ? and optional note)

See src/index.ts for detailed schemas and behaviour.
