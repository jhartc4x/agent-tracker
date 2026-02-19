# Agent Tracker

Kanban-style front end for monitoring and controlling OpenClaw agents. The board maps agent states to columns, surfaces health metrics, and exposes quick actions so you can nudge or escalate work without diving into the CLI.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the live dashboard and interact with the mock data.

## Next Steps

- Persist column preferences and auto-refresh behavior in localStorage or a lightweight cache
- Surface a live log stream (like the new Live Log panel) so you can see the CLI/agent activity happening behind the scenes as you interact

## Backend

The app now exposes two API routes that proxy to the local `openclaw` CLI:

- `GET /api/agents` → runs `openclaw agents list --json` and normalizes the output into the dashboard schema
- `POST /api/agents/:agentId/actions` → accepts `{ action: string }` and runs `openclaw agents action --agent-id <agentId> --action <action>`

The backend expects `openclaw` to be in `PATH` (or set `OPENCLAW_BIN`). Errors surface in the UI so you can tell when the CLI isn’t available.

See `Kanban-Plan.md` for the architecture, UX, and OpenClaw integration strategy.
