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

const trim = (value: string, length: number) =>
  value.length <= length ? value : `${value.slice(0, length).trim()}…`;

export const AgentCard = ({ agent, onAction }: AgentCardProps) => {
  const actions = actionDefinitions[agent.status];
  const summary = trim(agent.summary, 90);

  return (
    <article className="space-y-3 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-white/90 to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{agent.name}</p>
          <p className="text-sm text-slate-500">{summary}</p>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]",
            statusColorMap[agent.status]
          )}
        >
          {agentStatusLabels[agent.status]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <p>Priority · {agent.priority}</p>
        <p>Skill · {agent.skill}</p>
        <p>Node · {agent.node}</p>
        <p>Owner · {agent.owner}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
        <p>Last run · {new Date(agent.lastRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <p>Next run · {new Date(agent.nextRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <p>Target · {agent.target}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <div className="flex gap-1">
          <span className="font-semibold text-slate-900">{agent.telemetry.success}%</span>
          <span>succ</span>
          <span className="font-semibold text-slate-900">{agent.telemetry.failure}</span>
          <span>fail</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
          {agent.telemetry.runTime}
        </span>
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
