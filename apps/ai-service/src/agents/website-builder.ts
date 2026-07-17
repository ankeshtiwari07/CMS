// LEAP D2 — Website Builder agent.
//
// Beyond generate-new (build), this agent can EDIT an existing site: given the
// current sections + a natural-language instruction, it plans a MINIMAL set of
// edit ops (edit / add / remove / reorder) and applies them by regenerating ONLY
// the affected sections, then reassembles the standalone HTML. This keeps edits
// well inside the model token budget (never re-sends the whole 20k+ page) and is
// wired to PATCH /studio/website/:id.
import {
  generateWebsite,
  generateSection,
  assemble,
  type Brand,
  type PlannedSection,
  type Section,
  type SectionKind,
} from "../website.js";
import { completeWithFallback } from "../providers/index.js";

const KINDS = ["nav", "hero", "cardGrid", "domains", "buildYourOwn", "platform", "useCase", "logos", "features", "testimonial", "faq", "cta", "footer"];

type ExistingSection = { id: string; kind: string; brief?: string; html?: string; componentKey?: any; componentSource?: any };
type ExistingSite = { title: string; brand: any; sections: ExistingSection[] };
type Op = { op: "edit" | "add" | "remove" | "reorder"; id?: string; kind?: string; brief?: string; afterId?: string; order?: string[] };

function extractJson(text: string): any {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{");
  if (s === -1) throw new Error("no_json");
  let d = 0, inStr = false, esc = false, e = -1;
  for (let i = s; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    else if (!inStr) { if (c === "{") d++; else if (c === "}") { d--; if (!d) { e = i; break; } } }
  }
  return JSON.parse(e === -1 ? t.slice(s) : t.slice(s, e + 1));
}

let _n = 0;
const nid = () => `w${Date.now().toString(36)}${(_n = (_n + 1) % 1e6).toString(36)}`;

export class WebsiteBuilder {
  constructor(private primary?: string) {}

  // Build a brand-new site from a prompt (delegates to the full pipeline).
  build(prompt: string) {
    return generateWebsite({ prompt, primary: this.primary });
  }

  // Edit an EXISTING site: plan ops from the instruction, then apply by
  // regenerating only the affected sections. Returns the updated sections +
  // reassembled HTML + which section ids changed.
  async updateWebsite(
    site: ExistingSite,
    instruction: string,
  ): Promise<{ title: string; brand: any; sections: Section[]; html: string; changed: string[]; ops: Op[]; provider: string }> {
    const brand = site.brand as Brand;
    const secList = site.sections
      .map((s, i) => `${i + 1}. id=${s.id} kind=${s.kind} — ${String(s.brief || "").slice(0, 120)}`)
      .join("\n");
    const sys =
      "You are HUMAIN Create's Website Builder agent editing an EXISTING website. " +
      "Translate the user's instruction into a MINIMAL ordered list of edit operations. Do NOT rebuild the whole site. " +
      "Ops: `edit` (change one section — give its id and a NEW one-line brief describing the change), " +
      "`add` (insert a new section — give kind and a brief, optionally afterId to place it after a section), " +
      "`remove` (delete a section — give its id), `reorder` (give the full new order as a list of ids). " +
      `Allowed kinds: ${KINDS.join(", ")}. Only include ops that are actually needed. ` +
      "Return ONLY minified JSON, no markdown, no code fences.";
    const user =
      `Current sections:\n${secList}\n\nInstruction:\n"""${instruction}"""\n\n` +
      `Return JSON: {"ops":[{"op":"edit|add|remove|reorder","id":string?,"kind":kind?,"brief":string?,"afterId":string?,"order":[ids]?}]}`;
    const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 900 }, { primary: this.primary });

    let ops: Op[] = [];
    try { ops = (extractJson(fb.text).ops || []).filter((o: any) => o && o.op); } catch { ops = []; }
    // Fallback: if the model produced no ops, treat the instruction as editing
    // the first section rather than dead-ending.
    if (!ops.length && site.sections.length) ops = [{ op: "edit", id: site.sections[0].id, brief: instruction.slice(0, 200) }];

    let sections: ExistingSection[] = site.sections.map((s) => ({ ...s }));
    // Keep the edited site interlinked: give regenerated sections the page outline.
    const outline = sections.map((s, i) => ({ anchor: `#sec-${i}`, kind: s.kind, brief: s.brief || "" }));
    const changed: string[] = [];
    const sitePrompt = `${site.title} — ${instruction}`.slice(0, 400);

    for (const op of ops) {
      if (op.op === "remove" && op.id) {
        sections = sections.filter((s) => s.id !== op.id);
      } else if (op.op === "reorder" && Array.isArray(op.order)) {
        const map = new Map(sections.map((s) => [s.id, s] as const));
        const out: ExistingSection[] = [];
        for (const id of op.order) { const s = map.get(id); if (s) { out.push(s); map.delete(id); } }
        for (const s of sections) if (map.has(s.id)) out.push(s); // keep any not listed
        sections = out;
      } else if (op.op === "edit" && op.id) {
        const idx = sections.findIndex((s) => s.id === op.id);
        if (idx === -1) continue;
        const cur = sections[idx];
        const ps: PlannedSection = { id: cur.id, kind: cur.kind as SectionKind, brief: op.brief || cur.brief || "" };
        const sec = await generateSection({ section: ps, brand, siteTitle: site.title, sitePrompt, primary: this.primary, outline }).catch(() => null);
        if (sec) {
          sections[idx] = { ...cur, brief: ps.brief, html: sec.html, componentSource: sec.componentSource ?? cur.componentSource, componentKey: sec.componentKey ?? cur.componentKey };
          changed.push(cur.id);
        }
      } else if (op.op === "add" && op.kind && KINDS.includes(op.kind)) {
        const ps: PlannedSection = { id: nid(), kind: op.kind as SectionKind, brief: op.brief || "" };
        const sec = await generateSection({ section: ps, brand, siteTitle: site.title, sitePrompt, primary: this.primary, outline }).catch(() => null);
        if (sec) {
          const block: ExistingSection = { id: ps.id, kind: ps.kind, brief: ps.brief, html: sec.html, componentKey: sec.componentKey, componentSource: sec.componentSource };
          const at = op.afterId ? sections.findIndex((s) => s.id === op.afterId) : -1;
          if (at >= 0) sections.splice(at + 1, 0, block);
          else sections.push(block);
          changed.push(ps.id);
        }
      }
    }

    const html = assemble(site.title, brand, sections.map((s) => ({ html: s.html || "" })));
    return { title: site.title, brand, sections: sections as any, html, changed, ops, provider: fb.provider };
  }
}
