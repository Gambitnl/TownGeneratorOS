# CodexCLI Discord Integration Guide

This document explains how the CodexCLI bot (the dedicated Discord bot used by this agent) is configured, how to post/read reliably, and how to troubleshoot issues. It is tailored to the Windows + Git Bash setup running in this repo.

## Overview
- Bot identity: `CodexCLI` (separate from `ClaudeCLI`)
- Primary transport: Discord Bot API v10
- Shell: Git Bash (not PowerShell) for reliable quoting/JSON
- JSON builder: `jq` for robust content encoding

## Permissions Required (Server/Channel)
- View Channel
- Send Messages
- Read Message History
- Attach Files
- Embed Links
- Optional: Manage Channels (only if you want the bot to create channels)

Grant these to the `CodexCLI` bot (or its role) on all relevant channels. If you see `50001 Missing Access` or `40333 internal network error`, revisit these permissions.

## Environment Files
Use a dedicated env for Codex CLI:

1) Confirm `.env.codex` exists with variables like:
```
DISCORD_BOT_TOKEN="<codex-bot-token>"
DISCORD_GUILD_ID=<guild-id>
DISCORD_AGENT_STATUS_CHANNEL=<channel-id>
DISCORD_FILE_RESERVATIONS_CHANNEL=<channel-id>
DISCORD_ACTIVE_WORK_CHANNEL=<channel-id>
DISCORD_CONFLICTS_CHANNEL=<channel-id>
DISCORD_COMPLETED_WORK_CHANNEL=<channel-id>
# Optional, recommended:
DISCORD_SCREENSHOTS_CHANNEL=<channel-id>
```

2) Activate Codex env (Windows):
- Copy Codex env over the default: `Copy-Item -Force .env.codex .env` (PowerShell) or `cp -f .env.codex .env` (Git Bash)

## Quick Validation
Run in Git Bash from repo root:

```
source discord-bot-functions.sh
test_bot_connection     # Expect: Bot connected successfully as: CodexCLI
```

Read recent messages (jq required):
```
discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 10
```

## Posting Messages (Reliable Methods)

Short single-line (ASCII):
```
source discord-general-posting.sh
post_to_discord "Codex: ready to sync" "$DISCORD_AGENT_STATUS_CHANNEL"
```

Robust multi-line or special characters (file-based):
```
source discord-general-posting.sh
echo "Multi-line\ncontent from Codex" > agents/active/msg.txt
sayf_discord "$DISCORD_AGENT_STATUS_CHANNEL" agents/active/msg.txt
```

Pipe-and-post (multi-line safe) using stdin:
```
source discord-general-posting.sh
printf "Hello from Codex via stdin" | say_discord "$DISCORD_AGENT_STATUS_CHANNEL"
```

Why file/pipe methods? They build JSON via `jq -Rs` and pipe to `curl --data-binary`, which avoids cross-shell quoting issues that can cause blank or truncated messages.

Identity guard: All posting helpers refuse to send unless `/users/@me` matches `EXPECTED_BOT_USERNAME` (defaults to `CodexCLI`). To override, set `EXPECTED_BOT_USERNAME` in your env.

## Screenshots (Posting and Retrieval)
See `docs/DISCORD-SCREENSHOTS.md` for detailed commands. Highlights:
- Post desktop screenshot: `screenshot_and_post "Desc" "$DISCORD_SCREENSHOTS_CHANNEL" "Optional message"`
- Upload existing file: `upload_screenshot_to_discord ./path.png "$DISCORD_SCREENSHOTS_CHANNEL" "Desc"`
- List attachment URLs: `discord_list_attachments "$DISCORD_SCREENSHOTS_CHANNEL" 20`
- Last uploaded URL also saved to: `agents/active/last-upload.txt`

Playwright (page-only screenshots):
- Install in `web`: `npm i -D @playwright/test && npx playwright install chromium`
- Dev: `cd web && npm run dev` (default http://localhost:5173)
- Built: `cd web && npm run build && npx http-server dist -p 8000`
- Then: `browser_screenshot_and_post <url> "Desc" "$DISCORD_SCREENSHOTS_CHANNEL" 2 "Optional note"`

## Live Coordination
- Start polling (background monitor): `./discord-polling.sh start`
- Status/alerts: `./discord-polling.sh status` / `./discord-polling.sh alerts`
- Dashboard view: `source enhanced-agent-functions.sh; check_coordination`

## Troubleshooting
- Blank or truncated Codex messages in channel:
  - Use `sayf_discord` (file-based) or `say_discord` (stdin) to post.
  - Ensure `.env` points to Codex token (`.env.codex` → `.env`).
  - Prefer ASCII for quick chat; attach files for long content.
- `40333 internal network error` on REST:
  - Often permissions or transient transport. Verify bot is added to server, has per-channel permissions, and retry via Git Bash.
- `50001 Missing Access`:
  - Bot lacks channel access. Re-check View/Send/Read History/Attach/Embed.
- Reader shows errors or blanks:
  - Confirm `jq --version` works. Re-run `discord_read_messages`.
  - Consider printing raw JSON for a message to inspect `.content`.

## Suggested Channel Layout
- `#agent-status` (lifecycle)
- `#active-work` (progress)
- `#file-reservations` (locks)
- `#conflicts` (issues)
- `#completed-work` (summaries)
- `#agent-screenshots` (images for vision agents)

## Minimal “It Works” Flow (Git Bash)
```
cp -f .env.codex .env
source discord-bot-functions.sh
test_bot_connection

source discord-general-posting.sh
echo "Codex hello world" > agents/active/msg.txt
sayf_discord "$DISCORD_AGENT_STATUS_CHANNEL" agents/active/msg.txt

discord_read_messages "$DISCORD_AGENT_STATUS_CHANNEL" 5
```
