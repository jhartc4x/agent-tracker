import { NextResponse, type NextRequest } from "next/server";
import { controlAgent } from "@/lib/openclaw";
import type { AgentAction } from "@/lib/mockAgents";

const allowedActions: Set<AgentAction> = new Set([
  "start",
  "pause",
  "resume",
  "cancel",
  "requeue",
  "escalate",
]);

export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  const agentId = params.agentId;
  if (!agentId) {
    return NextResponse.json({ error: "Missing agent ID" }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = body?.action as AgentAction | undefined;
  if (!action || !allowedActions.has(action)) {
    return NextResponse.json({ error: "Invalid or missing action" }, { status: 400 });
  }

  try {
    const output = await controlAgent(agentId, action);
    return NextResponse.json({ success: true, output });
  } catch (error) {
    const message = (error as Error)?.message ?? "Failed to run action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
