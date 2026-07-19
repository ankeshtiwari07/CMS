// Record a HITL decision (approve / reject / request_changes). Payload's
// approvals collection hooks enforce stage-role, separation-of-duties, and
// the mandatory-comment-on-rejection rule.
import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { scrub } from "@/lib/sanitize";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collection, id, stage, decision, comment } = await req.json();
  if (!collection || !id || !stage || !decision) {
    return NextResponse.json({ error: "collection, id, stage and decision are required" }, { status: 400 });
  }
  if ((decision === "reject" || decision === "request_changes") && !String(comment || "").trim()) {
    return NextResponse.json({ error: "A comment is required when rejecting or requesting changes." }, { status: 400 });
  }
  const res = await payloadFetch("/api/approvals", {
    method: "POST",
    body: JSON.stringify({ collectionSlug: collection, documentId: String(id), stage, decision, comment: comment || "" }),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.errors?.[0]?.message || data?.message || "Decision failed" }, { status: res.status });
  }
  return NextResponse.json({ ok: true, doc: scrub(data.doc ?? data) });
}

export async function GET(req: Request) {
  // Decision history for one document: /api/approvals?collection=articles&id=5
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const collection = url.searchParams.get("collection");
  const id = url.searchParams.get("id");
  if (!collection || !id) return NextResponse.json({ history: [] });
  const r = await payloadFetch(`/api/approvals?where[collectionSlug][equals]=${collection}&where[documentId][equals]=${id}&sort=-createdAt&limit=100&depth=1`);
  const j = await r.json();
  return NextResponse.json({ history: scrub(j.docs ?? []) });
}
