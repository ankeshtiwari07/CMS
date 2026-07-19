import { NextResponse } from "next/server";
import { AI_URL } from "@/lib/env";
import { getCurrentUser } from "@/lib/payload";

// Map a heading to a section type for consistent icons/ordering.
function typeFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("essence")) return "essence";
  if (t.includes("position")) return "positioning";
  if (t.includes("personality") || t.includes("values")) return "personality";
  if (t.includes("voice") || t.includes("tone")) return "voice";
  if (t.includes("messag") || t.includes("pillar")) return "messaging";
  if (t.includes("color") || t.includes("palette")) return "palette";
  if (t.includes("typograph") || t.includes("font")) return "typography";
  if (t.includes("logo")) return "logo";
  if (t.includes("imagery") || t.includes("art direction") || t.includes("photograph")) return "imagery";
  if (t.includes("icon")) return "iconography";
  if (t.includes("application") || t.includes("example")) return "applications";
  return "section";
}

// Parse markdown into { sections, palette } — split on # / ## / ### headings and
// bold "**Heading**" lines; pull hex codes out of the color section into a palette.
// Detect a section heading. Accepts real markdown headings (`## Title`) AND a
// WHOLE-LINE bold/underline heading (`**Color palette**`, `__Voice & tone__`,
// optional trailing colon) — models frequently structure guidelines with bold
// headings instead of `#`. Inline bold inside a paragraph is NOT treated as a
// heading (the whole line must be the bold run), and long/sentence-like bold
// lines are rejected so body emphasis doesn't create spurious sections.
function headingOf(line: string): string | null {
  const md = line.match(/^#{1,4}\s+(.*)$/);
  if (md) return md[1];
  const bold = line.match(/^\s*(?:\*\*|__)\s*(.{1,60}?)\s*(?:\*\*|__)\s*:?\s*$/);
  if (bold && !/[.!?]$/.test(bold[1].trim())) return bold[1];
  return null;
}

// Extract "Label #RRGGBB" (or #RGB) pairs from a block of text into a palette.
function extractHex(content: string, into: { name: string; hex: string }[]) {
  const re = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const idx = content.lastIndexOf("\n", m.index);
    const label =
      content
        .slice(idx + 1, m.index)
        .replace(/[-*:•\s]+$/, "")
        .replace(/^[-*•\s]+/, "")
        .slice(0, 40) || "Color";
    let hex = m[1].toUpperCase();
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join(""); // #abc -> #AABBCC
    into.push({ name: label, hex: `#${hex}` });
  }
}

function parse(md: string) {
  const lines = md.split("\n");
  const sections: { id: string; type: string; title: string; content: string }[] = [];
  let cur: { title: string; buf: string[] } | null = null;
  const flush = () => {
    if (cur && (cur.title || cur.buf.join("").trim())) {
      const content = cur.buf.join("\n").trim();
      const type = typeFor(cur.title);
      sections.push({ id: `${type}-${sections.length}`, type, title: cur.title || "Section", content });
    }
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const title = headingOf(line);
    if (title !== null) { flush(); cur = { title: title.replace(/\*\*/g, "").replace(/[:#]+$/, "").trim(), buf: [] }; }
    else { if (!cur) cur = { title: "Overview", buf: [] }; cur.buf.push(line); }
  }
  flush();
  // Drop the leading title-only section (doc title with no body) and any empties.
  while (sections.length && !sections[0].content.trim()) sections.shift();
  // Pull hex colors out of the palette section(s); if none surfaced (e.g. the
  // model kept colours in prose), fall back to scanning ALL sections so the
  // palette is never silently empty when hex codes exist (BR-ISS-01).
  const palette: { name: string; hex: string }[] = [];
  for (const s of sections) if (s.type === "palette") extractHex(s.content, palette);
  if (!palette.length) for (const s of sections) extractHex(s.content, palette);
  // Dedupe by hex (keep first label) and cap.
  const seen = new Set<string>();
  const deduped = palette.filter((p) => (seen.has(p.hex) ? false : (seen.add(p.hex), true))).slice(0, 12);
  return { sections, palette: deduped };
}

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { industry, audience, tone, notes, model } = await req.json();
  const prompt =
    `Create a brand guideline for a brand in the "${industry || "technology"}" industry. ` +
    `Target audience: ${audience || "enterprise decision-makers"}. Desired tone: ${tone || "confident and modern"}. ` +
    (notes ? `Additional context: ${notes}. ` : "") +
    `Be specific and usable, with concrete hex codes and font names.`;
  try {
    const res = await fetch(`${AI_URL}/studio/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "brandGuideline", prompt, model }),
    });
    const data = await res.json();
    const artifact: string = data.artifact || "";
    if (!artifact || artifact.startsWith("⚠️") || artifact.startsWith("⚙️")) {
      return NextResponse.json({ ok: false, message: artifact || "Generation unavailable." });
    }
    const { sections, palette } = parse(artifact);
    return NextResponse.json({
      ok: true,
      guideline: {
        name: `${industry || "Brand"} guideline`,
        industry: industry || "",
        summary: `AI-tailored for ${audience || "your audience"} — ${tone || "confident"} tone.`,
        source: "ai",
        sections,
        palette,
      },
      modelLabel: data.modelLabel,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not reach the generation service." }, { status: 502 });
  }
}
