# AGENTS.md - Multi-Agent Coordination Protocol

## Purpose
This file defines the coordination protocol for multiple AI agents working on the TownGeneratorOS codebase simultaneously.

## Directory Structure
```
/agents/
  ├── active/          # Currently working agents
  ├── completed/       # Finished sessions
  └── conflicts/       # Conflict resolution records
```

## Agent Workflow Protocol

### Phase 1: SESSION_START
1. **Query system clock**: Use `date` command for accurate timestamp
2. **Discord announcement**: Send to #agent-status: `🟢 [HH:MM] AGENT_START: {Agent} starting work on {goal}`
3. Create file: `/agents/active/{agent-id}-{timestamp}.md`
4. Declare general intent/goal
5. Check `/agents/active/` for conflicting work
6. Set status to `STARTING`

### Phase 2: PLANNING
1. Analyze the problem/request thoroughly
2. Research codebase (read files, understand structure) 
3. Define approach and scope
4. Set status to `PLANNING`

### Phase 3: FILE_RESERVATION
1. List ALL files you plan to modify
2. Check if any files are already `RESERVED` by other agents
3. **Discord file locking**: Send to #file-reservations: `🔒 [HH:MM] FILE_RESERVE: path/to/file.ts - {Agent}`
4. If conflicts exist: coordinate via Discord #conflicts channel
5. Mark your files as `RESERVED`
6. Set status to `RESERVED`

### Phase 4: IMPLEMENTATION
1. Execute the planned changes file by file
2. **Discord progress updates**: Send to #active-work: `⚙️ [HH:MM] PROGRESS: 50% complete - {task description} - {Agent}`
3. Update file status as you complete each one:
   - `RESERVED` → `IN_PROGRESS` → `COMPLETE`
4. Set status to `IMPLEMENTING`

### Phase 5: TESTING/VALIDATION
1. Run builds, tests, check for errors
2. Verify changes work as expected
3. Set status to `TESTING`

### Phase 6: CLEANUP
1. **Discord file release**: Send to #file-reservations: `✅ [HH:MM] FILE_RELEASE: path/to/file.ts - {Agent}`
2. Mark all files as `RELEASED`
3. Update status to `SESSION_COMPLETE`
4. Move your file to `/agents/completed/`

### Phase 7: HANDOFF (if needed)
1. **Discord completion**: Send to #completed-work: `🏁 [HH:MM] AGENT_COMPLETE: {Agent} finished {task} - {summary}`
2. **Discord session end**: Send to #agent-status: `🔴 [HH:MM] AGENT_END: {Agent} session complete`
3. Document what was accomplished
4. Note any remaining work for future agents
5. Commit changes to git
6. Final status: `COMPLETE`

## File Format Template

```markdown
# Agent Session Record

## Metadata
- **Agent**: [Agent Name/ID]
- **Session Start**: YYYY-MM-DD HH:MM:SS
- **Status**: [STARTING|PLANNING|RESERVED|IMPLEMENTING|TESTING|COMPLETE]
- **Goal**: [Brief description]

## Planning Phase
- **Problem Analysis**: [What needs to be done]
- **Approach**: [How you plan to solve it]
- **Estimated Duration**: [Time estimate]

## File Reservations
- `path/to/file1.ts` - [RESERVED|IN_PROGRESS|COMPLETE|RELEASED]
- `path/to/file2.tsx` - [RESERVED|IN_PROGRESS|COMPLETE|RELEASED]

## Implementation Log
- [HH:MM] Started work on file1.ts
- [HH:MM] Completed file1.ts modifications
- [HH:MM] Testing changes...

## Results
- **Files Modified**: [List]
- **Tests Passed**: [Yes/No]
- **Issues Encountered**: [Any problems]
- **Handoff Notes**: [For next agent]

## Session End
- **Completed**: YYYY-MM-DD HH:MM:SS
- **Duration**: [Total time]
```

## Conflict Resolution Rules

1. **File Conflicts**: If another agent has `RESERVED` a file you need:
   - Wait for them to `RELEASE` it, OR
   - Coordinate directly via commit messages, OR
   - Work on different parts of the codebase

2. **Emergency Override**: Only if an agent has been inactive >2 hours
   - Create entry in `/agents/conflicts/` explaining override
   - Proceed with caution

