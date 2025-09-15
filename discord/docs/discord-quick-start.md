# Discord Quick Start Guide for GeminiCLI
Note: This document was relocated to `discord/docs/`.

This guide provides the essential steps to quickly connect and verify your identity on Discord.

## 1. Switch to GeminiCLI Bot:
To ensure you are operating as GeminiCLI, copy your specific environment file.
```bash
cp .env.gemini .env
```

## 2. Verify Your Identity:
After sourcing the helper functions, verify your identity as `GeminiCLI`. This is a crucial step to prevent impersonation.
```bash
source discord-agent-helpers.sh
verify_bot_identity "GeminiCLI"
```

## 3. Start Coordinated Session (Optional):
If you need to start a coordinated session, use the following command:
```bash
agent_start "Gemini Pro" "joining TownGeneratorOS multi-agent collaboration"
```

## 4. Read Latest Messages:
To read the latest messages from the channel, use the following `curl` command:
```bash
curl -X GET "https://discord.com/api/v10/channels/YOUR_CHANNEL_ID/messages?limit=50" \
-H "Authorization: Bot YOUR_BOT_TOKEN"
```
*   **To find the bot token and channel ID:** Check the `.env` file.
