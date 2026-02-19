import { NextResponse, type NextRequest } from "next/server";
import { createAgent } from "@/lib/openclaw";

export async function POST(request: NextRequest) {
  let payload: { name?: string; workspace?: string; model?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = payload?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Agent name is required" }, { status: 400 });
  }

  try {
    const output = await createAgent({
      name,
      workspace: payload.workspace?.trim() || undefined,
      model: payload.model?.trim() || undefined,
    });

    return NextResponse.json({ success: true, output });
  } catch (error) {
    const message = (error as Error)?.message ?? "Failed to create agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
