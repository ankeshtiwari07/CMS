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
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, prompt, options, fast } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  let gen: Response;
  try {
    gen = await fetch(`${AI_URL}/studio/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, prompt, options, fast }),
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
        title: String(prompt).slice(0, 60) || "Untitled",
        type: TYPE_MAP[mode] ?? "writing",
        prompt,
        options,
        asset: { text: data.artifact, preview: Boolean(data.preview) },
        status: "ready",
        owner: user.id,
      }),
    });
  } catch {
    /* non-fatal: generation still returned */
  }

  return NextResponse.json({ ok: true, artifact: data.artifact, preview: Boolean(data.preview) });
}
