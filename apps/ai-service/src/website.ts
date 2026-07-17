// Gamma/Apple-style WEBSITE generation. Beats the single-shot token limit by
// generating the page SECTION-BY-SECTION (each section self-contained, well
// within budget) and assembling a complete, responsive, standalone HTML page.
//
// Component-based build (LEAP D2): before generating, the builder consults the
// CMS component library. Every section is built FROM a reusable component —
// either one that already exists (reused) or, when the required component is
// MISSING, the builder DELEGATES to the Component Agent to generate it, then
// consumes it. Delegated components are returned so the caller can persist them
// to the library and route them (with the page) through the approval flow (D3).
import { completeWithFallback } from "./providers/index.js";

export type Brand = {
  bg: string; ink: string; muted: string; accent: string; accent2: string; line: string;
  soft: string; font: string; radius: number;
};
export type SectionKind =
  | "nav" | "hero" | "cardGrid" | "domains" | "buildYourOwn" | "platform"
  | "useCase" | "logos" | "features" | "testimonial" | "faq" | "cta" | "leadForm" | "footer";
export type PlannedSection = { id: string; kind: SectionKind; brief: string };
export type WebsitePlan = { title: string; description?: string; brand: Brand; sections: PlannedSection[]; lang?: string; dir?: string; bilingual?: boolean };
export type Outline = { anchor: string; kind: string; brief: string }[];
export type Section = PlannedSection & { html: string; componentKey?: string; componentSource?: "library" | "delegated" };

// A reusable building-block the Component Agent produced for a gap in the library.
export type DelegatedComponent = {
  key: string; name: string; type: string; category: string; description: string;
  html: string; props: Array<{ name: string; label?: string; type?: string; default?: string }>;
  forKind: SectionKind; _provider: string;
};
export type LibraryComponent = { key: string; type: string; name: string; description?: string; html?: string };

const DEFAULT_BRAND: Brand = {
  bg: "#ffffff", ink: "#0b1416", muted: "#5a6a6c", accent: "#00b3a4", accent2: "#c2e54b",
  line: "#e6ebeb", soft: "#f5f8f7", font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", radius: 20,
};

// Maps a planned website section to the component-library `type` that fulfils it.
// The library is keyed by component TYPE (hero, card, feature, cta, …); this is
// how the builder decides whether a suitable component already exists.
const KIND_TO_TYPE: Record<SectionKind, string> = {
  nav: "nav", hero: "hero", cardGrid: "card", domains: "gallery", buildYourOwn: "cta",
  platform: "feature", useCase: "stats", logos: "logoCloud", features: "feature",
  testimonial: "testimonial", faq: "faq", cta: "cta", leadForm: "form", footer: "footer",
};

const CMS = process.env.CMS_BASE_URL || "http://localhost:3001";

function extractJson(text: string): any {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); if (s === -1) throw new Error("no_json");
  let d = 0, inStr = false, esc = false, e = -1;
  for (let i = s; i < t.length; i++) { const c = t[i]; if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === '"') inStr = !inStr; else if (!inStr) { if (c === "{") d++; else if (c === "}") { d--; if (!d) { e = i; break; } } } }
  return JSON.parse(e === -1 ? t.slice(s) : t.slice(s, e + 1));
}

function cleanHtml(s: string): string {
  return String(s || "")
    .replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "")
    // strip any full-document wrappers a model may add — we only want body-level markup
    .replace(/<!doctype[^>]*>/gi, "").replace(/<\/?html[^>]*>/gi, "").replace(/<\/?body[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "").trim();
}

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

// Auto-balance a section's HTML so unclosed tags can't leak into (and clip/hide)
// the NEXT section once sections are concatenated. Independently-generated
// sections occasionally leave <div>s open; we append the missing closers.
function balanceTags(html: string): string {
  const stack: string[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const selfClose = m[4] === "/";
    if (tag === "style" || tag === "script") {
      // skip over raw content of style/script so its text isn't parsed as tags
      if (!closing) { const end = html.toLowerCase().indexOf(`</${tag}>`, re.lastIndex); if (end !== -1) re.lastIndex = end + tag.length + 3; }
      continue;
    }
    if (VOID_TAGS.has(tag) || selfClose) continue;
    if (!closing) stack.push(tag);
    else { const idx = stack.lastIndexOf(tag); if (idx !== -1) stack.length = idx; }
  }
  let tail = ""; for (let i = stack.length - 1; i >= 0; i--) tail += `</${stack[i]}>`;
  return html + tail;
}

