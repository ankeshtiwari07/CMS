// Studio generation: authenticated proxy to the AI service, then persists the
// result as a Project asset (best-effort) using the caller's session.
import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

const TYPE_MAP: Record<string, string> = {
  writing: "writing",
  image: "image",
  website: "website",
  email: "email",
  translation: "translation",
  brand: "brand",
  designSystem: "designSystem",
  deck: "deck",
  event: "event",
  webinar: "webinar",
  campaign: "campaign",
  brandGuideline: "brandGuideline",
  websiteBuild: "websiteBuild",
  video: "video",
  conference: "conference",
  summit: "summit",
};

const clean = (s: string) =>
  String(s || "").replace(/<[^>]+>/g, "").replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim();

// Generic section labels that make poor titles (esp. video: Logline, Script…).
const GENERIC = /^(logline|overview|concept|concept & tone|title|introduction|summary|brand essence|tagline|subject|target duration|duration|script|shot list|storyboard|storyboard notes|music|music & pacing|pacing|video prompt|english|arabic|who it'?s for|learning outcomes|agenda|run.?of.?show|positioning|personality|voice|values)\b/i;

// Last meaningful line of the prompt (skips any brand preamble / leading context).
function promptTail(prompt: string): string {
  const pl = String(prompt || "").split("\n").map(clean).filter(Boolean);
  return (pl[pl.length - 1] || "Untitled").slice(0, 80);
}

// Derive a clean project title from the generated output (heading / <title> /
// first real line), falling back to the meaningful tail of the prompt.
function deriveTitle(artifact: string, mode: string, prompt: string): string {
  const text = String(artifact || "");
  // Error / not-configured artifacts shouldn't become the title.
  if (/^\s*[⚠⚙]/.test(text)) return promptTail(prompt);
  if (mode === "websiteBuild" || /^\s*<!doctype/i.test(text)) {
    const t = text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    if (t && clean(t)) return clean(t).slice(0, 80);
  }
  const lines = text.split("\n").map(clean).filter(Boolean);
  const headings = text.split("\n").map((l) => l.match(/^\s*#{1,3}\s+(.+)$/)?.[1]).filter(Boolean).map((s) => clean(s!));
  // A non-generic first heading is the document title (articles, events, brand…).
  if (headings[0] && !GENERIC.test(headings[0])) return headings[0].slice(0, 80);
  // Otherwise the doc is section-first (e.g. video) — use the first real sentence.
  for (const l of lines) if (!GENERIC.test(l) && l.length > 8) return l.slice(0, 80);
  if (headings[0]) return headings[0].slice(0, 80);
  return promptTail(prompt);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, prompt, options, fast, model, history } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  let gen: Response;
  try {
    gen = await fetch(`${AI_URL}/studio/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, prompt, options, fast, model, history }),
    });
  } catch {
    return NextResponse.json({ error: "generation_unavailable" }, { status: 502 });
  }
  if (!gen.ok) return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  const data = await gen.json();

  // Persist as a typed project asset (ready to promote into CMS collections).
  try {
    await payloadFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        title: deriveTitle(data.artifact, mode, prompt),
        type: TYPE_MAP[mode] ?? "writing",
        prompt,
        model: data.modelLabel || model,
        options,
        asset: { text: data.artifact, preview: Boolean(data.preview), html: Boolean(data.html), video: Boolean(data.video), videoPrompt: data.videoPrompt },
        status: "ready",
        owner: user.id,
      }),
    });
  } catch {
    /* non-fatal: generation still returned */
  }

  return NextResponse.json({
    ok: true,
    artifact: data.artifact,
    preview: Boolean(data.preview),
    html: Boolean(data.html),
    video: Boolean(data.video),
    videoPrompt: data.videoPrompt,
    renderPending: Boolean(data.renderPending),
    model: data.model,
    modelLabel: data.modelLabel,
  });
}
