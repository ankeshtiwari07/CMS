// Load, update (save turns / rename / pin), or delete a single conversation.
// All three are owner-scoped in the CMS, so a user can only touch their own
// threads — the JWT is forwarded by payloadFetch.
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/conversations/${id}?depth=0`);
  if (!res.ok) return Response.json({ error: "not_found" }, { status: res.status });
  const d = await res.json();
  return Response.json({
    id: d.id,
    title: d.title,
    mode: d.mode,
    model: d.model,
    messages: d.messages ?? [],
    pinned: !!d.pinned,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 120);
  if (body.messages !== undefined) patch.messages = body.messages;
  if (body.mode !== undefined) patch.mode = body.mode;
  if (body.model !== undefined) patch.model = body.model;
  if (body.pinned !== undefined) patch.pinned = !!body.pinned;
  if (body.archived !== undefined) patch.archived = !!body.archived;
  const res = await payloadFetch(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!res.ok) return Response.json({ error: "update_failed" }, { status: res.status });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) return Response.json({ error: "delete_failed" }, { status: res.status });
  return Response.json({ ok: true });
}
