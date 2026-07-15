import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/aiwebsites/${id}?depth=0`);
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const d = await res.json();
    return NextResponse.json({ id: d.id, title: d.title, slug: d.slug, prompt: d.prompt, status: d.status, brand: d.brand, sections: Array.isArray(d.sections) ? d.sections : [], html: d.html });
  } catch { return NextResponse.json({ error: "load_failed" }, { status: 502 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await payloadFetch(`/api/aiwebsites/${id}`, { method: "DELETE" });
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 502 }); }
}
