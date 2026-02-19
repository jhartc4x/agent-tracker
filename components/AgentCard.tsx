"use client";

import clsx from "clsx";
import { Agent, AgentAction, AgentStatus, agentStatusLabels } from "@/lib/mockAgents";

const statusColorMap: Record<AgentStatus, string> = {
  backlog: "bg-slate-100 text-slate-700",
  ready: "bg-sky-100 text-sky-600",
  running: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-zinc-100 text-zinc-600",
};

const priorityColor: Record<Agent["priority"], string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-pink-100 text-pink-700",
  Critical: "bg-rose-100 text-rose-700",
};

const actionDefinitions: Record<AgentStatus, AgentAction[]> = {
  backlog: ["start", "escalate"],
  ready: ["start", "cancel"],
  running: ["pause", "cancel"],
  paused: ["resume", "cancel"],
  completed: ["requeue", "escalate"],
};

const actionLabel: Record<AgentAction, string> = {
  start: "Start",
  pause: "Pause",
  resume: "Resume",
  cancel: "Cancel",
  requeue: "Requeue",
  escalate: "Escalate",
};

const actionColor: Record<AgentAction, string> = {
  start: "bg-blue-600 text-white hover:bg-blue-700",
  pause: "bg-amber-500 text-black hover:bg-amber-600",
  resume: "bg-emerald-500 text-white hover:bg-emerald-600",
  cancel: "bg-red-500 text-white hover:bg-red-600",
  requeue: "bg-slate-800 text-white hover:bg-slate-900",
  escalate: "bg-violet-600 text-white hover:bg-violet-700",
};

interface AgentCardProps {
  agent: Agent;
  onAction: (agentId: string, action: AgentAction) => void;
}

export const AgentCard = ({ agent, onAction }: AgentCardProps) => {
  const actions = actionDefinitions[agent.status];

  return (
    <article className="space-y-3 rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{agent.name}</p>
          <p className="text-sm text-slate-500">{agent.summary}</p>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            statusColorMap[agent.status]
          )}
        >
          {agentStatusLabels[agent.status]}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={clsx(
            "rounded-full px-2.5 py-0.5 font-semibold tracking-tight",
            priorityColor[agent.priority]
          )}
        >
          Priority · {agent.priority}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
          Skill · {agent.skill}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
          Node · {agent.node}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
          Owner · {agent.owner}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {agent.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-200 px-2.5 py-0.5 text-slate-600"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <p>
          Last run · <span className="text-slate-800">{new Date(agent.lastRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </p>
        <p>
          Next run · <span className="text-slate-800">{new Date(agent.nextRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex gap-3">
          <span className="font-semibold text-slate-900">{agent.telemetry.success}%</span>
          <span>Succ</span>
          <span className="font-semibold text-slate-900">{agent.telemetry.failure}</span>
          <span>Fail</span>
          <span>{agent.telemetry.runTime}</span>
        </div>
        <p className="text-xs text-slate-500">Target · {agent.target}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(agent.id, action)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              actionColor[action]
            )}
          >
            {actionLabel[action]}
          </button>
        ))}
      </div>
    </article>
  );
};
