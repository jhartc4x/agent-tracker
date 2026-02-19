import type { AgentStatus } from "./mockAgents";

export interface BoardColumnConfig {
  id: string;
  title: string;
  subtitle: string;
  statuses: AgentStatus[];
}

export const boardColumns: BoardColumnConfig[] = [
  {
    id: "backlog",
    title: "Backlog",
    subtitle: "Ideas and work-items waiting for approval",
    statuses: ["backlog"],
  },
  {
    id: "ready",
    title: "Ready / Queued",
    subtitle: "Prepped agents that can be started asap",
    statuses: ["ready"],
  },
  {
    id: "running",
    title: "Running",
    subtitle: "Agents that are currently executing",
    statuses: ["running"],
  },
  {
    id: "paused",
    title: "Paused / Holding",
    subtitle: "Waiting on approvals or external events",
    statuses: ["paused"],
  },
  {
    id: "completed",
    title: "Completed",
    subtitle: "Finished or retired work",
    statuses: ["completed"],
  },
];
