import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";
import { scrub } from "@/lib/sanitize";

// Update a project (e.g. rename / edit stored text).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const res = await payloadFetch(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  const out = await res.json();
  if (!res.ok) return NextResponse.json({ error: out?.errors?.[0]?.message || "Update failed" }, { status: res.status });
  return NextResponse.json({ ok: true, project: scrub(out?.doc ?? out) });
}

// Delete a project.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const out = await res.json().catch(() => ({}));
    return NextResponse.json({ error: out?.errors?.[0]?.message || "Delete failed" }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
