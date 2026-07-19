// Read / update / delete a single library component, proxying to Payload.
import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

// GET /api/components/[id] — single-component detail for any authenticated user
// (Payload read access still applies via the caller's JWT). Previously missing,
// so single-item reads 405'd and callers had to scan the list endpoint (CMP-ISS-01).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/components/${id}?depth=0`);
  if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!hasRole(user, ["admin"])) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const res = await payloadFetch(`/api/components/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!hasRole(user, ["admin"])) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  const res = await payloadFetch(`/api/components/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
