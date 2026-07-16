// Long-form CONTENT generation (Phase 3). Prompt -> outline -> a structured
// article (title + sections with markdown bodies) you can edit + regenerate per
// section, then export/publish. Runs on the selected model via completeWithFallback.
import { completeWithFallback } from "./providers/index.js";

export type Section = { id: string; heading: string; body: string };
export type Article = { title: string; subtitle?: string; sections: Section[] };
export type ContentOutline = { title: string; subtitle?: string; sections: { heading: string; intent: string }[] };

function extractJson(text: string): any {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); if (s === -1) throw new Error("no_json");
  let d = 0, inStr = false, esc = false, e = -1;
  for (let i = s; i < t.length; i++) { const c = t[i]; if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === '"') inStr = !inStr; else if (!inStr) { if (c === "{") d++; else if (c === "}") { d--; if (!d) { e = i; break; } } } }
  return JSON.parse(e === -1 ? t.slice(s) : t.slice(s, e + 1));
}
async function completeJson(args: { system: string; user: string; primary?: string; maxTokens?: number }): Promise<{ data: any; provider: string }> {
  const fb = await completeWithFallback(
    { system: args.system + "\n\nRespond with ONLY valid minified JSON matching the schema — no prose, no markdown fences.", messages: [{ role: "user", content: args.user }], maxTokens: args.maxTokens ?? 4096 },
    { primary: args.primary },
  );
  return { data: extractJson(fb.text), provider: fb.provider };
}
let _n = 0; const sid = () => `c${Date.now().toString(36)}${(_n = (_n + 1) % 1e6).toString(36)}`;

export async function generateContentOutline(prompt: string, primary?: string): Promise<ContentOutline & { _provider: string }> {
  const { data, provider } = await completeJson({
    system: "You are HUMAIN Create Studio's long-form editor. Plan a clear, logical outline (5-9 sections) for the requested article/blog/press piece. Start with an intro and end with a conclusion/CTA.",
    user: `Plan the article for:\n"""${prompt}"""\n\nReturn JSON: {"title": string, "subtitle": string, "sections": [{"heading": string, "intent": string (one line)}]}`,
    primary, maxTokens: 1200,
  });
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return { title: String(data.title || prompt).slice(0, 160), subtitle: data.subtitle ? String(data.subtitle).slice(0, 240) : undefined, sections: sections.map((s: any) => ({ heading: String(s.heading || "").slice(0, 160), intent: String(s.intent || "").slice(0, 240) })), _provider: provider };
}

export async function generateArticle(args: { prompt: string; outline?: ContentOutline; primary?: string }): Promise<Article & { _provider: string }> {
  const outlineHint = args.outline?.sections?.length
    ? `Use this approved outline (one section each, in order):\n${args.outline.sections.map((s, i) => `${i + 1}. ${s.heading} — ${s.intent}`).join("\n")}`
    : "Decide the best 5-9 section structure yourself.";
  const { data, provider } = await completeJson({
    system: "You are HUMAIN Create Studio, an expert long-form writer. Write a COMPLETE, polished, specific article with real substance (no placeholders). Each section has a heading and a well-developed body in clean MARKDOWN (paragraphs, and bullet/numbered lists where useful). Professional, on-brand, engaging.",
    user: `Write the full article for:\n"""${args.prompt}"""\n\n${outlineHint}\n\nReturn JSON: {"title": string, "subtitle": string, "sections": [{"heading": string, "body": markdown string}]}`,
    primary: args.primary, maxTokens: 8000,
  });
  const raw = Array.isArray(data.sections) ? data.sections : [];
  return { title: String(data.title || args.prompt).slice(0, 160), subtitle: data.subtitle ? String(data.subtitle).slice(0, 240) : undefined, sections: raw.map((s: any) => ({ id: sid(), heading: String(s.heading || "").slice(0, 160), body: String(s.body || "").slice(0, 6000) })), _provider: provider };
}

export async function regenerateContentSection(args: { title: string; section: Section; instruction?: string; primary?: string }): Promise<Section & { _provider: string }> {
  const { data, provider } = await completeJson({
    system: "You are HUMAIN Create Studio. Rewrite a SINGLE article section (heading + markdown body), keeping it consistent with the article. Return one section object only.",
    user: `Article: "${args.title}".\nCurrent section JSON:\n${JSON.stringify({ heading: args.section.heading, body: args.section.body })}\n\nInstruction: ${args.instruction || "Improve, tighten and make it more specific and compelling."}\n\nReturn JSON: {"heading": string, "body": markdown string}`,
    primary: args.primary, maxTokens: 2500,
  });
  return { id: args.section.id, heading: String(data.heading || args.section.heading).slice(0, 160), body: String(data.body || args.section.body).slice(0, 6000), _provider: provider };
}
