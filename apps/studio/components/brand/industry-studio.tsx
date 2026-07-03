"use client";
import { useEffect, useMemo, useState } from "react";
import { cmsVars, appBg, R, TYPE } from "@/components/cms/cms-tokens";
import { GlobeIcon, BoxIcon, SparkIcon, BuildingIcon, XIcon, PencilIcon, MonitorIcon, BookIcon, GridIcon, CalendarIcon, BookmarkIcon, MegaphoneIcon } from "@/components/icons";

type Kind = "brand" | "design";
type Preset = { id: string; name: string; blurb: string; palette: string[]; font: string; framework: string; layout: string };

// Industries offered as entry cards.
const INDUSTRIES: { key: string; label: string; Icon: any; blurb: string }[] = [
  { key: "ecommerce", label: "E-commerce", Icon: BoxIcon, blurb: "Conversion-first retail & marketplaces" },
  { key: "fmcg", label: "FMCG", Icon: GlobeIcon, blurb: "Bold, shelf-ready consumer brands" },
  { key: "healthcare", label: "Healthcare", Icon: SparkIcon, blurb: "Calm, trusted, accessible care" },
  { key: "fintech", label: "Fintech", Icon: BuildingIcon, blurb: "Secure, precise, confident finance" },
  { key: "education", label: "Education", Icon: BookIcon, blurb: "Approachable, credible, aspirational" },
  { key: "realestate", label: "Real Estate", Icon: GridIcon, blurb: "Aspirational, premium, place-led" },
  { key: "hospitality", label: "Hospitality", Icon: CalendarIcon, blurb: "Warm, sensory, memorable stays" },
  { key: "saas", label: "SaaS / Tech", Icon: MonitorIcon, blurb: "Sharp, modern, product-forward" },
  { key: "government", label: "Government", Icon: BookmarkIcon, blurb: "Trusted, accessible, official" },
  { key: "media", label: "Media", Icon: MegaphoneIcon, blurb: "Bold, dynamic, attention-first" },
];

