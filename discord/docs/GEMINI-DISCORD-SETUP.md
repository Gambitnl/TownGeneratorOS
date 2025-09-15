# Gemini Pro Discord Integration - Fast Track Setup
Note: This document was relocated to `discord/docs/`.

## Before You Start
You need the GeminiCLI bot token. Human user should create it at https://discord.gg/developers/applications

## Instant Setup Commands

**1. Switch to GeminiCLI bot (and recover from identity confusion):**
To ensure you are operating as GeminiCLI, copy your specific environment file. This is also your primary recovery step if your bot identity becomes confused (e.g., if your `.env` file is overwritten). Always keep `/.env.gemini` as your authoritative backup.
```bash
cp .env.gemini .env
```

**2. Update your bot token:**
```bash
# Edit .env and replace REPLACE_WITH_GEMINICLI_BOT_TOKEN with actual token
```

**3. Test connection:**
```bash
source enhanced-agent-functions.sh
test_bot_connection  # Should show: "GeminiCLI"
```

**4. Start coordinated session:**
```bash
agent_start "Gemini Pro" "joining TownGeneratorOS multi-agent collaboration"
check_coordination  # See Claude Code and Codex
```

**5. Test coordination:**
```bash
progress_update "Gemini Pro" "Setup complete" "Ready to collaborate on medieval town generator"
```

## Multi-Agent Coordination

**Current agents in this project:**
- **ClaudeCLI** - Claude Code (main coordinator)
- **CodexCLI** - OpenAI Codex (screenshots, technical analysis)
- **GeminiCLI** - Gemini Pro (YOU!)

**File coordination protocol:**
```bash
# Reserve files before editing
reserve_file_live "Gemini Pro" "src/components/TownScene.tsx"

# Work on the file...

# Release when done
release_file "Gemini Pro" "src/components/TownScene.tsx"
```

## TownGeneratorOS Overview

**Three generation systems:**
1. **City** - Voronoi diagrams (`/src/services/Model.ts`)
2. **Village** - Organic layouts (`/src/services/VillageGenerator.ts`) 
3. **Building** - 5ft D&D grid (`/src/services/StandaloneBuildingGenerator.ts`)

**Current focus:** City generation improvements and UI enhancements

## Quick Commands Reference

```bash
# See what others are working on
check_coordination

# Send progress updates  
progress_update "Gemini Pro" "75% complete" "implementing city ward improvements"

# Check for file conflicts
check_file_conflicts "src/services/Model.ts"

# End your session
agent_end "Gemini Pro"
```

## Ready!
Once your GeminiCLI bot is added to Discord, these commands will get you coordinating with Claude and Codex immediately! 🤖🤝🤖🤝🤖
