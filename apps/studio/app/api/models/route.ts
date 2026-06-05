import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

// Proxies the ai-service model catalog so the Studio model picker knows which
// models exist and which are configured (have their API key set).
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${AI_URL}/models`, { cache: "no-store" });
    if (!res.ok) throw new Error("models unavailable");
    const data = await res.json();
    return NextResponse.json({ models: data.models ?? [] });
  } catch {
    // Fallback so the picker still works if ai-service is unreachable.
    return NextResponse.json({
      models: [
        { id: "claude-opus-4-8", label: "Claude Opus 4.8", family: "Claude", fast: false, configured: true },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", family: "Claude", fast: true, configured: true },
      ],
    });
  }
}
