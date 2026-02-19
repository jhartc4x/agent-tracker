# Agent Tracker

Kanban-style front end for monitoring and controlling OpenClaw agents. The board maps agent states to columns, surfaces health metrics, and exposes quick actions so you can nudge or escalate work without diving into the CLI.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the live dashboard and interact with the mock data.

## Next Steps

- Wire the board to `openclaw agents list --json` so the columns reflect live state
- Add API routes that call `openclaw agents action` for each card control
- Persist column preferences and auto-refresh behavior in localStorage or a lightweight cache

See `Kanban-Plan.md` for the architecture, UX, and OpenClaw integration strategy.
