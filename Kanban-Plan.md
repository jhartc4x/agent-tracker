# Kanban Board for OpenClaw Agents

## Goal
Build a lightweight, web-based Kanban board that lets Josh monitor and control OpenClaw agents without leaving the browser. The UI mirrors an actual operations board: it shows agent tasks (backlog, planned, running, paused, completed) as draggable cards, surfaces runtime metadata, and exposes one-click controls to start, pause, escalate, or kill agents.

## Key Concepts
- **Columns:** Backlog, Ready/Queued, Running, Paused/Holding, Completed. Each column is a synced view of agent work items or automation tasks.
- **Cards:** Represent agents or agent-driven jobs. Each card includes name, id, priority, status, last run, target nodes, owner (if any), and quick actions (resume/stop/requeue).
- **Actions:** `Start`, `Pause`, `Cancel`, `Escalate/Notify`, `Requeue`. These call OpenClaw (via CLI/API) to change an agent’s state.
- **Filters:** Time window, tags (e.g., `security`, `web`), skill (agents grouped by skill name), node (where they run).
- **Telemetry:** Show health badge (success/fail counts), last run timestamp, next scheduled run, run duration.

## Architecture
- **Frontend:** Next.js (App Router) + Tailwind CSS for responsive layout. Kanban board uses a drag-and-drop helper like [`@dnd-kit/core`](https://dnd-kit.com/) for column/card moves, plus a live status sidebar that polls agent health.
- **Backend/API:** Next.js API routes or Edge Functions that proxy to OpenClaw commands. Common endpoints:
  - `GET /api/agents`: list agents with statuses, metadata (calls `openclaw agents list --json` or uses `openclaw` internal API).
  - `POST /api/agents/:id/action`: send control commands (`start`, `pause`, `cancel`, etc.). This runs `openclaw agents action --agent-id <id> --action start`.
  - `GET /api/logs?agentId=`: tail recent logs for hover previews.

  Authentication is the machine’s local OpenClaw CLI credentials; configure the server to run in the same environment or container where `openclaw` is available.
- **Data Model (in-memory/cache):** Keep a small cache (Redis or in-process TTL) of agent snapshots to avoid hammering the CLI; rehydrate every 5–15 seconds.

## Implementation Plan
### 1. Repository & Infrastructure
1. Bootstrap with `npx create-next-app@latest agent-tracker --typescript --eslint` (or Vite/React if a lighter stack is preferred).
2. Layout MVP pages: Dashboard with board, Settings (agent filters, credentials), and Logs.
3. Add Tailwind + Radix/ui components for polished cards.
4. Wire up linting, Prettier, and husky (optional) to keep code clean.

### 2. Kanban Core
1. Design columns and card schema; map OpenClaw statuses to columns:
   - `idle`, `queued` → Backlog/Ready
   - `running` → Running
   - `paused`, `waiting` → Paused
   - `succeeded`, `failed` → Completed
2. Build draggable board using `dnd-kit` or similar. Persist column order/preferences in localStorage.
3. Each card includes: title (agent name), status badge, controls (buttons). Clicking `Start` triggers API call.
4. Add detail panel (drawer) for the selected agent showing recent logs, run history, and actions.

### 3. OpenClaw Integration
1. Investigate CLI/APIs to list agents and their metadata: `openclaw agents list --json`. Wrap CLI output via Node’s `child_process` or spawn a helper service.
2. Create API helpers in `lib/openclaw.ts` to run commands and normalize results.
3. Ensure POST actions are idempotent and log all CLI output for audit.
4. Add polling or WebSocket subscriptions (if OpenClaw exposes events) so the board stays live.

### 4. Polish & Ops
1. Add search/filters above the board (search by name, skill, tags).
2. Provide a `Refresh` button plus auto-refresh every 10 seconds.
3. Document how to run locally and how to deploy to a server with access to `openclaw`.
4. Optional: ship a small CLI/agent that pushes board updates into the OpenClaw event stream (via cron or webhook) so the board can also raise Slack alerts when cards move.

## Next Steps
- Choose stack (Next.js vs Vite) and scaffold the repo.
- Wire OpenClaw command helpers so the frontend can fetch/manage agent data.
- Iterate on the Kanban UI, starting with static mock data and swapping in live data once APIs are stable.

Let me know if you want an initial prototype in this repo (components + fake data), or if you’d like me to automate any of the OpenClaw command wiring.