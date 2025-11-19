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
2. Create file: `/agents/active/{agent-id}-{timestamp}.md`
3. Declare general intent/goal
4. Check `/agents/active/` for conflicting work
5. Set status to `STARTING`

### Phase 2: PLANNING
1. Analyze the problem/request thoroughly
2. Research codebase (read files, understand structure) 
3. Define approach and scope
4. Set status to `PLANNING`

### Phase 3: FILE_RESERVATION
1. List ALL files you plan to modify
2. Check if any files are already `RESERVED` by other agents
3. **File locking**: Use `tools/agent-lock.sh reserve path/to/file`
4. If conflicts exist: coordinate via local conflict resolution (see below)
5. Mark your files as `RESERVED` in your session file
6. Set status to `RESERVED`

### Phase 4: IMPLEMENTATION
1. Execute the planned changes file by file
2. Update file status as you complete each one:
   - `RESERVED` → `IN_PROGRESS` → `COMPLETE`
3. Set status to `IMPLEMENTING`

### Phase 5: TESTING/VALIDATION
1. Run builds, tests, check for errors
2. Verify changes work as expected
3. Set status to `TESTING`

### Phase 6: CLEANUP
1. **File release**: Use `tools/agent-lock.sh release path/to/file`
2. Mark all files as `RELEASED` in your session file
3. Update status to `SESSION_COMPLETE`
4. Move your file to `/agents/completed/`

### Phase 7: HANDOFF (if needed)
1. Document what was accomplished
2. Note any remaining work for future agents
3. Commit changes to git
4. Final status: `COMPLETE`

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
   - Work on different parts of the codebase

2. **Emergency Override**: Only if an agent has been inactive >2 hours
   - Create entry in `/agents/conflicts/` explaining override
   - Proceed with caution

3. **Time Limits**: 
   - `RESERVED` files should be released within 1 hour
   - `IN_PROGRESS` work should complete within 2 hours
   - Long tasks should be broken into smaller chunks


## Local Coordination (Offline)

Use these local tools to coordinate safely:

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
2. Create your session file following the template
3. Follow the 7-phase workflow
4. Always clean up when done

---

## Current Instructions for Claude (Sonnet 4)
- You should now create your session file and begin following this protocol
- Start with Phase 1: SESSION_START
