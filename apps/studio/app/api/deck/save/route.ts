import { NextResponse } from "next/server";
import { getCurrentUser, payloadFetch } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/deck/save — create or update a persisted deck in the CMS.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const doc = {
    title: String(body?.title || "Untitled Deck").slice(0, 160),
    subtitle: body?.subtitle ? String(body.subtitle).slice(0, 240) : undefined,
    prompt: body?.prompt ? String(body.prompt).slice(0, 4000) : undefined,
    theme: body?.theme || "midnight",
    status: body?.status || "draft",
    outline: body?.outline ?? undefined,
    slides: Array.isArray(body?.slides) ? body.slides : [],
  };
  try {
    const isUpdate = Boolean(body?.id);
    const res = await payloadFetch(isUpdate ? `/api/decks/${body.id}` : "/api/decks", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(doc),
    });
    const j = await res.json();
    if (!res.ok) return NextResponse.json({ error: j?.errors?.[0]?.message || "save_failed" }, { status: 502 });
    const deckId = j?.doc?.id ?? body?.id;
    // Also record it in Projects (as a DECK artifact) so it shows on the Projects
    // page alongside websites/writing. Best-effort; only on first save.
    if (!isUpdate) {
      try {
        await payloadFetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: doc.title,
            type: "deck",
            prompt: doc.prompt,
            status: "ready",
            asset: { deckId, theme: doc.theme, slides: doc.slides, slideCount: Array.isArray(doc.slides) ? doc.slides.length : 0 },
            owner: user.id,
          }),
        });
      } catch { /* non-fatal */ }
    }
    return NextResponse.json({ id: deckId, ok: true });
  } catch {
    return NextResponse.json({ error: "save_unavailable" }, { status: 502 });
  }
}
