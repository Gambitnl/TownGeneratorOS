# AGENTS.md Quick Reference Guide

## 🚀 Quick Start for New Agents
1. Check `/agents/active/` - see who's working
2. Create your file: `/agents/active/{agent-id}-{timestamp}.md`
3. Follow 7 phases: START → PLAN → RESERVE → IMPLEMENT → TEST → CLEANUP → HANDOFF

## 📋 File Status Meanings
- `RESERVED` - File is claimed, don't touch
- `IN_PROGRESS` - Currently being modified
- `COMPLETE` - Finished modifying  
- `RELEASED` - Available for others

## ⚡ Quick Commands
```bash
# Check active agents
ls agents/active/

# See what files are reserved
grep -r "RESERVED\|IN_PROGRESS" agents/active/

# Check for conflicts before starting
grep -r "path/to/myfile.ts" agents/active/
```

## 🚨 Before You Start ANY Work
1. `ls agents/active/` - Check active sessions
2. Look for file conflicts in active sessions
3. Create your session file first
4. Reserve files before touching them

## 💡 Session File Template (Copy-Paste Ready)
```markdown
# Agent Session Record

## Metadata
- **Agent**: [YOUR_AGENT_NAME]
- **Session Start**: [TIMESTAMP]
- **Status**: STARTING
- **Goal**: [WHAT_YOU_WANT_TO_DO]

## Planning Phase
- **Problem Analysis**: [WHAT_NEEDS_TO_BE_DONE]
- **Approach**: [HOW_YOU_PLAN_TO_SOLVE_IT]
- **Estimated Duration**: [TIME_ESTIMATE]

## File Reservations
- `path/to/file.ts` - RESERVED

## Implementation Log
- [TIME] Started work...

## Results
[TO_BE_FILLED]
```

## 🔄 Status Flow
```
STARTING → PLANNING → RESERVED → IMPLEMENTING → TESTING → COMPLETE
```

## ⏰ Time Limits
- Reserved files: Release within 1 hour
- In-progress work: Complete within 2 hours  
- Long tasks: Break into smaller chunks

## 🆘 Emergency Override
Only if agent inactive >2 hours:
1. Create entry in `/agents/conflicts/`
2. Explain override reason
3. Proceed carefully