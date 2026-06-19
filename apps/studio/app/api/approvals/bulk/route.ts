// Bulk HITL decisions — apply one decision to many items at once (high-volume,
// low-risk content). Each item still creates its own immutable approval record
// and passes every per-item rule (stage-role, separation of duties, delegation).
import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const decisions: any[] = Array.isArray(body?.decisions) ? body.decisions : [];
  if (!decisions.length) return NextResponse.json({ error: "No items selected" }, { status: 400 });
  if (decisions.length > 100) return NextResponse.json({ error: "Too many items (max 100)" }, { status: 400 });

  const results = await Promise.all(
    decisions.map(async (d) => {
      const { collection, id, stage, decision, comment } = d || {};
      if (!collection || !id || !stage || !decision) return { id, collection, ok: false, error: "missing fields" };
      if ((decision === "reject" || decision === "request_changes") && !String(comment || "").trim()) {
        return { id, collection, ok: false, error: "comment required to reject" };
      }
      try {
        const res = await payloadFetch("/api/approvals", {
          method: "POST",
          body: JSON.stringify({ collectionSlug: collection, documentId: String(id), stage, decision, comment: comment || "" }),
        });
        const j = await res.json();
        if (!res.ok) return { id, collection, ok: false, error: j?.errors?.[0]?.message || j?.message || "failed" };
        return { id, collection, ok: true };
      } catch {
        return { id, collection, ok: false, error: "network" };
      }
    }),
  );
  const ok = results.filter((r) => r.ok).length;
  return NextResponse.json({ ok: true, applied: ok, failed: results.length - ok, results });
}
