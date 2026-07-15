// Gamma/Apple-style WEBSITE generation. Beats the single-shot token limit by
// generating the page SECTION-BY-SECTION (each section self-contained, well
// within budget) and assembling a complete, responsive, standalone HTML page.
import { completeWithFallback } from "./providers/index.js";

export type Brand = {
  bg: string; ink: string; muted: string; accent: string; accent2: string; line: string;
  soft: string; font: string; radius: number;
};
export type SectionKind =
  | "nav" | "hero" | "cardGrid" | "domains" | "buildYourOwn" | "platform"
  | "useCase" | "logos" | "features" | "testimonial" | "faq" | "cta" | "footer";
export type PlannedSection = { id: string; kind: SectionKind; brief: string };
export type WebsitePlan = { title: string; description?: string; brand: Brand; sections: PlannedSection[] };
export type Section = PlannedSection & { html: string };

const DEFAULT_BRAND: Brand = {
  bg: "#ffffff", ink: "#0b1416", muted: "#5a6a6c", accent: "#00b3a4", accent2: "#c2e54b",
  line: "#e6ebeb", soft: "#f5f8f7", font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", radius: 20,
};

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
    "nav, hero, cardGrid, domains, buildYourOwn, platform, useCase, logos, features, testimonial, faq, cta, footer. " +
    "Always start with nav and hero and end with footer. Pick 7-11 sections total. " +
    "Respond with ONLY minified JSON, no markdown, no fences.";
  const user =
    `Plan the website for:\n"""${prompt}"""\n\n` +
    `Return JSON: {"title": string, "description": string, ` +
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
  const kinds = ["nav", "hero", "cardGrid", "domains", "buildYourOwn", "platform", "useCase", "logos", "features", "testimonial", "faq", "cta", "footer"];
  const sections: PlannedSection[] = (Array.isArray(data.sections) ? data.sections : [])
    .filter((s: any) => kinds.includes(s?.kind))
    .slice(0, 12)
    .map((s: any) => ({ id: sid(), kind: s.kind, brief: String(s.brief || "").slice(0, 300) }));
  return { title: String(data.title || prompt).slice(0, 140), description: data.description ? String(data.description).slice(0, 300) : undefined, brand, sections, _provider: fb.provider };
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
  footer: "A rich <footer>: brand + a tagline (e.g. 'A PIF COMPANY'), 3-4 link columns, a bottom row with copyright, legal links and social icons.",
};

export async function generateSection(args: { section: PlannedSection; brand: Brand; siteTitle: string; sitePrompt: string; primary?: string }): Promise<Section & { _provider: string }> {
  const sys =
    "You are HUMAIN Create Studio, an elite front-end engineer. Output the HTML for ONE website section only. " +
    "Rules: return ONLY raw HTML for a single <section>/<nav>/<footer> element with ALL styles inline via a <style> block scoped with a unique wrapper class OR inline style attributes. " +
    "NO <html>, <head>, or <body> tags. NO markdown, NO code fences, NO commentary. " +
    "Premium Apple.com aesthetic: generous whitespace, refined type scale, rounded cards, subtle shadows and hover transitions, fully responsive (mobile-friendly with @media). " +
    "Return WELL-FORMED HTML: every tag you open must be closed, correctly nested. All content must be visible WITHOUT JavaScript (no opacity:0 reveal states, no scroll-triggered animations). " +
    "Use realistic, specific copy for THIS site — never lorem ipsum. Do not reference external images, scripts, or fonts.";
  const user =
    `Website: "${args.siteTitle}". Overall brief: ${args.sitePrompt.slice(0, 400)}\n` +
    `${brandVars(args.brand)}\n` +
    `Build this section — kind="${args.section.kind}". ${KIND_GUIDE[args.section.kind]}\n` +
    `Section brief: ${args.section.brief}`;
  const fb = await completeWithFallback({ system: sys, messages: [{ role: "user", content: user }], maxTokens: 3000, model: undefined }, { primary: args.primary });
  return { ...args.section, html: balanceTags(cleanHtml(fb.text)), _provider: fb.provider };
}

export function assemble(title: string, brand: Brand, sections: { html: string }[]): string {
  const body = sections.map((s) => s.html).filter(Boolean).join("\n");
  return `<!doctype html>
<html lang="en">
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

// Full pipeline: plan -> generate every section IN PARALLEL -> assemble in order.
// Parallel keeps a full 7-11 section page under ~15s (vs ~90s sequential), so a
// single request completes well within proxy timeouts.
export async function generateWebsite(args: { prompt: string; plan?: WebsitePlan; primary?: string }): Promise<{ title: string; brand: Brand; sections: Section[]; html: string; provider: string }> {
  const plan = args.plan ?? (await planWebsite(args.prompt, args.primary));
  const sections = await Promise.all(
    plan.sections.map((ps) =>
      generateSection({ section: ps, brand: plan.brand, siteTitle: plan.title, sitePrompt: args.prompt, primary: args.primary })
        .catch((): Section & { _provider: string } => ({ ...ps, html: "", _provider: "error" })),
    ),
  );
  const ok = sections.filter((s) => s.html);
  return { title: plan.title, brand: plan.brand, sections: ok, html: assemble(plan.title, plan.brand, ok), provider: (plan as any)._provider || args.primary || "anthropic" };
}