// Curated recommendations per industry (palette = [bg, surface, primary, accent, ink]).
const PRESETS: Record<string, Preset[]> = {
  ecommerce: [
    { id: "ec-vivid", name: "Vivid Cart", blurb: "High-energy conversion palette with punchy CTAs.", palette: ["#FFFFFF", "#FFF3EC", "#FF5C39", "#111827", "#0B1220"], font: "Inter / Poppins", framework: "Next.js + Tailwind", layout: "Hero → product grid → offers → social proof" },
    { id: "ec-lux", name: "Lux Boutique", blurb: "Premium, editorial, generous whitespace.", palette: ["#FBFAF8", "#F1ECE4", "#1F2A44", "#C8A24B", "#14181F"], font: "Fraunces / Inter", framework: "Astro + Tailwind", layout: "Editorial hero → lookbook → story → shop" },
  ],
  fmcg: [
    { id: "fm-pop", name: "Pop Shelf", blurb: "Playful, bold, unmistakable on shelf.", palette: ["#FFFDF5", "#FFF0BF", "#E4002B", "#00A651", "#141414"], font: "Poppins / Nunito", framework: "Next.js + Tailwind", layout: "Bold hero → product family → flavours → where to buy" },
    { id: "fm-eco", name: "Green Basket", blurb: "Natural, honest, sustainable tone.", palette: ["#FBFCF8", "#EAF3E0", "#3E7C3A", "#D9A441", "#1B2A1B"], font: "Work Sans / Inter", framework: "Next.js + Tailwind", layout: "Nature hero → ingredients → values → retailers" },
  ],
  healthcare: [
    { id: "hc-calm", name: "Calm Clinic", blurb: "Soothing teal, high accessibility, trust-first.", palette: ["#FFFFFF", "#EAF6F5", "#0E8C82", "#5AB0A6", "#0C1F1D"], font: "Inter / Source Sans", framework: "Next.js + Tailwind", layout: "Reassuring hero → services → care team → book" },
    { id: "hc-clean", name: "Clean Care", blurb: "Clinical clarity, blue trust, crisp structure.", palette: ["#FFFFFF", "#EEF4FB", "#1E5AA8", "#3FA7D6", "#0B1622"], font: "Inter / IBM Plex", framework: "Next.js + Tailwind", layout: "Clear hero → conditions → outcomes → contact" },
  ],
  fintech: [
    { id: "ft-trust", name: "Trust Ledger", blurb: "Confident navy, precise, enterprise-grade.", palette: ["#FFFFFF", "#EEF1F6", "#0B2A5B", "#2FB67A", "#0A1220"], font: "Inter / Space Grotesk", framework: "Next.js + Tailwind", layout: "Bold statement → product → security → CTA" },
    { id: "ft-neo", name: "Neo Finance", blurb: "Modern dark, neon-mint accents, sleek.", palette: ["#0B0F14", "#121821", "#12E29B", "#7C8BFF", "#F2F6FA"], font: "Space Grotesk / Inter", framework: "Next.js + Tailwind", layout: "Dark hero → app preview → numbers → get started" },
  ],
  education: [
    { id: "ed-bright", name: "Bright Campus", blurb: "Warm, optimistic, welcoming to learners.", palette: ["#FFFFFF", "#FFF6E9", "#F59E0B", "#2563EB", "#1F2937"], font: "Poppins / Inter", framework: "Next.js + Tailwind", layout: "Hero → programs → outcomes → apply" },
    { id: "ed-focus", name: "Focus Study", blurb: "Calm, credible, distraction-free.", palette: ["#FFFFFF", "#EEF2FF", "#4338CA", "#22C55E", "#111827"], font: "Inter / Lora", framework: "Next.js + Tailwind", layout: "Hero → courses → mentors → enrol" },
  ],
  realestate: [
    { id: "re-prestige", name: "Prestige Estate", blurb: "Editorial luxury, gold accents, cinematic.", palette: ["#FBFAF8", "#F0ECE4", "#1C2B3A", "#B08D57", "#12181F"], font: "Fraunces / Inter", framework: "Next.js + Tailwind", layout: "Cinematic hero → listings → neighbourhoods → enquire" },
    { id: "re-modern", name: "Modern Living", blurb: "Fresh, teal-led, clean and confident.", palette: ["#FFFFFF", "#F1F5F4", "#0E7C6B", "#E8B84B", "#101816"], font: "Inter / Manrope", framework: "Next.js + Tailwind", layout: "Hero → featured homes → map → book viewing" },
  ],
  hospitality: [
    { id: "ho-warm", name: "Warm Stay", blurb: "Earthy, inviting, boutique warmth.", palette: ["#FFFDF9", "#F6ECDD", "#B4531F", "#3E7C5A", "#20140C"], font: "Playfair / Inter", framework: "Next.js + Tailwind", layout: "Hero → rooms → experiences → reserve" },
    { id: "ho-coastal", name: "Coastal Escape", blurb: "Airy, coastal blues, relaxed elegance.", palette: ["#FFFFFF", "#E9F5FA", "#0E7490", "#F4A259", "#0C1E24"], font: "Inter / Cormorant", framework: "Next.js + Tailwind", layout: "Hero → suites → dining → book" },
  ],
  saas: [
    { id: "sa-product", name: "Product Blue", blurb: "Crisp indigo, modern, product-forward.", palette: ["#FFFFFF", "#EEF2FF", "#4F46E5", "#06B6D4", "#0B1220"], font: "Inter / Space Grotesk", framework: "Next.js + Tailwind", layout: "Hero → features → integrations → pricing" },
    { id: "sa-console", name: "Dark Console", blurb: "Developer-dark, cyan/violet, technical.", palette: ["#0B0F14", "#141A22", "#22D3EE", "#A78BFA", "#EDF2F7"], font: "Space Grotesk / Inter", framework: "Next.js + Tailwind", layout: "Dark hero → product → logos → start free" },
  ],
  government: [
    { id: "go-trust", name: "Trust Public", blurb: "Official blue, serious, accessible.", palette: ["#FFFFFF", "#EEF3F8", "#12507B", "#2E8B57", "#0B1622"], font: "Inter / Source Serif", framework: "Next.js + Tailwind", layout: "Hero → services → announcements → contact" },
    { id: "go-civic", name: "Civic Clean", blurb: "Grounded green, clear, dependable.", palette: ["#FFFFFF", "#F1F4F2", "#0F5132", "#C79A2E", "#121A16"], font: "Inter / IBM Plex", framework: "Next.js + Tailwind", layout: "Hero → programs → resources → apply" },
  ],
  media: [
    { id: "me-bold", name: "Bold Stage", blurb: "High-contrast dark, punchy pink, editorial.", palette: ["#0E0E12", "#1A1A22", "#FF3D71", "#FFD166", "#F5F5FA"], font: "Space Grotesk / Inter", framework: "Next.js + Tailwind", layout: "Hero → featured → shows → subscribe" },
    { id: "me-stream", name: "Stream Dark", blurb: "Streaming-dark, violet/cyan, immersive.", palette: ["#0A0A0F", "#15151E", "#7C3AED", "#22D3EE", "#F2F2F7"], font: "Inter / Poppins", framework: "Next.js + Tailwind", layout: "Hero → trending → categories → watch" },
  ],
};
const industryLabel = (k: string) => INDUSTRIES.find((i) => i.key === k)?.label || k;

