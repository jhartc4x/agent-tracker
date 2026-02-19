# Agent Tracker

Kanban-style front end for monitoring and controlling OpenClaw agents. The board maps agent states to columns, surfaces health metrics, and exposes quick actions so you can nudge or escalate work without diving into the CLI.

## Features

- **Live Kanban board** that displays backlog → running → paused → completed agents, with filters and drag-and-drop staging.
- **Tools + Skills catalog** that fetches `openclaw --help` and `openclaw skills list --json` so you always know what helpers are available.
- **Create agent form** that calls `openclaw agents add` to bootstrap a new isolated agent workspace directly from the UI.
- **Live log stream** showing recent agent chatter while you manage the board.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the dashboard and interact with the mock data/CLI-backed endpoints.

## Backend APIs

- `GET /api/agents` → proxies to `openclaw agents list --json` and normalizes each entry
- `POST /api/agents/:agentId/actions` → proxies to `openclaw agents action --agent-id <agentId> --action <action>`
- `GET /api/tools` → parses `openclaw --help` to return available top-level commands
- `GET /api/skills` → runs `openclaw skills list --json` and returns summaries with eligibility status
- `POST /api/agents/create` → runs `openclaw agents add --non-interactive --workspace <path> [--model <id>] <name>`; defaults to `./agent-workspaces/<name>` if no workspace is provided

The backend assumes `openclaw` is available on `PATH` (override with `OPENCLAW_BIN` if needed) and that the server can write to `agent-workspaces/` for new agents.

## Next Steps

- Persist column preferences and auto-refresh behavior in localStorage or a lightweight cache
- Surface richer telemetry in the tool/skill list (missing bins, env, etc.)
- Expand the live log panel to ingest real CLI streams or WebSocket events

See `Kanban-Plan.md` for the architecture, UX, and OpenClaw integration strategy.
