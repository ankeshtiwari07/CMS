// Agentic content prefill: given a content type + its fields, the drafting
// agent proposes on-brand draft values the author then reviews/edits.
import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!Array.isArray(body?.fields) || !body.fields.length) {
    return NextResponse.json({ error: "No fields to draft" }, { status: 400 });
  }

  // Ground in the active brand (best-effort).
  let brand = "";
  try {
    const r = await payloadFetch(`/api/brandGuidelines?where[isActive][equals]=true&limit=1&depth=0`);
    const j = await r.json();
    const b = j.docs?.[0];
    if (b) brand = `${b.name}${b.summary ? ` — ${b.summary}` : ""}${b.industry ? ` (industry: ${b.industry})` : ""}`;
  } catch {}

  // Accept `instruction` as an alias for `brief` so a caller's explicit topic
  // instruction actually reaches the drafting agent (MC-ISS-03) — the ai-service
  // keys off `brief`, and an unrecognised `instruction` was being dropped.
  const brief = body.brief || body.instruction || "";
  // Normalise the request to the ai-service contract so a valid call never 500s
  // on a shape mismatch (MC-BUG-01): fields may arrive as strings; coerce to
  // {name,label} objects and ensure a typeLabel is always present.
  const fields = body.fields.map((f: any) =>
    typeof f === "string"
      ? { name: f, label: f.charAt(0).toUpperCase() + f.slice(1) }
      : { name: String(f?.name || ""), label: String(f?.label || f?.name || ""), type: f?.type },
  );
  const typeLabel = String(body.typeLabel || body.slug || "Content").slice(0, 120);
  try {
    const res = await fetch(`${AI_URL}/content/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, typeLabel, fields, brief, brand }),
    });
    const d = await res.json();
    if (!res.ok || d.ok === false) {
      return NextResponse.json({ error: d.error || "suggest_failed" }, { status: res.status === 200 ? 502 : res.status });
    }
    return NextResponse.json({ ok: true, data: d.data ?? {} });
  } catch {
    return NextResponse.json({ error: "Could not reach the generation service." }, { status: 502 });
  }
}
