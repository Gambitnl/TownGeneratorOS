# Native VS Code MCP Integration

This guide configures Visual Studio Code 1.99+ to run the local `discord-coordinator` MCP server in agent mode without relying on external bridge extensions. It follows the official Microsoft documentation for [agent mode](https://code.visualstudio.com/updates/v1_99) and [MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

## Prerequisites
- Visual Studio Code 1.99 or later with GitHub Copilot access
- Node.js 18+
- Discord bot token (already stored in `discord/config/.env` as `DISCORD_BOT_TOKEN`)
- Existing `mcp-discord-server/discordmcp` build artifacts (run the commands below if you have not built them recently)

## Step 1 – Enable agent mode in the workspace
The workspace now contains an updated `.vscode/settings.json` with:
```json
{
  "codex.networkAccess": "enabled",
  "chat.agent.enabled": true
}
```
If agent mode was previously disabled globally, reload VS Code after opening the workspace so the setting is applied.

## Step 2 – Install and build the Discord MCP server
From the repository root:
```bash
cd mcp-discord-server/discordmcp
npm install
npm run build
```
This compiles the TypeScript sources into `build/index.js`, which VS Code will launch when the server starts.

## Step 3 – Workspace MCP configuration
A new `.vscode/mcp.json` registers the local Discord MCP server so that VS Code agent mode can launch it automatically:
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
    }
  }
}
```
Key points:
- VS Code maps the existing `DISCORD_BOT_TOKEN` environment variable into the server’s required `DISCORD_TOKEN`.
- The `dev.watch` and `dev.rebuild` entries enable hot rebuilding from the MCP Servers view if you edit TypeScript files.

## Step 4 – Launch and verify in VS Code
1. Open the workspace in VS Code (1.99+).
2. Ensure the Discord bot token is available in your shell (`$Env:DISCORD_BOT_TOKEN` on PowerShell / `export DISCORD_BOT_TOKEN=...` on Bash).
3. Open the Command Palette and run **MCP: Show Installed Servers**. You should see `discord-coordinator` listed.
4. Start agent mode from the Chat view (select *Agent* in the mode picker). VS Code automatically starts the MCP server and prompts you to trust it the first time.
5. Test a tool, for example: “Send an update to #agent-status announcing agent mode is running.” The MCP server should deliver the message through Discord.

## Troubleshooting
- **Server does not start**: confirm `npm run build` completed and that the `build/` folder exists; check the MCP Servers view output for stack traces.
- **Unauthorized Discord requests**: verify the bot token is valid and the bot has required channel permissions (`Send Messages`, `Read Message History`, `Manage Messages`).
- **VS Code does not show agent mode**: make sure `chat.agent.enabled` appears in Settings (`Ctrl+,` ? search for *Agent Mode*) and reload the window.
- **Environment variable not detected**: restart VS Code from a shell where `DISCORD_BOT_TOKEN` is exported, or set the variable in your system environment.

With these changes, the repository is ready to use the native VS Code MCP integration instead of the previous Zai Bridge workflow.
