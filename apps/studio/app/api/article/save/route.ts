import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
// Save a generated article as a Project (type "writing"), storing the assembled markdown.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const md = Array.isArray(body?.sections) ? body.sections.map((s: any) => `## ${s.heading}\n\n${s.body}`).join("\n\n") : String(body?.text || "");
  const doc = { title: String(body?.title || "Untitled Article").slice(0, 160), type: "writing", prompt: body?.prompt ? String(body.prompt).slice(0, 4000) : undefined, status: "ready", asset: { text: md, sections: body?.sections, subtitle: body?.subtitle }, owner: user.id };
  try {
    const isUpdate = Boolean(body?.id);
    const res = await payloadFetch(isUpdate ? `/api/projects/${body.id}` : "/api/projects", { method: isUpdate ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(doc) });
    const j = await res.json(); if (!res.ok) return NextResponse.json({ error: j?.errors?.[0]?.message || "save_failed" }, { status: 502 });
    return NextResponse.json({ id: j?.doc?.id ?? body?.id, ok: true });
  } catch { return NextResponse.json({ error: "save_unavailable" }, { status: 502 }); }
}
