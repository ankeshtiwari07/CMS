// POST /api/humain/events — inbound webhook receiver for HUMAIN Create events
// (e.g. generation.completed → auto-ingest into the CMS library). HMAC-verified.
import { NextResponse } from "next/server";
import { verifyHmac, tenantOf, serviceFetch } from "@/lib/humain";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyHmac(raw, req.headers.get("x-humain-signature"))) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const tenant = tenantOf(req);

  // React to known event types. generation.completed → mirror into the library.
  if (ev.type === "generation.completed" && ev.data) {
    const g = ev.data;
    const doc = { title: g.title || "HUMAIN Create generation", type: g.type || "content", tenant, prompt: g.prompt || "", model: g.model || "humain-gateway", options: { tenant, source: "humain-create", externalId: ev.id ?? g.id ?? null }, asset: g.asset ?? g.output ?? {}, status: "ready" };
    await serviceFetch("/api/projects", { method: "POST", body: JSON.stringify(doc) }).catch(() => {});
  }
  return NextResponse.json({ ok: true, received: ev.type || "event", tenant });
}
