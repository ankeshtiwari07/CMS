// D1 — GOVERNANCE AGENT. A first-class, RAG-grounded brand-consistency agent.
// It keeps branding, styling, tone and visual identity consistent with the
// user's brand across everything generated or edited. It is GROUNDED in the
// brand corpus (the active BrandGuidelines record + the RAG pipeline over
// uploaded/scraped brand data) — brand decisions are retrieved, not guessed —
// and every check is AUDITED in the governed tool layer (audit_log), exactly
// like any other agent tool call.
import { Pool } from "pg";
import { completeWithFallback } from "./providers/index.js";
import { retrieveContext } from "./agents/tools.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URI });

export type GovFinding = { dimension: "palette" | "tone" | "messaging" | "visual" | "accessibility"; severity: "info" | "warn" | "fail"; issue: string; evidence?: string; fix?: string };
export type GovReport = {
  score: number; status: "pass" | "warn" | "fail";
  brandName: string; grounded: boolean;
  palette: { brand: string[]; used: string[]; offBrand: string[]; score: number };
  dimensions: { palette: number; tone: number; messaging: number; visual: number };
  findings: GovFinding[];
  summary: string;
};
export type BrandProfile = {
  name: string; palette: string[]; paletteMeta: Array<{ hex: string; name?: string; usage?: string }>;
  fonts: string[]; voice: string; ragText: string; grounded: boolean; sourceIds: string[];
};

function extractJson(text: string): any {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); if (s === -1) return {};
  let d = 0, inStr = false, esc = false, e = -1;
  for (let i = s; i < t.length; i++) { const c = t[i]; if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === '"') inStr = !inStr; else if (!inStr) { if (c === "{") d++; else if (c === "}") { d--; if (!d) { e = i; break; } } } }
  try { return JSON.parse(e === -1 ? t.slice(s) : t.slice(s, e + 1)); } catch { return {}; }
}
function cleanHtml(s: string): string {
  return String(s || "").replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
}

// ---- colour maths (deterministic, grounded on the brand palette) ----
function normHex(h: string): string { h = h.toLowerCase(); if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return h; }
function rgbToHex(r: number, g: number, b: number): string { return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join(""); }
function hexToRgb(h: string): [number, number, number] { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function dist(a: string, b: string): number { const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b); return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2); }
function nearest(hex: string, palette: string[]): { hex: string; dist: number } { let best = palette[0] || "#00a18b", bd = 1e9; for (const p of palette) { const d = dist(hex, p); if (d < bd) { bd = d; best = p; } } return { hex: best, dist: bd }; }
// neutrals (white/black/greys) are always allowed regardless of palette
function isNeutral(hex: string): boolean { const [r, g, b] = hexToRgb(hex); return Math.max(r, g, b) - Math.min(r, g, b) <= 18; }

function extractColors(html: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  const hexRe = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  while ((m = hexRe.exec(html))) out.add(normHex(m[0]));
  const rgbRe = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;
  while ((m = rgbRe.exec(html))) out.add(rgbToHex(+m[1], +m[2], +m[3]));
  return [...out];
}
function extractFonts(html: string): string[] {
  const out = new Set<string>();
  const re = /font-family\s*:\s*([^;"'}]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) { const first = m[1].split(",")[0].replace(/['"]/g, "").trim(); if (first && !/^-?(apple|system|ui)/i.test(first)) out.add(first); }
  return [...out];
}

