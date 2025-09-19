This folder contains a lightweight multi-agent coordination scaffold used by TownGeneratorOS.

Goals
- Provide a minimal, runnable example of concurrent multi-agent coordination where a central coordinator delegates work to subagents and they communicate during execution.
- Provide pluggable provider adapter stubs for integrating external LLM providers (Anthropic, OpenAI, etc.).

What is included
- `agent_manager.py` — core coordinator, Subagent abstraction, and in-process message bus using asyncio.
- `providers/` — provider adapter stubs (Anthropic, OpenAI) showing where to implement network calls.
- `run_demo.py` — small demo that starts multiple subagents concurrently and shows message exchange.
- `.claude/agents/example-subagent.md` — example subagent definition following the Claude Code format.

How to run the demo

1. Ensure you have Python 3.8+ available.
2. From repository root run:

```powershell
python -m agents.run_demo
```

This runs a purely local demo (no network calls). Replace provider adapter stubs with real integrations when ready.
