// Per-user chat history. List the signed-in user's conversations (topics) and
// create a new one. Owner scoping + RBAC are enforced by the Conversations
// collection access control (ownScoped) in the CMS — this route just proxies
// the session JWT, so a user only ever sees their own threads.
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const res = await payloadFetch(
    "/api/conversations?sort=-updatedAt&depth=0&limit=100&where[archived][not_equals]=true",
  );
  if (!res.ok) return Response.json({ conversations: [] });
  const data = await res.json();
  const conversations = (data.docs ?? []).map((d: any) => ({
    id: d.id,
    title: d.title,
    mode: d.mode,
    pinned: !!d.pinned,
    updatedAt: d.updatedAt,
  }));
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "New chat").slice(0, 120);
  const res = await payloadFetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify({
      title,
      messages: body.messages ?? [],
      mode: body.mode ?? "auto",
      model: body.model ?? null,
    }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return Response.json({ error: d?.errors?.[0]?.message || "create_failed" }, { status: 400 });
  }
  const data = await res.json();
  return Response.json({ id: data.doc?.id, title: data.doc?.title });
}
