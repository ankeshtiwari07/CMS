import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
// Load a saved article (Project type writing) with its structured sections.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/projects/${id}?depth=0`);
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const d = await res.json();
    return NextResponse.json({ id: d.id, title: d.title, subtitle: d.asset?.subtitle, prompt: d.prompt, sections: Array.isArray(d.asset?.sections) ? d.asset.sections : [] });
  } catch { return NextResponse.json({ error: "load_failed" }, { status: 502 }); }
}
