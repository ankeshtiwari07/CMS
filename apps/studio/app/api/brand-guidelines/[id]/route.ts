import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

// GET /api/brand-guidelines/[id] — single guideline detail (Payload read access
// applies via the caller's JWT). Previously missing (405); reads had to go via
// the list endpoint (CMP-ISS-01).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/brandGuidelines/${id}?depth=0`);
  if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/brandGuidelines/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 400 });
}
