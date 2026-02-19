"use client";

import type { AgentAction, Agent } from "@/lib/mockAgents";
import { AgentCard } from "./AgentCard";
import type { BoardColumnConfig } from "@/lib/board";

interface BoardColumnProps {
  column: BoardColumnConfig;
  agents: Agent[];
  onAction: (agentId: string, action: AgentAction) => void;
}

export const BoardColumn = ({ column, agents, onAction }: BoardColumnProps) => {
  return (
    <section className="flex min-h-[280px] flex-1 flex-col gap-4 rounded-[2rem] border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {column.title}
          </p>
          <p className="text-sm text-slate-400">{column.subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{agents.length} cards</span>
      </header>
      <div className="flex flex-1 flex-col gap-3">
        {agents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Waiting for agents to land here.
          </div>
        ) : (
          agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onAction={onAction} />
          ))
        )}
      </div>
    </section>
  );
};
