import { NextResponse } from "next/server";
import { listTools } from "@/lib/openclaw";

export async function GET() {
  try {
    const tools = await listTools();
    return NextResponse.json({ tools });
  } catch (error) {
    const message = (error as Error)?.message ?? "Failed to list tools";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
