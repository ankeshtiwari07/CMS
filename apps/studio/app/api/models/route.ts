import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

// Proxies the ai-service model catalog so the Studio model picker knows which
// models exist, which are configured (API key set), and which are actually
// HEALTHY (reachable). Also surfaces the provider that will really answer
// (`effectiveProvider`) and whether the default model is degraded, so the picker
// can honestly show when a chosen/default model is down and requests fall back.
export async function GET(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const probe = new URL(req.url).searchParams.get("probe");
  try {
    const qs = probe ? `?probe=${encodeURIComponent(probe)}` : "";
    const res = await fetch(`${AI_URL}/models${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error("models unavailable");
    const data = await res.json();
    return NextResponse.json({
      models: data.models ?? [],
      effectiveProvider: data.effectiveProvider ?? null,
      effectiveModel: data.effectiveModel ?? null,
      degraded: Boolean(data.degraded),
      defaultModelId: data.defaultModelId ?? null,
    });
  } catch {
    // ai-service unreachable: report unknown health rather than pretending models
    // are configured/healthy (do not falsely claim any provider is up).
    return NextResponse.json({
      models: [],
      effectiveProvider: null,
      degraded: true,
      error: "model catalog unavailable",
    });
  }
}