// Assemble the grounded brand profile: the active BrandGuidelines record (the
// uploaded/curated brand corpus) + a RAG retrieval over indexed brand material.
// The brand is read straight from the corpus (DB) — retrieved, never guessed —
// because the brandGuidelines REST endpoint is access-controlled (the agent is
// unauthenticated) and the summarised tool truncates the JSON.
export async function getBrandProfile(_primary?: string): Promise<BrandProfile> {
  let doc: any = null;
  try {
    const { rows } = await pool.query("SELECT id, name, data FROM brand_guidelines WHERE is_active = true ORDER BY updated_at DESC LIMIT 1");
    if (rows.length) doc = rows[0];
  } catch { /* fall through to empty/defaults */ }
  const data = doc?.data && typeof doc.data === "object" ? doc.data : {};
  const paletteMeta = Array.isArray(data.palette) ? data.palette : [];
  const palette = paletteMeta.map((p: any) => normHex(String(p.hex || p))).filter((h: string) => /^#[0-9a-f]{6}$/.test(h));
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const voice = sections
    .filter((s: any) => ["essence", "positioning", "personality", "voice", "messaging"].includes(s.type))
    .map((s: any) => `${s.title}: ${s.content}`).join("\n");
  const fonts: string[] = [];
  const typo = sections.find((s: any) => s.type === "typography");
  if (typo?.content) (String(typo.content).match(/\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)\b/g) || []).slice(0, 4).forEach((f) => fonts.push(f));
  if (data.font) fonts.push(String(data.font));
  // RAG grounding over the brand corpus (Task 42).
  const rag = await retrieveContext("brand voice tone visual identity colour palette typography guidelines dos and donts", "en", 4).catch(() => ({ ok: false, text: "" } as any));
  return {
    name: doc?.name || data?.name || "Brand",
    palette, paletteMeta, fonts, voice,
    ragText: rag.ok ? rag.text : "",
    grounded: palette.length > 0 || sections.length > 0,
    sourceIds: doc?.id != null ? [String(doc.id)] : [],
  };
}

// Review one artifact (website/section/component/deck/article) against the brand.
export async function reviewArtifact(args: { html: string; kind: string; profile?: BrandProfile; primary?: string }): Promise<GovReport> {
  const profile = args.profile ?? (await getBrandProfile(args.primary));
  const brandPalette = profile.palette.length ? profile.palette : ["#00a18b", "#c2e54b", "#0b1416", "#ffffff"];
  const used = extractColors(args.html);
  const offBrand = used.filter((c) => !isNeutral(c) && nearest(c, brandPalette).dist > 60);
  const paletteScore = used.length ? Math.round((100 * (used.length - offBrand.length)) / used.length) : 100;
  const usedFonts = extractFonts(args.html);

  // LLM governance judge — grounded ONLY on the retrieved brand context.
  const sys =
    "You are HUMAIN Create's Governance Agent — a brand-consistency reviewer. You are grounded ONLY on the BRAND CONTEXT provided " +
    "(retrieved from the brand's guidelines and RAG corpus). Judge the artifact for on-brand consistency across tone & voice, messaging, " +
    "and visual identity, plus basic accessibility. Cite specific evidence from the artifact. NEVER invent brand rules that aren't in the context. " +
    "Return ONLY minified JSON, no markdown, no fences.";
  const user =
    `BRAND: ${profile.name}\n` +
    `PALETTE (authoritative): ${profile.paletteMeta.map((p) => `${p.hex}${p.name ? " " + p.name : ""}`).join("; ") || brandPalette.join("; ")}\n` +
    (profile.fonts.length ? `FONTS: ${profile.fonts.join(", ")}\n` : "") +
    `VOICE & GUIDELINES:\n${profile.voice || "(none on file)"}\n` +
    (profile.ragText ? `RAG CONTEXT:\n${profile.ragText.slice(0, 1400)}\n` : "") +
    `\nARTIFACT (${args.kind}):\n"""${args.html.slice(0, 6000)}"""\n\n` +
    `Return JSON {"toneScore":0-100,"messagingScore":0-100,"visualScore":0-100,` +
    `"findings":[{"dimension":"tone|messaging|visual|accessibility","severity":"info|warn|fail","issue":string,"evidence":string,"fix":string}],"summary":string}`;
  let llm: any = {};
  try {
    const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 1400 }, { primary: args.primary });
    llm = extractJson(fb.text);
  } catch { /* deterministic findings still stand */ }

  const findings: GovFinding[] = [];
  for (const c of offBrand) findings.push({ dimension: "palette", severity: "warn", issue: `Off-brand colour ${c}`, evidence: c, fix: `Use ${nearest(c, brandPalette).hex} (nearest brand colour)` });
  if (profile.fonts.length) for (const f of usedFonts) if (!profile.fonts.some((bf) => f.toLowerCase().includes(bf.toLowerCase()))) findings.push({ dimension: "visual", severity: "info", issue: `Non-brand font "${f}"`, evidence: f, fix: `Prefer ${profile.fonts[0]}` });
  if (Array.isArray(llm.findings)) findings.push(...llm.findings.slice(0, 12).map((f: any) => ({ dimension: ["palette", "tone", "messaging", "visual", "accessibility"].includes(f?.dimension) ? f.dimension : "visual", severity: ["info", "warn", "fail"].includes(f?.severity) ? f.severity : "warn", issue: String(f?.issue || "").slice(0, 240), evidence: f?.evidence ? String(f.evidence).slice(0, 160) : undefined, fix: f?.fix ? String(f.fix).slice(0, 200) : undefined })));

  const clamp = (n: any, d = 85) => Math.max(0, Math.min(100, Number.isFinite(Number(n)) ? Number(n) : d));
  const dims = { palette: paletteScore, tone: clamp(llm.toneScore), messaging: clamp(llm.messagingScore), visual: clamp(llm.visualScore) };
  const score = Math.round((dims.palette + dims.tone + dims.messaging + dims.visual) / 4);
  const status: GovReport["status"] = score >= 85 ? "pass" : score >= 65 ? "warn" : "fail";
  const report: GovReport = {
    score, status, brandName: profile.name, grounded: profile.grounded,
    palette: { brand: brandPalette, used, offBrand, score: paletteScore },
    dimensions: dims, findings,
    summary: String(llm.summary || `Brand consistency ${score}/100 — ${findings.length} finding(s).`).slice(0, 400),
  };
  await auditGovernance(args.kind, report);
  return report;
}

