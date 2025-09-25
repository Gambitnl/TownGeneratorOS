# Native VS Code MCP Integration

This guide configures Visual Studio Code 1.99+ to run the local MCP servers needed for TownGeneratorOS agent mode without relying on external bridge extensions. It follows the official Microsoft documentation for [agent mode](https://code.visualstudio.com/updates/v1_99) and [MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

## Prerequisites
- Visual Studio Code 1.99 or later with GitHub Copilot access
- Node.js 18+
- Discord bot token (already stored in `discord/config/.env` as `DISCORD_BOT_TOKEN`)
- Existing build artifacts for the local MCP servers (run the commands below if you have not built them recently)

## Step 1 - Enable agent mode in the workspace
The workspace contains an updated `.vscode/settings.json` with:
```json
{
  "codex.networkAccess": "enabled",
  "chat.agent.enabled": true
}
```
If agent mode was previously disabled globally, reload VS Code after opening the workspace so the setting is applied.

## Step 2 - Build local MCP servers
From the repository root:
```bash
# Discord coordination server
cd mcp-discord-server/discordmcp
npm install
npm run build

# Task/todo coordination server
cd ../..
cd mcp-task-server
npm install
npm run build
```
The build step compiles each server's TypeScript sources into `build/index.js`, which VS Code launches when the server starts.

## Step 3 - Workspace MCP configuration
The workspace `.vscode/mcp.json` registers all required MCP servers so VS Code agent mode can launch them automatically:
```json
{
  "servers": {
    "discord-coordinator": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "mcp-discord-server/discordmcp",
      "env": {
        "DISCORD_TOKEN": "${env:DISCORD_BOT_TOKEN}"
      },
      "dev": {
        "watch": "src/**/*.ts",
        "rebuild": "npm run build",
        "debug": { "type": "node" }
      }
    },
    "workspace-fs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"],
      "env": {
        "FILESYSTEM_SERVER_LABEL": "TownGeneratorOS"
      }
    },
    "agent-todos": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "mcp-task-server",
      "env": {
        "DISCORD_TOKEN": "${env:DISCORD_BOT_TOKEN}",
        "TODO_CHANNEL_ID": "1417561285133996086"
      }
    }
  }
}
```
Key points:
- `discord-coordinator` exposes Discord messaging tools for #agent-status and other coordination channels.
- `workspace-fs` provides read/write/edit access to the repository through the published filesystem MCP server (installed on demand via `npx`).
- `agent-todos` mirrors the `#agent-todos` Discord channel so agents can list, add, and complete tasks without leaving VS Code.

## Step 4 - Launch and verify in VS Code
1. Open the workspace in VS Code (1.99+).
2. Ensure the Discord bot token is available in your shell (`$Env:DISCORD_BOT_TOKEN` on PowerShell / `export DISCORD_BOT_TOKEN=...` on Bash).
3. Open the Command Palette and run **MCP: Show Installed Servers**. You should see `discord-coordinator`, `workspace-fs`, and `agent-todos` listed.
4. Start agent mode from the Chat view (select *Agent* in the mode picker). VS Code automatically starts the MCP servers and prompts you to trust them the first time.
5. Test a tool, for example: send a status post via `discord-coordinator`, list todos via `agent-todos`, or read a file via `workspace-fs`.

## Troubleshooting
- **Server does not start**: confirm `npm run build` completed and that the `build/` folder exists for the Node-based servers; check the MCP Servers view output for stack traces.
- **Unauthorized Discord requests**: verify the bot token is valid and the bot has required channel permissions (`Send Messages`, `Read Message History`, `Manage Messages`).
- **VS Code does not show agent mode**: make sure `chat.agent.enabled` appears in Settings (`Ctrl+,` > search for *Agent Mode*) and reload the window.
- **Environment variable not detected**: restart VS Code from a shell where `DISCORD_BOT_TOKEN` is exported, or set the variable in your system environment.

With these changes, the repository is ready to use the native VS Code MCP integration and support continuous multi-agent coordination directly inside VS Code.
