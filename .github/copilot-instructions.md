<!-- Copilot / AI agent guidance for contributors working on TownGeneratorOS -->
# Quick instructions for AI coding agents

These instructions focus on what an AI agent needs to be immediately productive in this repository.

## Big picture (what this repo is)
- TownGeneratorOS is a mixed codebase containing a lightweight multi-agent coordination scaffold (under `agents/`), a frontend web app (under `web/`), and small Node-based MCP servers (e.g. `mcp-task-server/`).
- The `agents/` folder contains the multi-agent workflow, provider adapter stubs, a local demo (`agents/run_demo.py`), and coordination helpers used by agents. See `agents/README.md` and the primary workflow in `AGENTS.md` for the 7-phase agent lifecycle.

## Major components and boundaries
- agents/: coordinator and subagent code (Python). Key files:
  - `agents/agent_manager.py` — core coordinator and in-process message bus.
  - `agents/run_demo.py` — runnable local demo (use `python -m agents.run_demo` from repo root).
  - `agents/providers/` — adapter stubs for LLM providers (implement network calls here).
- web/: front-end project (Vite + React). Use `cd web; npm install; npm run dev` or `yarn` variants. Dev server logs are written to `dev_server.log` by helper scripts.
- mcp-task-server/: Node MCP server (TypeScript). Use npm scripts (`npm run dev`, `npm run build`, `npm start`) in that directory to run the MCP server.

## Developer workflows (what to run and where)
- Run local multi-agent demo (pure Python, no network):
  - powershell: `python -m agents.run_demo`
- Start frontend dev server:
  - `cd web; npm install; npm run dev` (or `yarn install; yarn dev`). There are helper scripts at repo root: `run_dev.sh`, `run_yarn.sh` which redirect output to `dev_server.log`.
- MCP task server (local dev):
  - `cd mcp-task-server; npm install; npm run dev` — server rebuilds and serves MCP endpoints used by the workspace.

## Repo-specific conventions and patterns
- Multi-agent lifecycle and file locks
  - This project enforces a file-reservation pattern for agents using `agents/locks/` and the helper script `tools/agent-lock.sh`. Before editing files, agents should reserve them with `tools/agent-lock.sh reserve path/to/file` and release when done.
  - Lock files are simple INI-like files under `agents/locks/` and include owner, status, creation and expiry. There are commands: `reserve`, `release`, `check`, `list`, `show`, `force-reserve`, `force-release`.
- Provider adapters
  - Implement external LLM calls in `agents/providers/`. The demo runs without network; real integrations should follow the adapter stubs' interface.
- Agent session records
  - Agents create session files under `agents/active/` during work and move them to `agents/completed/` when finished. Follow the template in `AGENTS.md`.

## Integration points and external dependencies
- Frontend: Node (Vite + React). Check `web/package.json` for scripts/deps.
- MCP servers: Node/TypeScript in `mcp-task-server/` (build to `build/`).
- Agents: Python 3.8+ (local demo). Provider adapters will need network credentials for Anthropic/OpenAI if implemented.
- Discord integration: optional. Docs in `discord/docs/` explain how to configure the Discord MCP bridge used by some MCP servers.

## How to make safe edits as an AI agent
- Reserve files before modifying: `tools/agent-lock.sh reserve <path>`; verify with `tools/agent-lock.sh check <path>`.
- Keep session metadata in `agents/active/<agent>-<ts>.md` and update status as you progress per `AGENTS.md` phases.
- When changing server code (mcp-task-server) or web code, prefer small, focused edits and run local dev tasks to validate (see above).

## Examples from the codebase (patterns to follow)
- Lock usage: `tools/agent-lock.sh reserve README.md --ttl 1800` (creates `agents/locks/*.lock`).
- Agent demo run: `python -m agents.run_demo` — shows in-process messaging and how provider stubs are invoked.
- MCP server run: `cd mcp-task-server; npm run dev` — uses scripts in `package.json` to run the TypeScript server in watch mode.

## What NOT to assume
- Do not assume CI or tests exist; there are no standardized unit tests in this snapshot. Validate by running local dev servers and verifying behaviour manually.
- Do not assume provider credentials are present. Provider adapter code under `agents/providers/` is intentionally stubbed.

## Where to look for more detail
- Primary agent protocol and examples: `AGENTS.md` and `agents/README.md`.
- Lock tooling and usage: `tools/agent-lock.sh` and `tools/pre-commit-checks.sh`.
- Frontend dev: `web/README.md` and `web/package.json`.
- MCP server: `mcp-task-server/README.md` and `mcp-task-server/src/index.ts`.

---
If anything here seems incomplete or you'd like more examples (CI, tests, debug recipes), tell me which area to expand and I'll iterate.
