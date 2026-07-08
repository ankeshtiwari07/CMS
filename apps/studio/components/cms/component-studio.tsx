"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cmsVars, appBg, R, TYPE, type Theme } from "@/components/cms/cms-tokens";
import { LayersIcon, PlusIcon, SparkIcon, TrashIcon, GlobeIcon, XIcon, CheckIcon } from "@/components/icons";

type Comp = { id: string | number; name: string; key?: string; type: string; category?: string; status: string; html?: string; description?: string };
type Block = { uid: string; comp: Comp };

const TYPES = ["container", "section", "hero", "text", "image", "gallery", "card", "feature", "cta", "testimonial", "stats", "logoCloud", "pricing", "faq", "nav", "footer", "form", "banner"];

// A neutral wrapper so bare component markup renders reasonably in the canvas.
function pageDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0b1416;background:#fff;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
section,header,footer{padding:32px}
h1,h2,h3{margin:0 0 .35em;line-height:1.2}
p{margin:0;color:#54636a;line-height:1.6}
a{color:#009688}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1040px;margin:0 auto}
.features .card{background:#f6faf9;border:1px solid #e7efed;border-radius:14px;padding:22px}
.features .card i{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:11px;background:#e2f3f0;color:#009688;font-style:normal;font-size:19px;margin-bottom:12px}
.features .card h3{font-size:16px}
.features .card p{font-size:14px}
.cta-band{background:#009688;color:#fff;border-radius:16px;text-align:center;display:grid;gap:16px;place-items:center;padding:44px;max-width:1040px;margin:0 auto}
.cta-band h2{color:#fff;font-size:25px}
.cta-band a{display:inline-block;background:#fff;color:#009688;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none}
.hero-split{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center;max-width:1040px;margin:0 auto}
.hero-split h1{font-size:32px}
.hero-split .copy p{margin-bottom:20px;font-size:16px}
.hero-split .copy a{display:inline-block;background:#009688;color:#fff;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none}
.hero-split .media img{width:100%;border-radius:16px}
@media(max-width:680px){.features{grid-template-columns:1fr}.hero-split{grid-template-columns:1fr}}
</style></head><body>${html}</body></html>`;
}

// Sample data used to PREVIEW component templates ({{field}} / {{#each items}})
// as neat visual blocks on the canvas instead of raw Handlebars source.
const SAMPLE_ITEMS = [
  { icon: "✦", title: "Fast & reliable", body: "Ship on-brand pages in minutes with reusable, governed components." },
  { icon: "◆", title: "AI-assisted", body: "Generate a section from a prompt, then review and publish with confidence." },
  { icon: "●", title: "Multilingual", body: "Author once in English or Arabic and localise across every market." },
];
const SAMPLE: Record<string, string> = {
  title: "Build on-brand pages, faster",
  headline: "Create with HUMAIN",
  subhead: "A governed content studio for teams that move fast.",
  body: "Short, descriptive copy that explains the value in a line or two.",
  label: "Get started", ctaLabel: "Get started", href: "#", ctaHref: "#", icon: "✦",
  image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='520'%3E%3Crect width='800' height='520' fill='%23d9efeb'/%3E%3Crect x='56' y='56' width='688' height='408' rx='18' fill='%23bfe3dc'/%3E%3C/svg%3E",
};
// Minimal, dependency-free Handlebars-ish renderer: expands {{#each items}}...{{/each}}
// with SAMPLE_ITEMS, then fills remaining {{field}} tokens from SAMPLE. Plain HTML
// (e.g. AI-generated inline-styled sections) passes through untouched.
function renderTemplate(html?: string): string {
  if (!html) return "";
  let out = html.replace(/\{\{#each\s+\w+\}\}([\s\S]*?)\{\{\/each\}\}/g, (_m, inner) =>
    SAMPLE_ITEMS.map((it: any) => inner.replace(/\{\{\s*(\w+)\s*\}\}/g, (_x: string, k: string) => it[k] ?? SAMPLE[k] ?? "")).join(""));
  out = out.replace(/\{\{\s*(\w+)\s*\}\}/g, (_x: string, k: string) => SAMPLE[k] ?? "");
  return out;
}

export default function ComponentStudio({ user, canPublish }: { user: { name?: string; email: string; roles?: string[] }; canPublish: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [lib, setLib] = useState<Comp[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filter, setFilter] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", type: "section", status: "live", html: "", description: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const uidRef = useRef(0);

  useEffect(() => { setTheme((localStorage.getItem("humain-cms-theme") as Theme) || "light"); }, []);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  async function loadLib() {
    try { const r = await fetch("/api/components"); const j = await r.json(); setLib((j.docs || []).map((d: any) => ({ id: d.id, name: d.name, key: d.key, type: d.type, category: d.category, status: d.status, html: d.html, description: d.description }))); } catch {}
  }
  useEffect(() => { loadLib(); }, []);

  const shown = useMemo(() => lib.filter((c) => !filter || (c.name + c.type + (c.category || "")).toLowerCase().includes(filter.toLowerCase())), [lib, filter]);
  const assembled = useMemo(() => blocks.map((b) => renderTemplate(b.comp.html) || `<!-- ${b.comp.name} -->`).join("\n"), [blocks]);

  const addBlock = (c: Comp) => setBlocks((b) => [...b, { uid: `b${uidRef.current++}`, comp: c }]);
  const move = (i: number, d: number) => setBlocks((b) => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) return b; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (uid: string) => setBlocks((b) => b.filter((x) => x.uid !== uid));

  // AI: generate a component's HTML from a description, then open the save form.
  async function aiGenerate(prompt: string) {
    if (!prompt.trim() || busy) return;
    setBusy(true); flash("Generating component with AI…");
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "websiteBuild", prompt: `Design ONE reusable, self-contained, production-quality website section (not a full page) for: ${prompt}. Requirements: semantic HTML5; ALL styling inline via style attributes (no <style> tags, no CSS classes, no external CSS/JS/fonts/images); use the HUMAIN brand — teal #009688 primary accents on a light background, generous padding, rounded corners (12–16px), and a clear type hierarchy; make it responsive with a sensible max-width and flexible layout; fill it with realistic sample copy (never leave {{placeholders}}). Return ONLY the HTML for that one <section>.` }) });
      const j = await r.json();
      const html = String(j.artifact || "").trim();
      if (!html || /credit|balance|error/i.test(html.slice(0, 60))) { flash("AI unavailable (check model credits)"); setBusy(false); return; }
      setForm({ name: prompt.slice(0, 40), type: "section", status: "live", html, description: prompt });
      setShowNew(true); setAiPrompt("");
    } catch { flash("Generation failed"); }
    setBusy(false);
  }

  async function saveComponent() {
    if (!form.name.trim() || !form.html.trim()) { flash("Name and HTML are required"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/components", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { flash("Component saved to the library"); setShowNew(false); setForm({ name: "", type: "section", status: "live", html: "", description: "" }); await loadLib(); }
      else { const e = await r.json().catch(() => ({})); flash(e.error || "Save failed"); }
    } catch { flash("Save failed"); }
    setBusy(false);
  }

  function downloadPage() {
    const blob = new Blob([pageDoc(assembled)], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "humain-page.html"; a.click();
    flash("Downloaded page HTML");
  }
  function previewPage() {
    const w = window.open("", "_blank"); if (w) { w.document.write(pageDoc(assembled)); w.document.close(); }
  }

  const isAdmin = (user.roles || []).includes("admin");
  const card = { background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.x2, boxShadow: "var(--hc-shadow-sm)" } as const;

  return (
    <div style={{ ...cmsVars(theme), height: "calc(100vh - 20px)", borderRadius: R.x3, border: "1px solid var(--hc-border)", overflow: "hidden", display: "flex", flexDirection: "column", color: "var(--hc-fg)", backgroundColor: "var(--hc-bg)", backgroundImage: appBg(theme) } as any}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--hc-border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 12px", borderRadius: R.full, background: "var(--hc-primary-10)", color: "var(--hc-primary)", fontWeight: 700, ...TYPE.sm }}><LayersIcon size={15} color="var(--hc-primary)" /> Component Studio</span>
        <span style={{ color: "var(--hc-fg-muted)", ...TYPE.sm }}>Drag blocks onto the canvas — or generate one with AI</span>
        <div style={{ flex: 1 }} />
        <button onClick={previewPage} disabled={!blocks.length} style={btn(false, !blocks.length)}>Preview</button>
        <button onClick={downloadPage} disabled={!blocks.length} style={btn(false, !blocks.length)}>Download</button>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT — library palette */}
        <aside style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--hc-border)", display: "flex", flexDirection: "column", padding: 14, gap: 10, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, ...TYPE.sm }}>Component Library</span>
            {isAdmin && <button onClick={() => { setForm({ name: "", type: "section", status: "live", html: "", description: "" }); setShowNew(true); }} style={{ ...btn(true, false), padding: "5px 10px" }}><PlusIcon size={13} color="#fff" /> New</button>}
          </div>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search components…" style={{ padding: "8px 11px", borderRadius: R.lg, border: "1px solid var(--hc-input)", background: "var(--hc-card)", color: "var(--hc-fg)", ...TYPE.sm, outline: "none" }} />
          {isAdmin && (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && aiGenerate(aiPrompt)} placeholder="Generate a component with AI…" style={{ flex: 1, padding: "8px 11px", borderRadius: R.lg, border: "1px solid var(--hc-input)", background: "var(--hc-card)", color: "var(--hc-fg)", ...TYPE.sm, outline: "none" }} />
              <button onClick={() => aiGenerate(aiPrompt)} disabled={busy || !aiPrompt.trim()} title="Generate with AI" style={{ ...btn(true, busy || !aiPrompt.trim()), padding: "0 11px" }}><SparkIcon size={15} color="#fff" /></button>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", display: "grid", gap: 8, alignContent: "start", paddingRight: 2 }}>
            {shown.length === 0 && <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm, padding: 8 }}>No components yet. Create one with “New”, or generate with AI.</div>}
            {shown.map((c) => (
              <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(c.id))} onClick={() => addBlock(c)} title="Drag onto the canvas, or click to add"
                style={{ ...card, padding: 12, cursor: "grab", display: "grid", gap: 8, alignContent: "start" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 700, ...TYPE.sm }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: c.status === "live" ? "var(--hc-success)" : "var(--hc-warning)" }}>{c.status}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  <span style={pill()}>{c.type}</span>
                  {c.category && <span style={pill()}>{c.category}</span>}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER — page canvas */}
        <section style={{ flex: 1, minWidth: 0, padding: 16, overflowY: "auto" }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData("text/plain"); const c = lib.find((x) => String(x.id) === id); if (c) addBlock(c); }}>
          {blocks.length === 0 ? (
            <div style={{ height: "100%", minHeight: 300, border: `2px dashed ${dragOver ? "var(--hc-primary)" : "var(--hc-border)"}`, borderRadius: R.x2, display: "grid", placeItems: "center", color: "var(--hc-fg-muted)", textAlign: "center", padding: 24 }}>
              <div>
                <GlobeIcon size={26} color="var(--hc-fg-muted)" />
                <div style={{ fontWeight: 700, marginTop: 10, ...TYPE.base }}>Build a page</div>
                <div style={{ ...TYPE.sm, marginTop: 4 }}>Drag components from the left, or click one to add it here.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, maxWidth: 1040, margin: "0 auto" }}>
              {blocks.map((b, i) => (
                <div key={b.uid} style={{ ...card, overflow: "hidden", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--hc-border)", background: "var(--hc-ghost)" }}>
                    <LayersIcon size={13} color="var(--hc-primary)" />
                    <span style={{ fontWeight: 700, ...TYPE.sm }}>{b.comp.name}</span>
                    <span style={pill()}>{b.comp.type}</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => move(i, -1)} disabled={i === 0} style={miniBtn(i === 0)} title="Move up">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={miniBtn(i === blocks.length - 1)} title="Move down">↓</button>
                    <button onClick={() => remove(b.uid)} style={miniBtn(false)} title="Remove"><TrashIcon size={13} color="var(--hc-destructive)" /></button>
                  </div>
                  <iframe title={b.comp.name} srcDoc={pageDoc(renderTemplate(b.comp.html) || `<section style="padding:40px;text-align:center;color:#888">${b.comp.name} — no HTML yet</section>`)} style={{ width: "100%", height: 240, border: "none", background: "#fff", display: "block" }} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: "var(--hc-fg)", color: "var(--hc-bg)", padding: "10px 18px", borderRadius: R.full, ...TYPE.sm, fontWeight: 600, boxShadow: "var(--hc-shadow-lg)", zIndex: 90 }}>{toast}</div>}

      {/* New / AI-review component modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 100 }} onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...cmsVars(theme), width: 620, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", background: "var(--hc-card)", color: "var(--hc-fg)", borderRadius: R.x2, boxShadow: "var(--hc-shadow-xl)", padding: 18 } as any}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, ...TYPE.base }}>{form.html ? "Review & save component" : "New component"}</span>
              <button onClick={() => setShowNew(false)} style={miniBtn(false)}><XIcon size={14} /></button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <label style={lbl()}>Name<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inp()} /></label>
              <div style={{ display: "flex", gap: 10 }}>
                <label style={{ ...lbl(), flex: 1 }}>Type
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inp()}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                </label>
                <label style={{ ...lbl(), flex: 1 }}>Status
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inp()}><option value="live">live</option><option value="draft">draft</option></select>
                </label>
              </div>
              <label style={lbl()}>HTML<textarea value={form.html} onChange={(e) => setForm((f) => ({ ...f, html: e.target.value }))} rows={8} style={{ ...inp(), fontFamily: "ui-monospace,monospace", fontSize: 12.5, resize: "vertical" }} /></label>
              {form.html && <iframe title="preview" srcDoc={pageDoc(renderTemplate(form.html))} style={{ width: "100%", height: 180, border: "1px solid var(--hc-border)", borderRadius: R.lg, background: "#fff" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowNew(false)} style={btn(false, false)}>Cancel</button>
              <button onClick={saveComponent} disabled={busy} style={btn(true, busy)}><CheckIcon size={14} color="#fff" /> Save to library</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function pill(): any { return { display: "inline-flex", alignItems: "center", alignSelf: "center", flex: "0 0 auto", width: "fit-content", height: "fit-content", fontSize: 11, fontWeight: 700, lineHeight: 1.4, whiteSpace: "nowrap", padding: "3px 9px", borderRadius: R.full, background: "var(--hc-primary-10)", color: "var(--hc-primary)" }; }
  function btn(primary: boolean, disabled: boolean): any { return { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: R.lg, border: primary ? "none" : "1px solid var(--hc-border)", background: primary ? "var(--hc-primary)" : "var(--hc-card)", color: primary ? "#fff" : "var(--hc-fg)", fontWeight: 700, ...TYPE.sm, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }; }
  function miniBtn(disabled: boolean): any { return { width: 26, height: 26, borderRadius: R.md, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", display: "grid", placeItems: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, fontSize: 13 }; }
  function lbl(): any { return { display: "grid", gap: 5, fontWeight: 700, ...TYPE.sm, color: "var(--hc-fg)" }; }
  function inp(): any { return { padding: "9px 11px", borderRadius: R.lg, border: "1px solid var(--hc-input)", background: "var(--hc-card)", color: "var(--hc-fg)", ...TYPE.sm, outline: "none", fontWeight: 400, width: "100%" }; }
}
