import { NextResponse } from "next/server";
import { listSkills } from "@/lib/openclaw";

export async function GET() {
  try {
    const skills = await listSkills();
    return NextResponse.json({ skills });
  } catch (error) {
    const message = (error as Error)?.message ?? "Failed to list skills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