// ---- Templated visual mock (instant preview / fallback artifact) ----
function mockHtml(kind: Kind, p: Preset, org: { name?: string; tagline?: string }): string {
  const [bg, surface, primary, accent, ink] = p.palette;
  const name = org.name || "Your Brand";
  const tagline = org.tagline || p.blurb;
  const font = `-apple-system, ${p.font.split("/")[0].trim()}, Inter, system-ui, sans-serif`;
  if (kind === "design") {
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box;margin:0}body{font-family:${font};color:${ink};background:${bg}}
.wrap{max-width:1080px;margin:0 auto;padding:0 32px}
.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}
.logo{font-weight:800;font-size:20px;color:${primary}}
.btn{background:${primary};color:${bg};border:none;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer}
.hero{padding:70px 0 56px;text-align:center;background:linear-gradient(180deg, ${surface} 0%, ${bg} 100%)}
h1{font-size:52px;line-height:1.05;font-weight:800;letter-spacing:-.02em;margin:0 0 16px}
.sub{font-size:19px;color:${ink};opacity:.7;max-width:640px;margin:0 auto 26px}
.pill{display:inline-block;background:${accent}22;color:${primary};font-weight:700;font-size:13px;padding:6px 14px;border-radius:999px;margin-bottom:18px}
.feat{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:48px 0}
.card{background:${surface};border-radius:16px;padding:24px}
.card b{color:${primary};font-size:16px}.card p{margin-top:8px;opacity:.7;font-size:14px}
.cta{background:${primary};color:${bg};border-radius:20px;padding:44px;text-align:center;margin:20px 0 56px}
.cta h2{font-size:30px;margin:0 0 8px}.dot{width:36px;height:36px;border-radius:8px;background:${accent};display:inline-block}
</style></head><body><div class="wrap">
<div class="nav"><div class="logo">${name}</div><div style="display:flex;gap:22px;align-items:center;font-weight:600;opacity:.8"><span>Products</span><span>Pricing</span><span>About</span><button class="btn">Get started</button></div></div>
<div class="hero"><div class="pill">${industryLabel("")||"Designed for you"}${tagline?"":""}</div><span class="pill">${p.framework}</span><h1>${name}</h1><p class="sub">${tagline}</p><button class="btn">Start free</button></div>
<div class="feat"><div class="card"><span class="dot"></span><b>Fast</b><p>Built on ${p.framework} for instant, on-brand pages.</p></div><div class="card"><span class="dot"></span><b>On-brand</b><p>${p.name} palette and type applied everywhere.</p></div><div class="card"><span class="dot"></span><b>Convert</b><p>${p.layout}.</p></div></div>
<div class="cta"><h2>Ready to launch ${name}?</h2><p style="opacity:.85">${tagline}</p></div>
</div></body></html>`;
  }
  // brand board
  const sw = p.palette.map((c, i) => `<div style="text-align:center"><div style="width:78px;height:78px;border-radius:12px;background:${c};border:1px solid #0001"></div><div style="font-size:11px;margin-top:6px;color:${ink};opacity:.7">${["Background","Surface","Primary","Accent","Ink"][i]}<br>${c}</div></div>`).join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0}body{font-family:${font};color:${ink};background:${bg};padding:40px}h3{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${primary};margin:34px 0 14px}.logo{font-size:34px;font-weight:800;color:${primary}}</style></head><body>
<div class="logo">${name}</div><p style="opacity:.7;margin-top:6px">${tagline}</p>
<h3>Colour palette</h3><div style="display:flex;gap:18px;flex-wrap:wrap">${sw}</div>
<h3>Typography — ${p.font}</h3><div style="font-size:40px;font-weight:800">Aa Bb Cc</div><div style="font-size:18px;opacity:.75;margin-top:6px">The quick brown fox jumps — headline & body specimen.</div>
<h3>Voice</h3><p style="max-width:560px;opacity:.8">${p.blurb} Confident, clear and consistent across every touchpoint.</p>
<h3>Framework</h3><p style="opacity:.8">${p.framework} · ${p.layout}</p>
</body></html>`;
}

