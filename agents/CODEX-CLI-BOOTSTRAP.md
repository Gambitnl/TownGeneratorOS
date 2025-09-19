# Codex CLI — Discord Coordination Bootstrap

This file orients Codex CLI to the repo’s Discord integration, guardrails, and current coordination status. Read this first, then follow the commands below.

## Paths & Tools
- Scripts: `discord/scripts/`
  - `universal-agent-bootstrap.sh`: loads env, guards identity, exposes protected helpers
  - `discord-bot-functions.sh`: core bot API helpers
  - `discord-post.ps1`: Windows/PowerShell helper for whoami/read/post
- Config (secrets; git‑ignored): `discord/config/`
  - `.env.codex` (Codex bot), `.env.gemini`, `.env.claude`
  - Template: `discord/config/.env.discord.template`

## One‑Time Bootstrap (bash/Git Bash)
```bash
source discord/scripts/universal-agent-bootstrap.sh
show_identity_status    # whoami + channel IDs
```

## Quick Verification (PowerShell alternative)
```powershell
discord\scripts\discord-post.ps1 -EnvFile 'discord\config\.env.codex' -WhoAmI
discord\scripts\discord-post.ps1 -EnvFile 'discord\config\.env.codex' -Read -Limit 5
```

## Guardrails (Consensus‑First)
- No repo changes until agreement in Discord; use “LGTM / NIT / BLOCKER” reactions + short comments for blockers.
- Always post start/end of sessions; reserve files before edits.
- Keep secrets in `discord/config/*.env` only; never commit them.
- Identity check must match `EXPECTED_BOT_USERNAME=CodexCLI`.

## Protected Helpers (after bootstrap)
```bash
start_agent_session_protected "OpenAI Codex" "<task>"
reserve_file_protected "CodexCLI" "path/to/file"
progress_update_protected "CodexCLI" "50%" "what you’re doing"
release_file_protected "CodexCLI" "path/to/file"
end_agent_session_protected "CodexCLI"
```

## Current Status (Context)
- Discord integration segregated under `discord/`; docs/scripts updated; `.gitignore` hardened.
- Verified working bots: GeminiCLI and CodexCLI (whoami/read/post OK).
- Posted consensus‑first research plan for adopting MCP Discord servers.
- Awaiting ACKs and questions from agents; Remy asked about task lists, ownership, and event‑driven monitoring.

## Near‑Term Research Topic: MCP Discord Servers
Evaluate replacing custom scripts with an MCP server. Sources:
- Anthropic docs (MCP): https://docs.anthropic.com/en/docs/claude-code/mcp
- Repos: `github.com/v-3/discordmcp`, `github.com/SaseQ/discord-mcp`, `github.com/modelcontextprotocol/servers`

Method (no code changes yet):
1) Define success criteria: features, setup effort (Win/bash), security/permissions, persistence.
2) Read docs + repos; capture setup steps + minimal health checks (whoami/read/post).
3) Compare vs current `discord/scripts/*`; outline migration steps + risks.
4) Share a short matrix + recommendation in Discord; proceed only after consensus.

## Questions For Remy (to confirm)
1) Preferred task structure: threads per initiative vs dedicated “tasks” channel? OK to pilot emoji‑ownership and assignee mentions?
2) Accept consensus rule of “Claude + 1 ACK or 24h silence” before execution?
3) Any domain/method allowlist limits we must observe for MCP pilots?

— End of file —

