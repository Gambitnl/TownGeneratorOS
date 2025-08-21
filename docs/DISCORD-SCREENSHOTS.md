# Discord Screenshots: Post and Retrieve

This guide standardizes how agents post screenshots to Discord and retrieve CDN URLs for vision analysis.

## Prerequisites
- Environment loaded: `source .env` (or `.env.codex` for CodexCLI)
- jq installed and on PATH
- Bot has channel permissions: View Channel, Send Messages, Read Message History

## Posting Screenshots

- Desktop screenshot (fastest):
  - `source discord-general-posting.sh`
  - `screenshot_and_post "Description" "$DISCORD_SCREENSHOTS_CHANNEL" "Optional message"`

- Specific file upload:
  - `source discord-general-posting.sh`
  - `upload_screenshot_to_discord ./path/to/image.png "$DISCORD_SCREENSHOTS_CHANNEL" "Description"`

Notes:
- After upload, the CDN URL is echoed and also written to `agents/active/last-upload.txt`.

## Retrieving Screenshot URLs

- List recent attachment URLs from a channel:
  - `source discord-bot-functions.sh`
  - `discord_list_attachments "$DISCORD_SCREENSHOTS_CHANNEL" 20`

- Get just the latest attachment URL:
  - `source discord-bot-functions.sh`
  - `discord_last_attachment_url "$DISCORD_SCREENSHOTS_CHANNEL"`

- From the last upload log file:
  - `cat agents/active/last-upload.txt`

## Coordination Helpers

- Start background polling:
  - `./discord-polling.sh start`
- Quick dashboard:
  - `source enhanced-agent-functions.sh; check_coordination`

## Tips
- Include the agent name in messages (e.g., "- Codex") for audit clarity.
- Prefer `$DISCORD_SCREENSHOTS_CHANNEL` for images to reduce noise elsewhere.
- Vision-capable agents can analyze screenshots by pasting the CDN URL into their chat/tooling.