// Render a brand board from an item's palette + sections (used by the editor's live preview).
function boardHtml(name: string, tagline: string, palette: any[], sections: any[], keyVisual?: string): string {
  const hex = (palette || []).map((c: any) => c?.hex || c);
  const primary = hex[2] || hex[0] || "#009688", ink = hex[4] || "#111", bg = hex[0] || "#fff";
  const font = "-apple-system, Inter, system-ui, sans-serif";
  const sw = (palette || []).map((c: any) => { const h = c?.hex || c; const n = c?.name || ""; return `<div style="text-align:center"><div style="width:70px;height:70px;border-radius:12px;background:${h};border:1px solid #0001"></div><div style="font-size:11px;margin-top:6px;opacity:.7">${n}<br>${h}</div></div>`; }).join("");
  const secs = (sections || []).map((s: any) => `<h3 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${primary};margin:26px 0 8px">${s.title || "Section"}</h3><div style="opacity:.85;white-space:pre-wrap;max-width:640px">${String(s.content || "").replace(/[<>]/g, (m) => (m === "<" ? "&lt;" : "&gt;"))}</div>`).join("");
  const kv = keyVisual ? `<div style="position:relative;margin:22px 0;border-radius:18px;overflow:hidden"><img src="${keyVisual}" style="width:100%;height:260px;object-fit:cover;display:block" alt="key visual"/><div style="position:absolute;left:24px;bottom:20px;color:#fff;font-weight:800;font-size:26px;text-shadow:0 2px 12px rgba(0,0,0,.5)">${name || "Brand"}</div></div>` : "";
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0}body{font-family:${font};color:${ink};background:${bg};padding:40px}</style></head><body><div style="font-size:34px;font-weight:800;color:${primary}">${name || "Brand"}</div><p style="opacity:.7;margin-top:6px">${tagline || ""}</p>${kv}<h3 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${primary};margin:28px 0 12px">Colour palette</h3><div style="display:flex;gap:16px;flex-wrap:wrap">${sw}</div>${secs}</body></html>`;
}
// Inject (or replace) an AI hero image as the .hero background, with an overlay for text contrast. Idempotent.
function injectHero(html: string, url: string): string {
  const css = `<style id="__hero">.hero{background:linear-gradient(rgba(0,0,0,.52),rgba(0,0,0,.34)),url('${url}') center/cover no-repeat!important;color:#fff!important}.hero h1,.hero .sub{color:#fff!important}.hero .sub{opacity:.92!important}.hero .pill{background:rgba(255,255,255,.18)!important;color:#fff!important}</style>`;
  const cleaned = (html || "").replace(/<style id="__hero">[\s\S]*?<\/style>/g, "");
  return cleaned.includes("</head>") ? cleaned.replace("</head>", css + "</head>") : css + cleaned;
}
function editPreviewHtml(kind: Kind, item: any): string {
  if (kind === "design") return item?.data?.html || "<!doctype html><html><body style='font-family:sans-serif;padding:40px;color:#888'>Empty — add HTML on the left.</body></html>";
  return boardHtml(item?.name, item?.summary, item?.data?.palette || [], item?.data?.sections || [], item?.data?.keyVisual);
}

const Modal = ({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", padding: 24 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: wide ? "min(1040px, 96vw)" : "min(520px, 96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "var(--hc-card)", borderRadius: R.x2, border: "1px solid var(--hc-border)", boxShadow: "var(--hc-shadow-xl)", overflow: "hidden" }}>{children}</div>
  </div>
);

function PaletteRow({ palette }: { palette: string[] }) {
  return <div style={{ display: "flex", borderRadius: R.md, overflow: "hidden", height: 34, border: "1px solid var(--hc-border)" }}>{palette.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}</div>;
}