let _n = 0; const sid = () => `w${Date.now().toString(36)}${(_n = (_n + 1) % 1e6).toString(36)}`;

export async function planWebsite(prompt: string, primary?: string): Promise<WebsitePlan & { _provider: string }> {
  const sys =
    "You are HUMAIN Create Studio's web art director. Plan a premium, Apple.com-style marketing website. " +
    "Choose a coherent brand system and an ordered list of sections. Use these section kinds only: " +
    "nav, hero, cardGrid, domains, buildYourOwn, platform, useCase, logos, features, testimonial, faq, cta, leadForm, footer. " +
    "Always start with nav and hero and end with footer. Pick 7-11 sections total. For a landing / marketing page, INCLUDE a leadForm (contact) section near the end so the page can actually convert. " +
    'Detect the requested language(s) from the brief: return "lang" (BCP-47, e.g. en or ar), "dir" (ltr|rtl), and "bilingual":true if the user asks for two languages. ' +
    "Respond with ONLY minified JSON, no markdown, no fences.";
  const user =
    `Plan the website for:\n"""${prompt}"""\n\n` +
    `Return JSON: {"title": string, "description": string, "lang": "en"|"ar"|…, "dir": "ltr"|"rtl", "bilingual": boolean, ` +
    `"brand": {"bg": hex, "ink": hex, "muted": hex, "accent": hex, "accent2": hex, "line": hex, "soft": hex}, ` +
    `"sections": [{"kind": one-of-the-kinds, "brief": "one line: exactly what this section shows for THIS site"}]}`;
  const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 1500 }, { primary });
  const data = extractJson(fb.text);
  const b = data.brand || {};
  const brand: Brand = {
    bg: b.bg || DEFAULT_BRAND.bg, ink: b.ink || DEFAULT_BRAND.ink, muted: b.muted || DEFAULT_BRAND.muted,
    accent: b.accent || DEFAULT_BRAND.accent, accent2: b.accent2 || DEFAULT_BRAND.accent2,
    line: b.line || DEFAULT_BRAND.line, soft: b.soft || DEFAULT_BRAND.soft,
    font: DEFAULT_BRAND.font, radius: DEFAULT_BRAND.radius,
  };
  const kinds = ["nav", "hero", "cardGrid", "domains", "buildYourOwn", "platform", "useCase", "logos", "features", "testimonial", "faq", "cta", "leadForm", "footer"];
  const sections: PlannedSection[] = (Array.isArray(data.sections) ? data.sections : [])
    .filter((s: any) => kinds.includes(s?.kind))
    .slice(0, 12)
    .map((s: any) => ({ id: sid(), kind: s.kind, brief: String(s.brief || "").slice(0, 300) }));
  const lang = typeof data.lang === "string" && data.lang.trim() ? data.lang.trim().slice(0, 8) : "en";
  const dir = data.dir === "rtl" || data.dir === "ltr" ? data.dir : lang.toLowerCase().startsWith("ar") ? "rtl" : "ltr";
  return { title: String(data.title || prompt).slice(0, 140), description: data.description ? String(data.description).slice(0, 300) : undefined, brand, sections, lang, dir, bilingual: Boolean(data.bilingual), _provider: fb.provider };
}

function brandVars(b: Brand): string {
  return `Brand tokens (use EXACTLY): background ${b.bg}; text ${b.ink}; muted text ${b.muted}; primary accent ${b.accent}; secondary/lime accent ${b.accent2}; hairline ${b.line}; soft panel ${b.soft}; font-family ${b.font}; card radius ${b.radius}px.`;
}

