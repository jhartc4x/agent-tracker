import { NextResponse } from "next/server";
import { listAgents } from "@/lib/openclaw";

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    const message = (error as Error)?.message ?? "Failed to list agents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