export default function IndustryStudio({ kind, initialLibrary }: { kind: Kind; initialLibrary: any[] }) {
  const [theme] = useState<"light" | "dark">("light");
  const [industry, setIndustry] = useState<string | null>(null);
  const [tab, setTab] = useState<"create" | "library">("create");
  const [preview, setPreview] = useState<Preset | null>(null);
  const [capture, setCapture] = useState<Preset | null>(null);
  const [org, setOrg] = useState({ name: "", tagline: "", audience: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState<any[]>(initialLibrary || []);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Immutable updaters for the working edit copy.
  const setEdit = (fn: (e: any) => any) => setEditItem((e: any) => (e ? fn(e) : e));
  const setField = (k: string, v: any) => setEdit((e) => ({ ...e, [k]: v }));
  const setData = (k: string, v: any) => setEdit((e) => ({ ...e, data: { ...(e.data || {}), [k]: v } }));
  const setSwatch = (i: number, hex: string) => setEdit((e) => ({ ...e, data: { ...e.data, palette: (e.data?.palette || []).map((c: any, idx: number) => (idx === i ? { ...(typeof c === "string" ? { name: "", hex: c } : c), hex } : c)) } }));
  const setSection = (i: number, content: string) => setEdit((e) => ({ ...e, data: { ...e.data, sections: (e.data?.sections || []).map((s: any, idx: number) => (idx === i ? { ...s, content } : s)) } }));

  async function saveEdit() {
    if (!editItem || busy) return; setBusy(true);
    try {
      await fetch("/api/brand-guidelines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editItem.id, name: editItem.name, industry: editItem.industry, summary: editItem.summary, source: editItem.source || "ai", active: !!editItem.isActive, data: editItem.data }) });
      await refreshLib();
      setToast(`Saved changes to “${editItem.name}”.`);
      setEditItem(null);
    } catch { setToast("Could not save changes."); }
    setBusy(false);
  }

  // Generate an AI hero image (Replicate) and inject it into the design's page hero.
  async function genHero() {
    if (!editItem || imgBusy) return; setImgBusy(true);
    try {
      const prompt = kind === "brand"
        ? `Evocative brand key visual / moodboard image for a ${editItem.industry || "modern"} brand${editItem.name ? ` called ${editItem.name}` : ""}, ${editItem.data?.preset || "clean modern"} aesthetic, editorial, atmospheric, professional, high quality, no text, no logos`
        : `Cinematic, atmospheric hero background image for a ${editItem.industry || "modern"} brand${editItem.name ? ` called ${editItem.name}` : ""}, ${editItem.data?.preset || "clean modern"} aesthetic, professional, high quality, no text, no logos`;
      const s = await fetch("/api/image/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, ratio: "16:9" }) });
      const j = await s.json();
      if (!j.id) { setToast(j.message || "Image rendering is not configured."); setImgBusy(false); return; }
      let url: string | null = null;
      for (let i = 0; i < 26; i++) { await new Promise((r) => setTimeout(r, 2500)); const st = await (await fetch(`/api/image/status/${j.id}`)).json(); if (st.status === "succeeded") { url = st.url; break; } if (st.status === "failed") { setToast("Image render failed."); break; } }
      if (url) { const u = url; setEdit((e) => ({ ...e, data: { ...e.data, ...(kind === "design" ? { html: injectHero(e.data?.html || "", u) } : {}), keyVisual: u, heroImage: u } })); setToast(`${kind === "brand" ? "Key visual" : "Hero image"} added — click Save to keep it.`); }
      else if (!url) setToast("Still rendering — try again in a moment.");
    } catch { setToast("Could not generate the image."); }
    setImgBusy(false);
  }
  const noun = kind === "design" ? "design" : "brand";

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  async function refreshLib() {
    try { const r = await fetch("/api/brand-guidelines"); const j = await r.json(); const mine = (j.mine || []).filter((d: any) => kind === "design" ? d.data?.kind === "design" : d.data?.kind !== "design"); setLib(mine); } catch {}
  }

  async function create() {
    if (!capture || busy) return;
    setBusy(true);
    const p = capture;
    const name = org.name || `${p.name} · ${industryLabel(industry || "")}`;
    let html = mockHtml(kind, p, org);
    let sections: any[] | null = null;
    let palette = p.palette.map((hex, i) => ({ name: ["Background", "Surface", "Primary", "Accent", "Ink"][i], hex }));
    try {
      if (kind === "brand") {
        const r = await fetch("/api/brand-guidelines/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ industry: industryLabel(industry || ""), audience: org.audience, tone: `${p.name} — ${p.blurb}`, notes: `${org.notes}. Palette: ${p.palette.join(", ")}. Font: ${p.font}.` }) });
        const j = await r.json();
        if (j?.guideline?.sections) { sections = j.guideline.sections; if (j.guideline.palette?.length) palette = j.guideline.palette; }
      }
    } catch { /* fallback to mock */ }
    const data = kind === "design"
      ? { kind: "design", html, palette, framework: p.framework, layout: p.layout, font: p.font, preset: p.id }
      : { kind: "brand", sections: sections || [], palette, framework: p.framework, font: p.font, preset: p.id };
    try {
      await fetch("/api/brand-guidelines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, industry: industryLabel(industry || ""), summary: org.tagline || p.blurb, source: "ai", data }) });
      await refreshLib();
      setToast(`${kind === "design" ? "Design" : "Brand"} “${name}” added to your library.`);
      setCapture(null); setOrg({ name: "", tagline: "", audience: "", notes: "" }); setTab("library");
    } catch { setToast("Could not save — try again."); }
    setBusy(false);
  }

  function libHtml(item: any): string {
    const d = item?.data || {};
    if (kind === "design") {
      if (d.html) return d.html;
      const preset = Object.values(PRESETS).flat().find((x) => x.id === d.preset) || PRESETS.fintech[0];
      const withPal = d.palette?.length ? { ...preset, palette: d.palette.map((c: any) => c.hex || c) } : preset;
      return mockHtml(kind, withPal as Preset, { name: item.name, tagline: item.summary });
    }
    // brand → render the actual board from palette + sections (reflects edits)
    const palette = d.palette?.length ? d.palette : (Object.values(PRESETS).flat().find((x) => x.id === d.preset) || PRESETS.fintech[0]).palette.map((hex: string, i: number) => ({ name: ["Background", "Surface", "Primary", "Accent", "Ink"][i], hex }));
    return boardHtml(item.name, item.summary, palette, d.sections || [], d.keyVisual);
  }
  function download(item: any) {
    const html = libHtml(item);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${String(item.name || noun).replace(/[^\w]+/g, "-").slice(0, 60)}.html`; a.click();
  }

  const card: React.CSSProperties = { background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.x2, overflow: "hidden", boxShadow: "var(--hc-shadow-sm)" };
  const btn = (primary?: boolean): React.CSSProperties => ({ padding: "8px 14px", borderRadius: R.lg, border: primary ? "none" : "1px solid var(--hc-border)", background: primary ? "var(--hc-primary)" : "transparent", color: primary ? "#fff" : "var(--hc-fg)", fontWeight: 700, ...TYPE.sm, cursor: "pointer" });

  return (
    <div style={{ ...cmsVars(theme), minHeight: "calc(100vh - 20px)", borderRadius: R.x3, border: "1px solid var(--hc-border)", backgroundColor: "var(--hc-bg)", backgroundImage: appBg(theme), color: "var(--hc-fg)", padding: "26px 30px" } as any}>
      {/* Header + tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{kind === "design" ? "Design" : "Brand"} studio</h1>
          <p style={{ color: "var(--hc-fg-muted)", ...TYPE.base, margin: "4px 0 0" }}>Pick your industry, choose a recommended {noun}, preview it live, then make it yours.</p>
        </div>
        <div style={{ display: "inline-flex", background: "var(--hc-muted)", borderRadius: R.lg, padding: 4 }}>
          {(["create", "library"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); if (t === "library") refreshLib(); }} style={{ padding: "8px 16px", borderRadius: R.md, border: "none", background: tab === t ? "var(--hc-card)" : "transparent", color: tab === t ? "var(--hc-primary)" : "var(--hc-fg-muted)", fontWeight: 700, ...TYPE.sm, cursor: "pointer", boxShadow: tab === t ? "var(--hc-shadow-sm)" : "none" }}>{t === "create" ? "Create" : `Library (${lib.length})`}</button>
          ))}
        </div>
      </div>

      {tab === "create" ? (
        <>
          {/* Industry cards */}
          <div style={{ margin: "22px 0 10px", fontWeight: 700, ...TYPE.sm, color: "var(--hc-fg-muted)" }}>1 · Choose your industry</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {INDUSTRIES.map((ind) => {
              const on = industry === ind.key;
              return (
                <button key={ind.key} onClick={() => setIndustry(ind.key)} style={{ ...card, textAlign: "left", padding: 18, cursor: "pointer", border: `1.5px solid ${on ? "var(--hc-primary)" : "var(--hc-border)"}`, background: on ? "var(--hc-primary-10)" : "var(--hc-card)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: R.lg, display: "grid", placeItems: "center", background: on ? "var(--hc-primary)" : "var(--hc-muted)", color: on ? "#fff" : "var(--hc-primary)", marginBottom: 12 }}><ind.Icon size={20} color={on ? "#fff" : "var(--hc-primary)"} /></div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{ind.label}</div>
                  <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm, marginTop: 3 }}>{ind.blurb}</div>
                </button>
              );
            })}
          </div>

          {/* Recommendation cards */}
          {industry && (
            <>
              <div style={{ margin: "26px 0 10px", fontWeight: 700, ...TYPE.sm, color: "var(--hc-fg-muted)" }}>2 · Recommended {noun}s for {industryLabel(industry)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {(PRESETS[industry] || []).map((p) => (
                  <div key={p.id} style={card}>
                    <div style={{ padding: 16 }}>
                      <PaletteRow palette={p.palette} />
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 12 }}>{p.name}</div>
                      <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm, marginTop: 3, minHeight: 34 }}>{p.blurb}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 14px" }}>
                        <span style={{ ...TYPE.sm, fontWeight: 600, color: "var(--hc-fg-muted)", background: "var(--hc-muted)", padding: "3px 9px", borderRadius: R.full }}>{p.font}</span>
                        <span style={{ ...TYPE.sm, fontWeight: 600, color: "var(--hc-primary)", background: "var(--hc-primary-10)", padding: "3px 9px", borderRadius: R.full }}>{p.framework}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setPreview(p)} style={btn()}><MonitorIcon size={14} /> Preview</button>
                        <button onClick={() => { setCapture(p); }} style={btn(true)}>Use this {noun}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        // Library
        <div style={{ marginTop: 22 }}>
          {lib.length === 0 ? <div style={{ color: "var(--hc-fg-muted)", ...TYPE.base, padding: "40px 0", textAlign: "center" }}>No {noun}s yet — create one from the Create tab and it’ll appear here.</div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {lib.map((item) => {
                const pal = (item.data?.palette || []).map((c: any) => c.hex || c).slice(0, 5);
                return (
                  <div key={item.id} style={card}>
                    <div style={{ height: 132, overflow: "hidden", background: "var(--hc-muted)", position: "relative" }}>
                      <iframe title={item.name} sandbox="allow-same-origin" scrolling="no" tabIndex={-1} srcDoc={libHtml(item)} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 900, border: "none", transform: "scale(0.278)", transformOrigin: "top left", pointerEvents: "none", background: "#fff" }} />
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                      <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm, marginBottom: 8 }}>{item.industry || industryLabel(industry || "")}</div>
                      {pal.length > 0 && <div style={{ marginBottom: 10 }}><PaletteRow palette={pal} /></div>}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setViewItem(item)} style={btn()}>Preview</button>
                        <button onClick={() => setEditItem(JSON.parse(JSON.stringify(item)))} style={btn()}><PencilIcon size={13} /> Edit</button>
                        <button onClick={() => download(item)} style={btn()}>Download</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
        </div>
      )}

      {/* Preview modal (recommendation) */}
      {preview && (
        <Modal wide onClose={() => setPreview(null)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hc-border)" }}>
            <div><b>{preview.name}</b> <span style={{ color: "var(--hc-fg-muted)", ...TYPE.sm }}>· {preview.framework} · {preview.layout}</span></div>
            <div style={{ display: "flex", gap: 8 }}><button onClick={() => { setCapture(preview); setPreview(null); }} style={btn(true)}>Use this {noun}</button><button onClick={() => setPreview(null)} style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", color: "var(--hc-fg-muted)" }}><XIcon size={18} /></button></div>
          </div>
          <div style={{ flex: 1, background: "var(--hc-muted)", overflow: "auto" }}><iframe title="preview" srcDoc={mockHtml(kind, preview, org)} style={{ width: "100%", height: "70vh", border: "none", display: "block", background: "#fff" }} /></div>
        </Modal>
      )}

      {/* Capture modal */}
      {capture && (
        <Modal onClose={() => !busy && setCapture(null)}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--hc-border)" }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Tell us about your organization</div>
            <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm }}>Applying <b>{capture.name}</b> for {industryLabel(industry || "")}. This tailors the {noun} to you.</div>
          </div>
          <div style={{ padding: 18, display: "grid", gap: 12, overflow: "auto" }}>
            {([["name", "Organization name", "e.g. Qahwa Coffee"], ["tagline", "Tagline / one-liner", "e.g. Artisan coffee, delivered warm"], ["audience", "Target audience", "e.g. urban professionals in Riyadh"]] as const).map(([k, label, ph]) => (
              <label key={k} style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>{label}</div>
                <input value={(org as any)[k]} onChange={(e) => setOrg((o) => ({ ...o, [k]: e.target.value }))} placeholder={ph} style={{ width: "100%", height: 40, borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", padding: "0 12px", ...TYPE.base }} /></label>
            ))}
            <label style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>Anything else? (optional)</div>
              <textarea value={org.notes} onChange={(e) => setOrg((o) => ({ ...o, notes: e.target.value }))} rows={3} placeholder="Values, must-haves, references…" style={{ width: "100%", borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", padding: 12, ...TYPE.base, resize: "none", fontFamily: "inherit" }} /></label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 18px", borderTop: "1px solid var(--hc-border)" }}>
            <button onClick={() => setCapture(null)} disabled={busy} style={btn()}>Cancel</button>
            <button onClick={create} disabled={busy} style={btn(true)}>{busy ? "Creating…" : `Create ${noun}`}</button>
          </div>
        </Modal>
      )}

      {/* Library item preview / edit modal */}
      {viewItem && (
        <Modal wide onClose={() => setViewItem(null)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hc-border)" }}>
            <b>{viewItem.name}</b>
            <div style={{ display: "flex", gap: 8 }}><button onClick={() => download(viewItem)} style={btn()}>Download</button><button onClick={() => setViewItem(null)} style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", color: "var(--hc-fg-muted)" }}><XIcon size={18} /></button></div>
          </div>
          <div style={{ flex: 1, background: "var(--hc-muted)", overflow: "auto" }}><iframe title="item" srcDoc={libHtml(viewItem)} style={{ width: "100%", height: "70vh", border: "none", display: "block", background: "#fff" }} /></div>
        </Modal>
      )}

      {/* Full editor modal */}
      {editItem && (
        <Modal wide onClose={() => !busy && setEditItem(null)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hc-border)" }}>
            <b>Edit · {editItem.name}</b>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => download(editItem)} style={btn()}>Download</button>
              <button onClick={saveEdit} disabled={busy} style={btn(true)}>{busy ? "Saving…" : "Save changes"}</button>
              <button onClick={() => !busy && setEditItem(null)} style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", color: "var(--hc-fg-muted)" }}><XIcon size={18} /></button>
            </div>
          </div>
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Left — edit form */}
            <div style={{ width: 360, flexShrink: 0, borderRight: "1px solid var(--hc-border)", overflow: "auto", padding: 16, display: "grid", gap: 14, alignContent: "start" }}>
              <label style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>Name</div>
                <input value={editItem.name || ""} onChange={(e) => setField("name", e.target.value)} style={{ width: "100%", height: 38, borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", padding: "0 12px", ...TYPE.base }} /></label>
              <label style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>Tagline / summary</div>
                <input value={editItem.summary || ""} onChange={(e) => setField("summary", e.target.value)} style={{ width: "100%", height: 38, borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", padding: "0 12px", ...TYPE.base }} /></label>

              <div>
                {editItem.data?.keyVisual && <img src={editItem.data.keyVisual} alt="key visual" style={{ width: "100%", height: 84, objectFit: "cover", borderRadius: R.md, marginBottom: 8, display: "block" }} />}
                <button onClick={genHero} disabled={imgBusy} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 14px", borderRadius: R.lg, border: "1px solid var(--hc-primary)", background: "var(--hc-primary-10)", color: "var(--hc-primary)", fontWeight: 700, ...TYPE.sm, cursor: imgBusy ? "wait" : "pointer" }}>
                  <SparkIcon size={15} color="var(--hc-primary)" /> {imgBusy ? (kind === "brand" ? "Generating key visual…" : "Generating hero image…") : editItem.data?.keyVisual ? "Regenerate AI image" : (kind === "brand" ? "Generate AI key visual" : "Generate AI hero image")}
                </button>
                <div style={{ fontSize: 12, color: "var(--hc-fg-muted)", marginTop: 6 }}>{kind === "brand" ? "Renders a bespoke moodboard/key visual for this brand." : "Renders a bespoke hero and drops it into the page background."}</div>
              </div>

              {kind === "brand" ? (
                <>
                  <div><div style={{ fontWeight: 700, ...TYPE.sm, marginBottom: 8 }}>Palette</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {(editItem.data?.palette || []).map((c: any, i: number) => { const hex = c?.hex || c; return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input type="color" value={hex} onChange={(e) => setSwatch(i, e.target.value)} style={{ width: 34, height: 30, border: "1px solid var(--hc-border)", borderRadius: R.md, padding: 0, background: "transparent", cursor: "pointer" }} />
                          <span style={{ ...TYPE.sm, flex: 1, color: "var(--hc-fg-muted)" }}>{c?.name || `Colour ${i + 1}`}</span>
                          <code style={{ ...TYPE.sm, color: "var(--hc-fg-muted)" }}>{hex}</code>
                        </div>
                      ); })}
                    </div>
                  </div>
                  {(editItem.data?.sections || []).length > 0 && <div style={{ fontWeight: 700, ...TYPE.sm }}>Sections</div>}
                  {(editItem.data?.sections || []).map((s: any, i: number) => (
                    <label key={i} style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>{s.title || `Section ${i + 1}`}</div>
                      <textarea value={s.content || ""} onChange={(e) => setSection(i, e.target.value)} rows={4} style={{ width: "100%", borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", padding: 10, ...TYPE.sm, resize: "vertical", fontFamily: "inherit" }} /></label>
                  ))}
                </>
              ) : (
                <label style={{ ...TYPE.sm }}><div style={{ fontWeight: 700, marginBottom: 5 }}>Page HTML</div>
                  <textarea value={editItem.data?.html || ""} onChange={(e) => setData("html", e.target.value)} rows={16} spellCheck={false} style={{ width: "100%", borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-muted)", color: "var(--hc-fg)", padding: 10, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: 1.5, resize: "vertical" }} /></label>
              )}
            </div>
            {/* Right — live preview */}
            <div style={{ flex: 1, minWidth: 0, background: "var(--hc-muted)", overflow: "auto" }}>
              <iframe title="edit-preview" sandbox="allow-same-origin" srcDoc={editPreviewHtml(kind, editItem)} style={{ width: "100%", height: "72vh", border: "none", display: "block", background: "#fff" }} />
            </div>
          </div>
        </Modal>
      )}

      {toast && <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "var(--hc-fg)", color: "var(--hc-bg)", padding: "11px 18px", borderRadius: R.full, ...TYPE.sm, fontWeight: 700, boxShadow: "var(--hc-shadow-lg)" }}>{toast}</div>}
    </div>
  );
}