const KIND_GUIDE: Record<SectionKind, string> = {
  nav: "A sticky top navigation bar (<nav> or <header>): brand wordmark on the left, 4-5 menu links center/right, a language pill, and a filled primary CTA button. Use a translucent white background with backdrop-filter blur and a bottom hairline.",
  hero: "A hero <section>: a short eyebrow, a large two-line headline (second line can use the accent color), a supporting paragraph, one primary + one ghost CTA, and a stylized product/abstract visual block (CSS-only, e.g. a gradient card with floating shapes) on the right. Big whitespace.",
  cardGrid: "A section with a centered title and a responsive 2-3 column grid of 6 feature/agent cards. Each card: a tall image area rendered as a CSS gradient placeholder with a small category tag pill, a bold title, a one-line blurb, and a 'Read more →' link.",
  domains: "A section titled like 'Browse by domain' with a horizontal row of 4-6 rounded category tiles (each a gradient thumbnail with a label overlaid).",
  buildYourOwn: "A full-width panel with a vibrant gradient background (use both accents) containing a centered title and 3 white rounded cards, each with an icon chip, title, one-line description and a 'Get Started' button.",
  platform: "A two-column section: left has a title + a vertical accordion-style list of 4-5 platform capabilities (icon + label rows); right has a large image/gradient panel.",
  useCase: "A soft-background panel presenting one use case with a big stat (e.g. '90%'), a headline like 'weeks to hours', 2-3 supporting metric chips, and a small source note.",
  logos: "A 'Trusted by' section: a centered small heading and a single row of 4-6 muted monochrome company wordmarks (styled text is fine).",
  features: "A section with 3 equal columns, each: an icon chip, a bold short title, and a two-line description. Bordered rounded cards.",
  testimonial: "A centered testimonial: a large quote, an author name + role, subtle styling.",
  faq: "An FAQ section: a title and 5-6 accordion rows (use <details>/<summary> so they expand natively) with question + answer.",
  cta: "A bold closing call-to-action band: headline, subcopy, and a primary button, on a soft or gradient background.",
  leadForm: 'A contact / lead-capture section with a real working form: <form method="post" action="/api/site/lead"> containing a text input name="name" (label Name), an email input name="email" (label Email, required), a <textarea name="message"> (label Message), and a submit <button type="submit">. The form MUST post natively (no JavaScript). Add a short heading + subcopy inviting the visitor to get in touch. Style inputs on-brand with generous padding and rounded corners.',
  footer: "A rich <footer>: brand + a tagline (e.g. 'A PIF COMPANY'), 3-4 link columns, a bottom row with copyright, legal links and social icons.",
};

// ------------------------------------------------------------------ //
// Component library + Component Agent (delegation)                    //
// ------------------------------------------------------------------ //

// Pull the LIVE component library the admin curated. Only LIVE components are
// offered to the build — draft/in-review components (incl. ones awaiting Flow B
// approval) are deliberately NOT reused until an authority approves them.
export async function getLiveLibrary(): Promise<LibraryComponent[]> {
  try {
    const res = await fetch(`${CMS}/api/components?where[status][equals]=live&limit=100&depth=0&sort=-updatedAt`);
    if (!res.ok) return [];
    const docs = ((await res.json()) as any)?.docs ?? [];
    return docs.map((d: any) => ({ key: d.key, type: d.type, name: d.name, description: d.description, html: String(d.html || "") }));
  } catch { return []; }
}

