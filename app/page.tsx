"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BoardColumn } from "@/components/BoardColumn";
import { LiveLogPanel } from "@/components/LiveLogPanel";
import { boardColumns } from "@/lib/board";
import type { Agent, AgentAction, AgentStatus } from "@/lib/mockAgents";
import { agentStatusLabels, mockAgents } from "@/lib/mockAgents";
import type { SkillSummary, ToolSummary } from "@/lib/openclaw";

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

  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentModel, setNewAgentModel] = useState("");
  const [newAgentWorkspace, setNewAgentWorkspace] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [createAgentMessage, setCreateAgentMessage] = useState<string | null>(null);
  const [createAgentError, setCreateAgentError] = useState<string | null>(null);

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

  const fetchTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError(null);
    try {
      const response = await fetch("/api/tools");
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load tools");
      }
      const payload = (await response.json()) as { tools?: ToolSummary[] };
      setTools(Array.isArray(payload.tools) ? payload.tools : []);
    } catch (error) {
      setToolsError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setToolsLoading(false);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    setSkillsLoading(true);
    setSkillsError(null);
    try {
      const response = await fetch("/api/skills");
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load skills");
      }
      const payload = (await response.json()) as { skills?: SkillSummary[] };
      setSkills(Array.isArray(payload.skills) ? payload.skills : []);
    } catch (error) {
      setSkillsError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchTools();
    fetchSkills();
    const interval = setInterval(fetchAgents, 15_000);
    return () => clearInterval(interval);
  }, [fetchAgents, fetchSkills, fetchTools]);

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

  const handleCreateAgent = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = newAgentName.trim();
      if (!name) {
        setCreateAgentError("Name is required");
        return;
      }

      setCreatingAgent(true);
      setCreateAgentMessage(null);
      setCreateAgentError(null);

      try {
        const response = await fetch("/api/agents/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            model: newAgentModel.trim() || undefined,
            workspace: newAgentWorkspace.trim() || undefined,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to create agent");
        }

        setCreateAgentMessage(`Agent created: ${name}`);
        setNewAgentName("");
        setNewAgentModel("");
        setNewAgentWorkspace("");
        fetchAgents();
      } catch (error) {
        setCreateAgentError(error instanceof Error ? error.message : "unknown error");
      } finally {
        setCreatingAgent(false);
      }
    },
    [newAgentModel, newAgentName, newAgentWorkspace, fetchAgents]
  );

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
    agents: filteredAgents.filter((agent) => column.statuses.includes(agent.status)),
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
              Monitor live work, reroute congested queues, and trigger actions directly from the board. Each column maps to a state so you can prioritize human reviews and escalations.
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

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tools</p>
                <h2 className="text-xl font-semibold text-slate-900">Available OpenClaw tools</h2>
              </div>
              <button
                type="button"
                onClick={fetchTools}
                className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {toolsLoading ? (
                <p>Loading tools…</p>
              ) : toolsError ? (
                <p className="text-rose-500">{toolsError}</p>
              ) : tools.length === 0 ? (
                <p>No tools detected.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tools.slice(0, 12).map((tool) => (
                    <li
                      key={tool.command}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {tool.command}
                      </p>
                      <p className="text-xs text-slate-500">{tool.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Skills</p>
                <button
                  type="button"
                  onClick={fetchSkills}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
                >
                  Refresh
                </button>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Installed skills</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {skillsLoading ? (
                  <p>Loading skills…</p>
                ) : skillsError ? (
                  <p className="text-rose-500">{skillsError}</p>
                ) : skills.length === 0 ? (
                  <p>No skills detected.</p>
                ) : (
                  <ul className="max-h-[320px] space-y-2 overflow-y-auto">
                    {skills.slice(0, 10).map((skill) => (
                      <li key={skill.name} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <span>{skill.emoji ?? "🧠"}</span>
                          <span>{skill.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] ${
                              skill.eligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {skill.eligible ? "Ready" : "Missing"
                            }
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{skill.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Create an agent</p>
              <h3 className="mt-1 text-lg font-semibold">Spin up a new agent</h3>
              <form onSubmit={handleCreateAgent} className="mt-4 space-y-3">
                <label className="block text-xs uppercase tracking-[0.3em] text-slate-300">
                  Name
                  <input
                    value={newAgentName}
                    onChange={(event) => setNewAgentName(event.target.value)}
                    placeholder="agent-name"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  />
                </label>
                <label className="block text-xs uppercase tracking-[0.3em] text-slate-300">
                  Model (optional)
                  <input
                    value={newAgentModel}
                    onChange={(event) => setNewAgentModel(event.target.value)}
                    placeholder="model id"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  />
                </label>
                <label className="block text-xs uppercase tracking-[0.3em] text-slate-300">
                  Workspace path (optional)
                  <input
                    value={newAgentWorkspace}
                    onChange={(event) => setNewAgentWorkspace(event.target.value)}
                    placeholder="/absolute/path/to/workspace"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={creatingAgent || !newAgentName.trim()}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingAgent ? "Creating…" : "Create agent"}
                </button>
              </form>
              {createAgentMessage && (
                <p className="mt-2 text-xs text-emerald-200">{createAgentMessage}</p>
              )}
              {createAgentError && (
                <p className="mt-2 text-xs text-rose-200">{createAgentError}</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
