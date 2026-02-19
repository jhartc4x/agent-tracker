import fs from "node:fs/promises";
import path from "node:path";
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
const defaultWorkspaceRoot = path.join(process.cwd(), "agent-workspaces");

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

interface RawSkill {
  name: string;
  description?: string;
  emoji?: string;
  eligible?: boolean;
  homepage?: string;
  missing?: {
    bins?: string[];
    anyBins?: string[];
    env?: string[];
    config?: string[];
    os?: string[];
  };
}

export interface SkillMissing {
  bins: string[];
  anyBins: string[];
  env: string[];
  config: string[];
  os: string[];
}

export interface SkillSummary {
  name: string;
  description: string;
  emoji?: string;
  eligible: boolean;
  homepage?: string;
  missing: SkillMissing;
}

export interface ToolSummary {
  command: string;
  description: string;
}

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

const sanitizeAgentName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const ensureDirectory = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

export interface CreateAgentOptions {
  name: string;
  workspace?: string;
  model?: string;
  binds?: string[];
}

const buildAgentWorkspace = (name: string, override?: string) => {
  if (override && override.trim()) {
    return path.resolve(override.trim());
  }

  const sanitized = sanitizeAgentName(name) || `agent-${Date.now()}`;
  return path.join(defaultWorkspaceRoot, sanitized);
};

export const createAgent = async (options: CreateAgentOptions) => {
  if (!options.name?.trim()) {
    throw new Error("Agent name is required");
  }

  const workspaceDir = buildAgentWorkspace(options.name, options.workspace);
  await ensureDirectory(workspaceDir);

  const args = ["agents", "add", "--non-interactive", "--workspace", workspaceDir];
  if (options.model) {
    args.push("--model", options.model);
  }
  if (Array.isArray(options.binds)) {
    options.binds.forEach((value) => args.push("--bind", value));
  }
  args.push(options.name.trim());

  return runOpenClaw(args);
};

export const listTools = async (): Promise<ToolSummary[]> => {
  const stdout = await runOpenClaw(["--help"]);
  if (!stdout) {
    return [];
  }

  const lines = stdout.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "Commands:");
  if (start === -1) {
    return [];
  }
  const end = lines.findIndex(
    (line, index) => index > start && line.trim().startsWith("Examples:")
  );
  const slice = lines.slice(start + 1, end === -1 ? undefined : end);

  const tools: ToolSummary[] = [];
  for (const line of slice) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("Commands:")) continue;

    const parts = trimmed.split(/\s{2,}/).filter(Boolean);
    if (parts.length === 0) continue;

    const command = parts[0];
    const description = parts.slice(1).join(" ").trim();
    tools.push({ command, description });
  }

  return tools;
};

export const listSkills = async (): Promise<SkillSummary[]> => {
  const stdout = await runOpenClaw(["skills", "list", "--json"]);
  if (!stdout) {
    return [];
  }

  const parsed = JSON.parse(stdout);
  const rawSkills: RawSkill[] = Array.isArray(parsed.skills)
    ? parsed.skills
    : [];

  return rawSkills.map((skill) => ({
    name: skill.name,
    description: skill.description ?? "",
    emoji: skill.emoji,
    eligible: Boolean(skill.eligible),
    homepage: skill.homepage,
    missing: {
      bins: skill.missing?.bins ?? [],
      anyBins: skill.missing?.anyBins ?? [],
      env: skill.missing?.env ?? [],
      config: skill.missing?.config ?? [],
      os: skill.missing?.os ?? [],
    },
  }));
};
