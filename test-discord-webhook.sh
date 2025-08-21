#!/bin/bash

# Test Discord webhook
# Replace YOUR_WEBHOOK_URL with the actual webhook URL from Discord

WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"

# Test message
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🟢 [01:10] TEST: Discord webhook working!",
    "username": "Agent Coordinator"
  }'

echo "Test message sent to Discord!"