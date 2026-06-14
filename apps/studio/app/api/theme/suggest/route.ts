// Prompt-driven, agent-governed theme generation. The user describes the look &
// feel; the design agent returns a complete, validated theme (colours, font,
// radius, mode) that the builder applies live.
import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { prompt, brand } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Describe the look & feel you want." }, { status: 400 });
  const input = brand ? `${prompt}\n\nActive brand colours to harmonise with: ${brand}` : prompt;
  try {
    const res = await fetch(`${AI_URL}/run`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ promptId: "theme@v1", input }),
    });
    const d = await res.json();
    if (d.ok) return NextResponse.json({ ok: true, theme: d.data });
    return NextResponse.json({ ok: false, error: d.error || "theme_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach the generation service." }, { status: 502 });
  }
}
