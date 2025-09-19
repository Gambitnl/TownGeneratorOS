# Codex Agent Guide (IDE + CLI)

Purpose: Document how I (Codex) get time, read/post to Discord, and operate with permissions and guardrails. Applies to both Codex in VS Code sidebar (IDE) and Codex CLI in terminal. I will prefix messages with [IDE] or [CLI] when helpful.

## Identity & Config
- Primary env file: `discord/config/.env.codex` (git-ignored)
- Expected username: `CodexCLI` (set `EXPECTED_BOT_USERNAME=CodexCLI` if needed)
- Channels: values come from the env file (status/active/reservations/conflicts/completed)

## Time Requirement (always include date/time)
- Windows PowerShell (ISO 8601 with offset):
  ```powershell
  $now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
  ```
- Bash/Git Bash:
  ```bash
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ") # UTC
  # or local with offset if GNU date supports it: date +"%Y-%m-%dT%H:%M:%S%z"
  ```
- Optional network source (confirm allowed):
  ```powershell
  # WorldTimeAPI (example for IP-based region)
  (Invoke-WebRequest -UseBasicParsing https://worldtimeapi.org/api/ip).Content | ConvertFrom-Json | Select -Expand datetime
  ```

I will include ISO timestamps (UTC or with offset) in every Discord post.

## Read/Write Discord
- PowerShell (recommended on Windows):
  ```powershell
  # WhoAmI
  discord\scripts\discord-post.ps1 -EnvFile 'discord\config\.env.codex' -WhoAmI

  # Read last 10
  discord\scripts\discord-post.ps1 -EnvFile 'discord\config\.env.codex' -Read -Limit 10

  # Post message
  $now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
  discord\scripts\discord-post.ps1 -EnvFile 'discord\config\.env.codex' -Message "[$now] [IDE] example message"
  ```
- Bash alternatives:
  ```bash
  # Standalone reader (requires DISCORD_BOT_TOKEN and channel id in env)
  DISCORD_BOT_TOKEN=... discord/scripts/discord-read-standalone.sh "$DISCORD_ACTIVE_WORK_CHANNEL" 10

  # Sender (reads env from discord/config/.env)
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CLI] example" | discord/scripts/discord-send.sh "$DISCORD_AGENT_STATUS_CHANNEL"
  ```

## Permissions (minimum for current tooling)
- View Channels
- Read Message History
- Send Messages
- (Optional) Add Reactions (used for LGTM/NIT/BLOCKER)

## Guardrails & Process
- Consensus-first: No repo changes until team agreement in Discord (LGTM/NIT/BLOCKER + brief blocker comment). Default rule: proceed after Claude + one additional ACK or 24h with no blockers.
- File coordination: reserve before editing; release when done. Use protected helpers where possible.
- Identity: Always verify with WhoAmI; if username != `CodexCLI`, stop and report.
- Distinguishing surfaces: I will tag messages as `[IDE]` (VS Code) or `[CLI]` (Codex CLI) when ambiguity matters.

## Self-assigned Near-Term Tasks
1) Adopt time-in-message habit and confirm timezone with @Remy.
2) Participate in MCP Discord server research under the agreed framework (no code changes until consensus).
3) Help define lightweight tasks workflow (threads or dedicated channel) and document operating guidelines.

— End —

