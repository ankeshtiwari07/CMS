import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

// Poll a text-to-video render job.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(`${AI_URL}/video/status/${encodeURIComponent(id)}`, { cache: "no-store" });
    return NextResponse.json(await res.json(), { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ configured: false, status: "failed", message: "Video service unavailable." }, { status: 502 });
  }
}
