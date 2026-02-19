"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardColumn } from "@/components/BoardColumn";
import { LiveLogPanel } from "@/components/LiveLogPanel";
import { boardColumns } from "@/lib/board";
import type { Agent, AgentAction, AgentStatus } from "@/lib/mockAgents";
import { agentStatusLabels, mockAgents } from "@/lib/mockAgents";

const priorityOptions = ["all", "Low", "Medium", "High", "Critical"] as const;

const buildColumnStatusMap = () => {
  return boardColumns.reduce<Record<string, AgentStatus>>((acc, column) => {
    if (column.statuses.length > 0) {
      acc[column.id] = column.statuses[0];
    }
    return acc;
  }, {});
};

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [nodeFilter, setNodeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);

  const columnStatusMap = useMemo(() => buildColumnStatusMap(), []);

  const fetchAgents = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/agents");
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load agents");
      }

      const payload = (await response.json()) as { agents?: Agent[] };
      const normalized = (
        Array.isArray(payload.agents)
          ? payload.agents
          : Array.isArray(payload)
          ? payload
          : []
      ) as Agent[];

      if (normalized.length) {
        setAgents(normalized);
        setLiveMode(true);
        setErrorMessage(null);
      }

      setLastRefresh(new Date());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setLiveMode(false);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15_000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const handleAgentAction = useCallback(
    async (agentId: string, action: AgentAction) => {
      setActionStatus(`Sending ${action} to ${agentId}...`);
      try {
        const response = await fetch(`/api/agents/${agentId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Action failed");
        }

        await response.json();
        setActionStatus(`Action queued: ${action}`);
        await fetchAgents();
      } catch (error) {
        setActionStatus(
          `Failed to ${action}: ${error instanceof Error ? error.message : "unknown"}`
        );
      }
    },
    [fetchAgents]
  );

  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchAgents();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
    const targetStatus = columnStatusMap[over.id as string];
    if (!targetStatus) return;

    setAgents((current) =>
      current.map((agent) =>
        agent.id === active.id
          ? {
              ...agent,
              status: targetStatus,
            }
          : agent
      )
    );
  };

  const skillOptions = useMemo(
    () => ["all", ...Array.from(new Set(agents.map((agent) => agent.skill))).sort()],
    [agents]
  );

  const nodeOptions = useMemo(
    () => ["all", ...Array.from(new Set(agents.map((agent) => agent.node))).sort()],
    [agents]
  );

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return agents.filter((agent) => {
      if (skillFilter !== "all" && agent.skill !== skillFilter) return false;
      if (nodeFilter !== "all" && agent.node !== nodeFilter) return false;
      if (priorityFilter !== "all" && agent.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && agent.status !== statusFilter) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        agent.name,
        agent.summary,
        agent.skill,
        agent.owner,
        agent.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [agents, searchTerm, skillFilter, nodeFilter, priorityFilter, statusFilter]);

  const columns = boardColumns.map((column) => ({
    ...column,
    agents: filteredAgents.filter((agent) =>
      column.statuses.includes(agent.status)
    ),
  }));

  const runningCount = agents.filter((agent) => agent.status === "running").length;
  const completedCount = agents.filter((agent) => agent.status === "completed").length;
  const pausedCount = agents.filter((agent) => agent.status === "paused").length;
  const criticalAgents = agents.filter((agent) => agent.priority === "Critical").length;
  const totalAgents = agents.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:px-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Agent Tracker · OpenClaw
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Kanban control center for every agent.
            </h1>
            <p className="max-w-2xl text-base text-slate-600">
              Monitor live work, reroute congested queues, and trigger actions directly from
              the board. Each column maps to a state so you can prioritize human reviews and escalations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refresh snapshot
            </button>
            <p className="text-sm text-slate-500">
              Last refreshed at {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{liveMode ? "Live OpenClaw stream" : "Using cached mock data"}</span>
            {isFetching && <span>Refreshing…</span>}
            {errorMessage && <span className="text-rose-500">{errorMessage}</span>}
            {actionStatus && <span className="text-slate-600">{actionStatus}</span>}
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Running</p>
              <p className="text-2xl font-semibold text-slate-900">{runningCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Paused</p>
              <p className="text-2xl font-semibold text-slate-900">{pausedCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Completed</p>
              <p className="text-2xl font-semibold text-slate-900">{completedCount}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{totalAgents} total agents</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden />
            <span>{criticalAgents} critical</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden />
            <span>{filteredAgents.length} cards matching filters</span>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Search</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="agent name, owner, tags"
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Skill / Squad</span>
              <select
                value={skillFilter}
                onChange={(event) => setSkillFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {skillOptions.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill === "all" ? "All skills" : skill}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Node</span>
              <select
                value={nodeFilter}
                onChange={(event) => setNodeFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {nodeOptions.map((node) => (
                  <option key={node} value={node}>
                    {node === "all" ? "All nodes" : node}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Priority</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority === "all" ? "All priorities" : priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AgentStatus | "all")
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="all">All states</option>
                {Object.entries(agentStatusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-6">
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid gap-5 lg:grid-cols-5">
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  agents={column.agents}
                  onAction={handleAgentAction}
                />
              ))}
            </div>
          </DndContext>
        </section>

        <section>
          <LiveLogPanel />
        </section>
      </main>
    </div>
  );
}
