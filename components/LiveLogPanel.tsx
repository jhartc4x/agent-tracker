"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { mockAgents } from "@/lib/mockAgents";

const templates = [
  "{agent} reported telemetry stable on {target}.",
  "{agent} spotted anomalous latency on {target} and is escalating.",
  "{agent} completed a run and emitted {event}.",
  "{agent} is waiting on external approval for {target}.",
  "{agent}'s job stalled, retrying after {delay}.",
  "{agent} synced memory with {owner} at {timestamp}.",
];

const fillerEvents = ["sequence 12", "policy refresh", "service restart", "batch cleanup"];
const delayValues = ["30s", "1m", "45s", "20s"];

interface LogEntry {
  id: string;
  timestamp: Date;
  agent: string;
  status: string;
  text: string;
}

const buildEntry = (): LogEntry => {
  const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const event = fillerEvents[Math.floor(Math.random() * fillerEvents.length)];
  const delay = delayValues[Math.floor(Math.random() * delayValues.length)];
  const timestamp = new Date();

  const text = template
    .replace("{agent}", agent.name)
    .replace("{target}", agent.target)
    .replace("{owner}", agent.owner)
    .replace("{event}", event)
    .replace("{delay}", delay)
    .replace("{timestamp}", timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    timestamp,
    agent: agent.name,
    status: agent.status,
    text,
  };
};

const initialLogEntries: LogEntry[] = Array.from({ length: 6 }, () => buildEntry());

export const LiveLogPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogEntries);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, buildEntry()];
        return next.slice(-20);
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [isPaused]);

  const groupedLogs = useMemo(() => {
    return Array.from(logs).reverse();
  }, [logs]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live log</p>
          <p className="text-lg font-semibold text-slate-900">Agent activity stream</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Streaming</span>
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              isPaused ? "bg-amber-400" : "bg-emerald-500"
            )}
          />
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
            onClick={() => setIsPaused((prev) => !prev)}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </header>
      <div className="mt-4 flex h-64 flex-col gap-3 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-600">
        {groupedLogs.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-slate-50/90 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {entry.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="capitalize">{entry.status}</span>
            </div>
            <p className="text-slate-800">{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