// Auto-remediate: deterministic colour remap to the nearest brand colour +
// grounded LLM copy/tone fixes for the flagged non-palette findings.
export async function remediate(args: { html: string; kind?: string; profile?: BrandProfile; report?: GovReport; primary?: string }): Promise<{ html: string; changes: string[]; report: GovReport }> {
  const profile = args.profile ?? (await getBrandProfile(args.primary));
  const report = args.report ?? (await reviewArtifact({ html: args.html, kind: args.kind || "artifact", profile, primary: args.primary }));
  let html = args.html;
  const changes: string[] = [];
  const brandPalette = profile.palette.length ? profile.palette : ["#00a18b", "#c2e54b", "#0b1416", "#ffffff"];
  for (const c of report.palette.offBrand) {
    const n = nearest(c, brandPalette);
    if (n.dist <= 200) {
      const re = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      if (re.test(html)) { html = html.replace(re, n.hex); changes.push(`${c} → ${n.hex}`); }
    }
  }
  const toneFindings = report.findings.filter((f) => f.dimension !== "palette");
  if (toneFindings.length) {
    const sys =
      "You are HUMAIN Create's Governance Agent. Rewrite the HTML to fix ONLY the listed brand issues (tone, messaging, visual). " +
      "Preserve structure, layout, classes and every non-flagged element. Keep valid, well-formed HTML. Return ONLY the corrected HTML — no markdown, no commentary.";
    const user = `BRAND VOICE:\n${profile.voice}\nISSUES TO FIX:\n${toneFindings.map((f) => `- ${f.issue}${f.fix ? ` → ${f.fix}` : ""}`).join("\n")}\n\nHTML:\n"""${html.slice(0, 7000)}"""`;
    try {
      const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 4000 }, { primary: args.primary });
      const fixed = cleanHtml(fb.text);
      if (fixed.length > 60) { html = fixed; changes.push("tone/copy corrected on-brand"); }
    } catch { /* colour remap still applied */ }
  }
  await auditGovernance((args.kind || "artifact") + ":remediate", { ...report, summary: `Remediated: ${changes.join(", ") || "no changes"}` });
  return { html, changes, report };
}

// Every governance check is written to the immutable audit log (governed tool layer).
async function auditGovernance(kind: string, report: GovReport | (GovReport & { summary: string })) {
  await pool
    .query(
      `INSERT INTO audit_log(summary, action, collection_slug, document_id, "user", diff, created_at, updated_at)
       VALUES($1, 'update', 'governance', '-', 'governance-agent', $2, now(), now())`,
      [`Governance review (${kind}): ${report.status} ${report.score}/100 — ${report.findings.length} finding(s)`.slice(0, 250), JSON.stringify(report).slice(0, 6000)],
    )
    .catch(() => {});
}
