This project-level Claude Code settings file was added to auto-allow posting to Discord and related tools.

Why this was added
- Avoid interactive permission prompts when Claude Code attempts to post messages to Discord via an MCP tool or run associated bash/curl commands.

What it does
- Adds `WebFetch`, `Bash(curl:*)`, and a sample `Task(discord-post)` rule to `permissions.allow` so these tool uses won't prompt.
- Enables all project MCP servers (`enableAllProjectMcpServers: true`) and explicitly lists `discord` and `github` in `enabledMcpjsonServers`.

Security notes
- This relaxes prompts for the project; do not commit this file if you don't want all collaborators to inherit these permissions.
- If your organization enforces managed policies, they will override these settings.

To revert
- Delete `.claude/settings.json` or remove the entries from `permissions.allow`.
