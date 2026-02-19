"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Agent, AgentAction } from "@/lib/mockAgents";
import { AgentCard } from "./AgentCard";

interface DraggableAgentCardProps {
  agent: Agent;
  onAction: (agentId: string, action: AgentAction) => void;
}

export const DraggableAgentCard = ({ agent, onAction }: DraggableAgentCardProps) => {
  const { attributes, listeners, isDragging, setNodeRef, transform } = useDraggable({
    id: agent.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <div className={isDragging ? "pointer-events-none" : ""}>
        <AgentCard agent={agent} onAction={onAction} />
      </div>
    </div>
  );
};