3. **Time Limits**: 
   - `RESERVED` files should be released within 1 hour
   - `IN_PROGRESS` work should complete within 2 hours
   - Long tasks should be broken into smaller chunks

## Discord Integration

### Required Setup
1. Follow `discord/docs/DISCORD-MCP-SETUP.md` to configure Discord MCP
2. Ensure you have access to these channels:
   - #agent-status (lifecycle events)
   - #file-reservations (file locking)
   - #active-work (progress updates)
   - #conflicts (coordination issues)
   - #completed-work (task summaries)

### Discord Message Format
Always include timestamp and agent ID:
```
🟢 [HH:MM] AGENT_START: Claude (Sonnet 4) starting work on building generation
🔒 [HH:MM] FILE_RESERVE: src/components/BuildingPane.tsx - Claude (Sonnet 4)
⚙️ [HH:MM] PROGRESS: 75% complete - BuildingPane refactor - Claude (Sonnet 4)
✅ [HH:MM] FILE_RELEASE: src/components/BuildingPane.tsx - Claude (Sonnet 4)
🏁 [HH:MM] AGENT_COMPLETE: Claude (Sonnet 4) finished building generation
🔴 [HH:MM] AGENT_END: Claude (Sonnet 4) session complete
```

### Conflict Resolution via Discord
If you encounter conflicts:
1. Send to #conflicts: `⚠️ [HH:MM] CONFLICT: Need help with file.tsx - conflicts with {other agent} - {Agent}`
2. Wait for response or coordinate directly
3. Document resolution in session file

## Local Coordination (Offline)

When Discord is unavailable or network is restricted, use these local tools to coordinate safely:

- Tools: Lightweight utilities live in the repo
  - `tools/agent-lock.sh`: Reserve/release/check/list file locks (default TTL: 3600s)
  - `tools/agent-prune-locks.sh`: Remove expired locks; logs overrides to `agents/conflicts/overrides-YYYY-MM-DD.md`
  - `agents/status.sh`: UTC timestamp helper, status updates, and log appends for session files
  - `tools/pre-commit-checks.sh`: Blocks commits that touch files with active locks held by others
  - `tools/install-git-hook.sh`: Installs the pre-commit guard into `.git/hooks/pre-commit`

- Human Override
  - Force release: `tools/agent-lock.sh force-release <file> --by "Your Name" --reason "why"`
  - Force reserve: `tools/agent-lock.sh force-reserve <file> --by "Your Name" --reason "why" [--ttl 3600] [--status RESERVED]`
  - Bypass pre-commit guard: `AGENT_OVERRIDE=1 OVERRIDE_REASON="why" git commit -m "..."` (override recorded in `agents/conflicts/`)

- Identity: Set your agent name in the environment
  - `export AGENT="Your Agent Name"` (or `AGENT_NAME`)

- Typical Flow (maps to Phases)
  - Session start (Phase 1): Create `/agents/active/<agent>-<ts>.md`; use `agents/status.sh now` for UTC; set status to `STARTING`
  - Planning (Phase 2): Update session file and set status `PLANNING`
  - Reservation (Phase 3): For each target file run `tools/agent-lock.sh reserve path/to/file --ttl 3600`; add entry in your session file (`RESERVED`)
  - Implementation (Phase 4): Before editing, `tools/agent-lock.sh check path/to/file`; update session entries (`IN_PROGRESS` → `COMPLETE`); append notes with `agents/status.sh log`
  - Testing (Phase 5): Document results; set status `TESTING`
  - Cleanup (Phase 6): `tools/agent-lock.sh release path/to/file`; run `tools/agent-prune-locks.sh` periodically; move session file to `/agents/completed/` and set status `SESSION_COMPLETE`
  - Handoff (Phase 7): Summarize in your session record; commit changes

## Getting Started

Before any work:
1. Check `/agents/active/` for current activity
2. Check Discord #agent-status for live agent activity
3. Create your session file following the template
4. Follow the 7-phase workflow with Discord integration
5. Always clean up when done

---

## Current Instructions for Claude (Sonnet 4)
- You should now create your session file and begin following this protocol
- Start with Phase 1: SESSION_START
- Use Discord MCP for live coordination if configured
