export type AgentStatus =
  | "backlog"
  | "ready"
  | "running"
  | "paused"
  | "completed";

export type AgentAction =
  | "start"
  | "pause"
  | "resume"
  | "cancel"
  | "requeue"
  | "escalate";

export interface Agent {
  id: string;
  name: string;
  summary: string;
  status: AgentStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  skill: string;
  owner: string;
  node: string;
  lastRun: string;
  nextRun: string;
  tags: string[];
  target: string;
  telemetry: {
    success: number;
    failure: number;
    runTime: string;
  };
  lastResult: string;
}

export type AgentPriority = Agent["priority"];

export const agentStatusLabels: Record<AgentStatus, string> = {
  backlog: "Backlog",
  ready: "Queued",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
};

export const mockAgents: Agent[] = [
  {
    id: "op-watch",
    name: "Operator Watch",
    summary: "Keeps an eye on critical infra alerts and escalates anomalies.",
    status: "running",
    priority: "Critical",
    skill: "observability",
    owner: "Team Signal",
    node: "edge-node-12",
    lastRun: "2024-10-12T09:54:00Z",
    nextRun: "2024-10-12T10:25:00Z",
    tags: ["security", "infra", "monitoring"],
    target: "us-east-1",
    telemetry: {
      success: 86,
      failure: 2,
      runTime: "2m 14s",
    },
    lastResult: "No high-priority anomalies seen.",
  },
  {
    id: "deploy-guard",
    name: "Deploy Guard",
    summary: "Validates release staging grid and pauses any risky deployments.",
    status: "paused",
    priority: "High",
    skill: "release",
    owner: "Release Ops",
    node: "staging-lab",
    lastRun: "2024-10-12T08:10:00Z",
    nextRun: "2024-10-12T11:00:00Z",
    tags: ["deployment", "CI"],
    target: "staging",
    telemetry: {
      success: 12,
      failure: 5,
      runTime: "4m 02s",
    },
    lastResult: "Blocked: tests failing in staging smoke suite.",
  },
  {
    id: "security-sweep",
    name: "Security Sweep",
    summary: "Rotates through policy checks, surfaces drift, and documents fixes.",
    status: "ready",
    priority: "High",
    skill: "security",
    owner: "SecOps",
    node: "secure-cluster",
    lastRun: "2024-10-11T17:40:00Z",
    nextRun: "2024-10-12T13:00:00Z",
    tags: ["policy", "hardening"],
    target: "multi-region",
    telemetry: {
      success: 24,
      failure: 0,
      runTime: "5m 18s",
    },
    lastResult: "Reports generated for 14 nodes.",
  },
  {
    id: "billing-check",
    name: "Billing Reconcile",
    summary: "Compares live usage with forecast and adjusts thresholds.",
    status: "backlog",
    priority: "Medium",
    skill: "finance",
    owner: "Finance Automation",
    node: "jobs-controller",
    lastRun: "2024-10-10T21:20:00Z",
    nextRun: "2024-10-13T02:00:00Z",
    tags: ["cost", "reconciliation"],
    target: "cloud-account-6",
    telemetry: {
      success: 14,
      failure: 1,
      runTime: "1m 12s",
    },
    lastResult: "Discovered double-counted storage metric.",
  },
  {
    id: "insight-puller",
    name: "Insight Puller",
    summary: "Harvests user sentiment + telemetry for product intelligence.",
    status: "running",
    priority: "High",
    skill: "analytics",
    owner: "Product Data",
    node: "insight-grid",
    lastRun: "2024-10-12T09:42:00Z",
    nextRun: "2024-10-12T10:42:00Z",
    tags: ["analytics", "feedback"],
    target: "global",
    telemetry: {
      success: 57,
      failure: 3,
      runTime: "3m 09s",
    },
    lastResult: "New tag clusters shipped to notebook.",
  },
  {
    id: "cleanup-batch",
    name: "Cleanup Batch",
    summary: "Clears stale contexts that leak memory across nodes.",
    status: "completed",
    priority: "Low",
    skill: "maintenance",
    owner: "Core Ops",
    node: "batch-queue",
    lastRun: "2024-10-11T22:15:00Z",
    nextRun: "2024-10-12T18:00:00Z",
    tags: ["housekeeping"],
    target: "us-west-2",
    telemetry: {
      success: 99,
      failure: 0,
      runTime: "30s",
    },
    lastResult: "Removed 18 expired contexts.",
  },
  {
    id: "journalist",
    name: "Journalist",
    summary: "Tracks conversations and moves relevant notes into memory.",
    status: "ready",
    priority: "Medium",
    skill: "meta",
    owner: "Memory Ops",
    node: "memory-grid",
    lastRun: "2024-10-12T06:00:00Z",
    nextRun: "2024-10-12T14:00:00Z",
    tags: ["memory", "context"],
    target: "global",
    telemetry: {
      success: 7,
      failure: 0,
      runTime: "45s",
    },
    lastResult: "Tagged new memory candidates for review.",
  },
  {
    id: "escalation-hub",
    name: "Escalation Hub",
    summary: "Requeues urgent tickets to specialized agents.",
    status: "paused",
    priority: "Critical",
    skill: "triage",
    owner: "Incident Desk",
    node: "incident-grid",
    lastRun: "2024-10-12T09:10:00Z",
    nextRun: "2024-10-12T11:10:00Z",
    tags: ["incident", "triage"],
    target: "global",
    telemetry: {
      success: 31,
      failure: 2,
      runTime: "1m 57s",
    },
    lastResult: "Holding while awaiting approvals.",
  },
];
