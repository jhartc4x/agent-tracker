import type { ExecFileOptions } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  Agent,
  AgentAction,
  AgentPriority,
  AgentStatus,
  agentStatusLabels,
} from "@/lib/mockAgents";

const execFileAsync = promisify(execFile);
const openClawBinary = process.env.OPENCLAW_BIN ?? "openclaw";

interface RawAgent {
  id?: string;
  name?: string;
  summary?: string;
  skill?: string;
  owner?: string;
  node?: string;
  status?: string;
  priority?: string;
  lastRun?: string;
  nextRun?: string;
  tags?: string[];
  target?: string;
  telemetry?: {
    success?: number;
    failure?: number;
    run_time?: string;
  };
}

const statusValues: AgentStatus[] = ["backlog", "ready", "running", "paused", "completed"];

const normalizeStatus = (value?: string): AgentStatus => {
  if (!value) return "backlog";
  const normalized = value.toLowerCase();
  return statusValues.includes(normalized as AgentStatus)
    ? (normalized as AgentStatus)
    : "backlog";
};

const normalizePriority = (value?: string): AgentPriority => {
  if (!value) return "Medium";
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "low":
      return "Low";
    case "high":
      return "High";
    case "critical":
      return "Critical";
    default:
      return "Medium";
  }
};

const toPercent = (value?: number): number => {
  if (typeof value === "number") return Math.min(100, Math.max(0, value));
  return 0;
};

const toFailure = (value?: number): number => {
  if (typeof value === "number") return Math.max(0, value);
  return 0;
};

const normalizeAgent = (raw: RawAgent): Agent => {
  const nowIso = new Date().toISOString();
  const status = normalizeStatus(raw.status);

  return {
    id: raw.id ?? raw.name ?? crypto.randomUUID?.() ?? `agent-${Date.now()}`,
    name: raw.name ?? raw.id ?? "Unknown agent",
    summary: raw.summary ?? raw.skill ?? "No summary",
    status,
    priority: normalizePriority(raw.priority),
    skill: raw.skill ?? "unassigned",
    owner: raw.owner ?? "OpenClaw",
    node: raw.node ?? "control-plane",
    lastRun: raw.lastRun ?? nowIso,
    nextRun: raw.nextRun ?? nowIso,
    tags: Array.isArray(raw.tags) ? raw.tags : ["auto"],
    target: raw.target ?? raw.node ?? "local",
    telemetry: {
      success: toPercent(raw.telemetry?.success),
      failure: toFailure(raw.telemetry?.failure),
      runTime: raw.telemetry?.run_time ?? "n/a",
    },
    lastResult: agentStatusLabels[status],
  };
};

const runOpenClaw = async (args: string[]) => {
  const options: ExecFileOptions = { timeout: 10_000 };
  try {
    const { stdout, stderr } = await execFileAsync(openClawBinary, args, options);
    if (stderr) {
      console.warn("openclaw stderr", stderr);
    }
    return stdout;
  } catch (error) {
    const message = (error as Error).message || "openclaw failed";
    throw new Error(message);
  }
};

export const listAgents = async (): Promise<Agent[]> => {
  const stdout = await runOpenClaw(["agents", "list", "--json"]);
  const parsed = JSON.parse(stdout ?? "[]");
  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.results)
    ? parsed.results
    : [];
  return candidates.map((raw: RawAgent) => normalizeAgent(raw));
};

export const controlAgent = async (agentId: string, action: AgentAction) => {
  const stdout = await runOpenClaw([
    "agents",
    "action",
    "--agent-id",
    agentId,
    "--action",
    action,
  ]);
  return stdout;
};
