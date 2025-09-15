#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Discord Bot Setup Helper ==="
echo ""
echo "1. Go to: https://discord.com/developers/applications"
echo "2. Create new application: 'TownGenerator-Agent-Bot'"
echo "3. Go to Bot section → Add Bot"
echo "4. Copy your bot token"
echo "5. Enable these bot permissions:"
echo "   - Send Messages"
echo "   - Read Message History"
echo "   - View Channels" 
echo "   - Add Reactions"
echo ""
echo "6. Get Channel IDs (Enable Developer Mode in Discord):"
echo "   Right-click each channel → Copy Channel ID"
echo ""
echo "Enter your bot token:"
read -s BOT_TOKEN
echo ""
echo "Enter your Discord server/guild ID:"
read GUILD_ID
echo ""
echo "Enter channel IDs:"
echo "Agent Status Channel ID:"
read AGENT_STATUS_CHANNEL
echo "File Reservations Channel ID:"
read FILE_RESERVATIONS_CHANNEL
echo "Active Work Channel ID:"
read ACTIVE_WORK_CHANNEL
echo "Conflicts Channel ID:"
read CONFLICTS_CHANNEL
echo "Completed Work Channel ID:"
read COMPLETED_WORK_CHANNEL

echo ""
echo "Creating discord/config/.env file..."

mkdir -p "$SCRIPT_DIR/../config"
cat > "$SCRIPT_DIR/../config/.env" << EOF
# Discord Bot Configuration
DISCORD_BOT_TOKEN="$BOT_TOKEN"
DISCORD_GUILD_ID="$GUILD_ID"

# Channel IDs
DISCORD_AGENT_STATUS_CHANNEL="$AGENT_STATUS_CHANNEL"
DISCORD_FILE_RESERVATIONS_CHANNEL="$FILE_RESERVATIONS_CHANNEL"
DISCORD_ACTIVE_WORK_CHANNEL="$ACTIVE_WORK_CHANNEL"
DISCORD_CONFLICTS_CHANNEL="$CONFLICTS_CHANNEL"
DISCORD_COMPLETED_WORK_CHANNEL="$COMPLETED_WORK_CHANNEL"
EOF

echo "✅ .env file created!"
echo ""
echo "⚠️  IMPORTANT: Keep your .env file secret!"
echo "   Add .env to .gitignore if not already there"
echo ""
echo "Next step: Run $SCRIPT_DIR/discord-bot-functions.sh to test the connection"