// The Component Agent. Given a gap (a section kind with no matching library
// component), it generates ONE reusable, brand-consistent building block with
// {{placeholder}} props so it can be reused across pages — not a one-off.
export async function generateComponent(args: { kind: SectionKind; brief: string; brand: Brand; siteTitle: string; primary?: string }): Promise<DelegatedComponent> {
  const type = KIND_TO_TYPE[args.kind] || "section";
  const sys =
    "You are HUMAIN Create's Component Agent. You produce ONE reusable, brand-consistent building-block component for the CMS component library. " +
    "The component must be generic enough to be reused across pages (not hard-coded to one site): expose configurable text via {{placeholder}} tokens. " +
    "Return ONLY minified JSON, no markdown, no code fences.";
  const cats = ["layout", "content", "media", "navigation", "marketing", "form"];
  const user =
    `Create a reusable "${type}" component (fulfils "${args.kind}" sections). ${brandVars(args.brand)}\n` +
    `Structure guide: ${KIND_GUIDE[args.kind]}\n` +
    `Purpose/brief: ${args.brief}\nSite context: ${args.siteTitle}\n` +
    `Return JSON: {"name": short human name, "key": kebab-case-unique-id, "description": one line on when to use it, ` +
    `"category": one of [${cats.join(", ")}], "props": [{"name": camelCase, "label": string, "type": "text"|"richtext"|"image"|"url", "default": string}], ` +
    `"html": "the component as a single <section>/<nav>/<footer> element with ALL styling inline via a scoped <style> block; use {{propName}} tokens where text/props go; premium Apple.com aesthetic; fully responsive; well-formed; no external assets, scripts or fonts; no markdown"}`;
  const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 2800 }, { primary: args.primary });
  const data = extractJson(fb.text);
  const key = (String(data.key || `${type}-${args.kind}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 44)) || `${type}-${sid()}`;
  const props = Array.isArray(data.props)
    ? data.props.slice(0, 24).map((p: any) => ({ name: String(p?.name || "").slice(0, 40), label: p?.label ? String(p.label).slice(0, 80) : undefined, type: p?.type ? String(p.type).slice(0, 20) : "text", default: p?.default != null ? String(p.default).slice(0, 400) : undefined })).filter((p: any) => p.name)
    : [];
  return {
    key, name: String(data.name || `${type} block`).slice(0, 80), type,
    category: cats.includes(data.category) ? data.category : "content",
    description: String(data.description || args.brief).slice(0, 300),
    props, html: balanceTags(cleanHtml(String(data.html || ""))), forKind: args.kind, _provider: fb.provider,
  };
}

export async function generateSection(args: { section: PlannedSection; brand: Brand; siteTitle: string; sitePrompt: string; primary?: string; component?: { html: string; source: "library" | "delegated"; key: string }; outline?: Outline; lang?: string; dir?: string; bilingual?: boolean }): Promise<Section & { _provider: string }> {
  // When a component (reused from the library or freshly delegated) fulfils this
  // section, the section is built FROM that component's template — the component
  // is the source of truth (component-based CMS), not ad-hoc markup.
  const usingComponent = Boolean(args.component?.html);
  const langNote = args.bilingual
    ? "Write ALL copy BILINGUALLY: English first, then the Arabic translation immediately after within the same elements. "
    : args.lang && args.lang.toLowerCase().startsWith("ar")
      ? "Write ALL copy in Arabic. "
      : args.lang && args.lang !== "en"
        ? `Write ALL copy in ${args.lang}. `
        : "";
  const dirNote = args.dir === "rtl" ? 'The page is right-to-left — align text/layout for dir="rtl". ' : "";
  const sys =
    "You are HUMAIN Create Studio, an elite front-end engineer. Output the HTML for ONE website section only. " +
    (usingComponent
      ? "You are given an APPROVED component template. Build this section by INSTANTIATING that template: keep its structure, classes and styling; replace every {{token}} and placeholder with real, specific copy for THIS site. Do not redesign it. "
      : "") +
    "Rules: return ONLY raw HTML for a single <section>/<nav>/<footer> element with ALL styles inline via a <style> block scoped with a unique wrapper class OR inline style attributes. " +
    "NO <html>, <head>, or <body> tags. NO markdown, NO code fences, NO commentary. " +
    "Premium Apple.com aesthetic: generous whitespace, refined type scale, rounded cards, subtle shadows and hover transitions, fully responsive (mobile-friendly with @media). " +
    "Return WELL-FORMED HTML: every tag you open must be closed, correctly nested. All content must be visible WITHOUT JavaScript (no opacity:0 reveal states, no scroll-triggered animations). " +
    'Links & buttons MUST be functional: every nav item and in-page CTA is an <a href="#sec-N"> pointing to the correct section from the page outline below; NEVER output href="#", an empty href, or a <button> without an enclosing <a>. If an action has no in-page target, link it to the CTA or footer anchor. ' +
    langNote + dirNote +
    "Use realistic, specific copy for THIS site — never lorem ipsum. Do not reference external images, scripts, or fonts.";
  const user =
    `Website: "${args.siteTitle}". Overall brief: ${args.sitePrompt.slice(0, 400)}\n` +
    `${brandVars(args.brand)}\n` +
    (args.outline?.length ? `Page outline (anchor · kind · purpose) — link nav/CTAs to the correct anchor:\n${args.outline.map((o) => `${o.anchor} · ${o.kind} · ${o.brief.slice(0, 60)}`).join("\n")}\n` : "") +
    (usingComponent
      ? `Component template to instantiate (kind="${args.section.kind}", key="${args.component!.key}"):\n"""${args.component!.html.slice(0, 4000)}"""\n`
      : `Build this section — kind="${args.section.kind}". ${KIND_GUIDE[args.section.kind]}\n`) +
    `Section brief: ${args.section.brief}`;
  const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 3000, model: undefined }, { primary: args.primary });
  return { ...args.section, html: balanceTags(cleanHtml(fb.text)), componentKey: args.component?.key, componentSource: args.component?.source, _provider: fb.provider };
}

export function assemble(title: string, brand: Brand, sections: { html: string }[], lang = "en", dir = "ltr"): string {
  // Wrap each section in a stable anchor so nav/CTA `href="#sec-N"` links resolve.
  const body = sections.map((s) => s.html).filter(Boolean).map((h, i) => `<div id="sec-${i}">${h}</div>`).join("\n");
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<>]/g, "")}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:${brand.bg};color:${brand.ink};font-family:${brand.font};line-height:1.55;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  img{max-width:100%;display:block}
  details>summary{cursor:pointer;list-style:none}
  details>summary::-webkit-details-marker{display:none}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// Full pipeline: plan -> generate every section IN PARALLEL -> assemble.
// LEAP D2 delegation is preserved but no longer gates the page: reusable
// components for gap kinds are synthesised for the LIBRARY in parallel, while
// gap sections generate DIRECTLY from the kind guide. This removes the serial
// component->instantiate round-trip (Lever 2) so a full 7-11 section page lands
// in ~15-25s instead of ~80s.
export async function generateWebsite(args: { prompt: string; plan?: WebsitePlan; primary?: string }): Promise<{
  title: string; brand: Brand; sections: Section[]; html: string; provider: string;
  usedComponents: Array<{ kind: string; key: string; name: string; type: string }>;
  delegatedComponents: DelegatedComponent[];
  lang: string; dir: string;
}> {
  const plan = args.plan ?? (await planWebsite(args.prompt, args.primary));
  const lang = plan.lang || "en", dir = plan.dir || "ltr", bilingual = Boolean(plan.bilingual);
  const outline: Outline = plan.sections.map((s, i) => ({ anchor: `#sec-${i}`, kind: s.kind, brief: s.brief }));

  const library = await getLiveLibrary();
  const byType = new Map<string, LibraryComponent>();
  for (const c of library) if (!byType.has(c.type)) byType.set(c.type, c);

  // Delegate reusable components for gap kinds INTO THE LIBRARY, in parallel —
  // does NOT gate section generation (the caller persists these for reuse / D2).
  const gapKinds = Array.from(new Set(plan.sections.map((s) => s.kind))).filter((k) => !byType.has(KIND_TO_TYPE[k])) as SectionKind[];
  const delegatedPromise = Promise.all(
    gapKinds.map((k) => {
      const sec = plan.sections.find((s) => s.kind === k)!;
      return generateComponent({ kind: k, brief: sec.brief, brand: plan.brand, siteTitle: plan.title, primary: args.primary }).catch(() => null);
    }),
  ).then((list) => list.filter(Boolean) as DelegatedComponent[]);

  // All sections in ONE parallel pass: library-backed kinds instantiate from
  // their component; gap kinds generate directly.
  const sections = await Promise.all(
    plan.sections.map((ps) => {
      const lib = byType.get(KIND_TO_TYPE[ps.kind]);
      const component = lib ? { html: lib.html || "", source: "library" as const, key: lib.key } : undefined;
      return generateSection({ section: ps, brand: plan.brand, siteTitle: plan.title, sitePrompt: args.prompt, primary: args.primary, component, outline, lang, dir, bilingual })
        .catch((): Section & { _provider: string } => ({ ...ps, html: "", _provider: "error" }));
    }),
  );
  const ok = sections.filter((s) => s.html);

  const used: Array<{ kind: string; key: string; name: string; type: string }> = [];
  const seen = new Set<string>();
  for (const ps of plan.sections) {
    const lib = byType.get(KIND_TO_TYPE[ps.kind]);
    if (lib && !seen.has(lib.key)) { seen.add(lib.key); used.push({ kind: ps.kind, key: lib.key, name: lib.name, type: lib.type }); }
  }
  const delegated = await delegatedPromise;
  return {
    title: plan.title, brand: plan.brand, sections: ok, html: assemble(plan.title, plan.brand, ok, lang, dir),
    provider: (plan as any)._provider || args.primary || "anthropic",
    usedComponents: used, delegatedComponents: delegated, lang, dir,
  };
}
