"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Brand = { bg: string; ink: string; muted: string; accent: string; accent2: string; line: string; soft: string; font?: string; radius?: number };
type Section = { id: string; kind: string; brief: string; html?: string };
type Plan = { title: string; description?: string; brand: Brand; sections: Section[] };

const uid = () => `w${Math.random().toString(36).slice(2, 9)}`;
const DEFAULT_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function assemble(title: string, brand: Brand, sections: Section[]): string {
  const body = sections.map((s) => s.html || "").filter(Boolean).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(title || "").replace(/[<>]/g, "")}</title><style>*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:${brand.bg};color:${brand.ink};font-family:${brand.font || DEFAULT_FONT};line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}img{max-width:100%;display:block}details>summary{cursor:pointer;list-style:none}details>summary::-webkit-details-marker{display:none}</style></head><body>${body}</body></html>`;
}
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default function WebsiteStudio({ siteId }: { siteId: string | null }) {
  const [phase, setPhase] = useState<"prompt" | "plan" | "editor">("prompt");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prompt") || "" : ""));
  const autoRan = useRef(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [site, setSite] = useState<{ title: string; brand: Brand; sections: Section[]; html: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(siteId);
  const [slug, setSlug] = useState("");
  const [publishedPath, setPublishedPath] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [aiEdit, setAiEdit] = useState("");
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2600); };

  useEffect(() => {
    if (!siteId) return;
    setBusy("Loading…");
    fetch(`/api/website/${siteId}`).then((r) => r.json()).then((d) => {
      if (d?.html) { setSite({ title: d.title, brand: d.brand, sections: d.sections || [], html: d.html }); setPrompt(d.prompt || ""); setSlug(d.slug || ""); setSavedId(d.id); setPhase("editor"); if (d.status === "published") setPublishedPath(`/site/${d.slug}`); }
    }).finally(() => setBusy(""));
  }, [siteId]);

  const genPlan = async () => {
    if (!prompt.trim()) return;
    setErr(""); setBusy("Planning the site…");
    try {
      const r = await fetch("/api/website/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Failed to plan");
      setPlan({ title: j.title, description: j.description, brand: j.brand, sections: j.sections.map((s: any) => ({ ...s, id: s.id || uid() })) });
      setSlug(slugify(j.title));
      setPhase("plan");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  // Arrived from the prompt box with ?prompt=... — plan sections automatically.
  useEffect(() => {
    if (!siteId && prompt.trim() && !autoRan.current) { autoRan.current = true; genPlan(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genSite = async (usePlan: boolean) => {
    setErr(""); setBusy("Designing sections in parallel… ~15s");
    try {
      const body: any = { prompt };
      if (usePlan && plan) body.plan = { title: plan.title, description: plan.description, brand: plan.brand, sections: plan.sections };
      const r = await fetch("/api/website", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "Generation failed");
      setSite({ title: j.title, brand: j.brand, sections: j.sections, html: j.html });
      if (!slug) setSlug(slugify(j.title));
      setPhase("editor");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  const regenSection = async (i: number) => {
    if (!site) return;
    const sec = site.sections[i];
    setBusy(`Rewriting ${sec.kind}…`);
    try {
      const r = await fetch("/api/website/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteTitle: site.title, sitePrompt: prompt, brand: site.brand, section: sec }) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "Failed");
      const sections = site.sections.map((s, k) => (k === i ? { ...s, html: j.html } : s));
      setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) });
      flash(`Regenerated ${sec.kind}`);
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };
  const removeSection = (i: number) => { if (!site) return; const sections = site.sections.filter((_, k) => k !== i); setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) }); };
  const moveSection = (i: number, d: -1 | 1) => { if (!site) return; const j = i + d; if (j < 0 || j >= site.sections.length) return; const sections = [...site.sections]; [sections[i], sections[j]] = [sections[j], sections[i]]; setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) }); };

  const save = async (publish: boolean) => {
    if (!site) return;
    setBusy(publish ? "Publishing…" : "Saving…");
    try {
      const r = await fetch("/api/website/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: savedId, title: site.title, slug: slug || slugify(site.title), prompt, brand: site.brand, sections: site.sections, html: site.html, status: publish ? "published" : "draft" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setSavedId(j.id);
      if (publish) { setPublishedPath(j.path || `/site/${slug}`); flash("Published"); } else flash("Saved to CMS");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };
  const exportHtml = () => {
    if (!site) return;
    const blob = new Blob([site.html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${slugify(site.title) || "site"}.html`; a.click();
  };
  // Open the assembled site full-screen / standalone in a new tab.
  const preview = () => {
    if (!site) return;
    const w = window.open("", "_blank");
    if (w) { w.document.open(); w.document.write(site.html); w.document.close(); }
  };

  // D2 — edit the EXISTING saved site with a natural-language instruction. The
  // Website Builder agent plans edit ops and regenerates only affected sections.
  const aiEditSite = async () => {
    if (!site || !aiEdit.trim()) return;
    if (!savedId) { flash("Save the site first, then edit it with AI."); return; }
    setErr(""); setBusy("Editing with AI…");
    try {
      const r = await fetch(`/api/website/${savedId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction: aiEdit }) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "AI edit failed");
      setSite({ ...site, sections: (j.sections && j.sections.length ? j.sections : site.sections), html: j.html });
      const n = Array.isArray(j.changed) ? j.changed.length : 0;
      flash(n ? `AI updated ${n} section${n > 1 ? "s" : ""}` : "AI applied your edit");
      setAiEdit("");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };

  const shell: React.CSSProperties = { background: "#fff", borderRadius: 14, minHeight: "calc(100vh - 20px)", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.06)" };
  const btn = (x?: React.CSSProperties): React.CSSProperties => ({ padding: "9px 14px", borderRadius: 9, border: "1px solid #d7e0dd", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1c3b34", ...x });
  const primaryBtn = btn({ background: "#0f6b5c", color: "#fff", border: "none" });

  if (phase === "prompt") {
    return (
      <div style={shell}>
        <div style={{ maxWidth: 780, margin: "6vh auto 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f6b5c", letterSpacing: 1 }}>WEBSITE STUDIO</div>
          <h1 style={{ fontSize: 34, margin: "8px 0 6px", color: "#12241f" }}>Generate a website</h1>
          <p style={{ color: "#5b6d67", marginTop: 0 }}>Describe the site. HUMAIN plans the sections, designs each one (Apple-style), assembles a complete responsive page, and publishes it to a live URL in the CMS.</p>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. The HUMAIN ONE marketing homepage — enterprise AI agents. Hero, 6 agent cards, operational domains, Build-Your-Own-Agent, platform, a payroll use-case stat, enterprise logos, FAQ, footer. Teal + lime, white, Apple.com layout."
            style={{ width: "100%", minHeight: 150, padding: 16, borderRadius: 12, border: "1px solid #d7e0dd", fontSize: 16, resize: "vertical", fontFamily: "inherit" }} />
          {err && <div style={{ color: "#b42318", marginTop: 12 }}>{err}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button style={primaryBtn} disabled={!!busy || !prompt.trim()} onClick={genPlan}>{busy || "Plan sections →"}</button>
            <button style={btn()} disabled={!!busy || !prompt.trim()} onClick={() => genSite(false)}>Skip — generate now</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "plan" && plan) {
    return (
      <div style={shell}>
        <div style={{ maxWidth: 800, margin: "3vh auto 0" }}>
          <button style={btn({ marginBottom: 14 })} onClick={() => setPhase("prompt")}>← Back</button>
          <input value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} style={{ width: "100%", fontSize: 26, fontWeight: 700, border: "none", borderBottom: "2px solid #e3ebe8", padding: "6px 2px", color: "#12241f", marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "10px 0 18px" }}>
            <span style={{ fontSize: 12, color: "#5b6d67", fontWeight: 700 }}>BRAND</span>
            {(["bg", "ink", "accent", "accent2"] as const).map((k) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 4 }} title={k}>
                <input type="color" value={(plan.brand as any)[k]} onChange={(e) => setPlan({ ...plan, brand: { ...plan.brand, [k]: e.target.value } })} style={{ width: 26, height: 26, border: "none", background: "none", padding: 0 }} />
              </label>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6d67", marginBottom: 10 }}>SECTIONS — edit, reorder or remove</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.sections.map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid #e3ebe8", background: "#fafcfb" }}>
                <span style={{ color: "#0f6b5c", fontWeight: 800, minWidth: 22 }}>{i + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0f6b5c", background: "#e6f4f1", padding: "3px 8px", borderRadius: 6, minWidth: 92, textAlign: "center" }}>{s.kind}</span>
                <input value={s.brief} onChange={(e) => setPlan({ ...plan, sections: plan.sections.map((x, k) => (k === i ? { ...x, brief: e.target.value } : x)) })} style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: "#12241f" }} />
                <button style={btn({ padding: "4px 8px" })} onClick={() => setPlan({ ...plan, sections: plan.sections.filter((_, k) => k !== i) })}>✕</button>
              </div>
            ))}
          </div>
          {err && <div style={{ color: "#b42318", marginTop: 12 }}>{err}</div>}
          <div style={{ marginTop: 20 }}><button style={primaryBtn} disabled={!!busy} onClick={() => genSite(true)}>{busy || `Generate ${plan.sections.length} sections →`}</button></div>
        </div>
      </div>
    );
  }

  if (!site) return <div style={shell}>{busy || "Loading…"}</div>;
  return (
    <div style={shell}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={site.title} onChange={(e) => setSite({ ...site, title: e.target.value })} style={{ fontSize: 20, fontWeight: 700, border: "none", color: "#12241f", minWidth: 200, flex: 1 }} />
        <div style={{ display: "flex", gap: 4, border: "1px solid #d7e0dd", borderRadius: 9, overflow: "hidden" }}>
          <button style={{ ...btn({ border: "none", borderRadius: 0, background: device === "desktop" ? "#e6f4f1" : "#fff" }) }} onClick={() => setDevice("desktop")}>🖥</button>
          <button style={{ ...btn({ border: "none", borderRadius: 0, background: device === "mobile" ? "#e6f4f1" : "#fff" }) }} onClick={() => setDevice("mobile")}>📱</button>
        </div>
        <span style={{ fontSize: 12, color: "#5b6d67" }}>/site/</span>
        <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} style={{ ...btn(), width: 150, fontWeight: 500 }} />
        <button style={btn()} disabled={!site} onClick={preview}>Preview</button>
        <button style={btn()} onClick={exportHtml}>Export HTML</button>
        <button style={btn()} disabled={!!busy} onClick={() => save(false)}>{savedId ? "Save" : "Save draft"}</button>
        <button style={primaryBtn} disabled={!!busy} onClick={() => save(true)}>Publish</button>
      </div>
      {notice && <div style={{ position: "fixed", top: 16, right: 16, background: "#0f6b5c", color: "#fff", padding: "8px 14px", borderRadius: 8, zIndex: 50 }}>{notice}</div>}
      {publishedPath && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#e6f4f1", borderRadius: 8, fontSize: 13 }}>✅ Published — live at <a href={publishedPath} target="_blank" rel="noreferrer" style={{ color: "#0f6b5c", fontWeight: 700 }}>{publishedPath}</a></div>}

      {/* D2 — edit the whole site by instruction (agent regenerates only what changes) */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, padding: 10, borderRadius: 10, border: "1px solid #d7e0dd", background: "#f6faf9" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f6b5c", whiteSpace: "nowrap" }}>✦ Edit with AI</span>
        <input value={aiEdit} onChange={(e) => setAiEdit(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") aiEditSite(); }}
          placeholder={savedId ? "Tell the agent what to change — e.g. “rewrite the hero headline to be punchier and add a testimonials section”" : "Save the site first to enable AI editing"}
          disabled={!savedId || !!busy}
          style={{ flex: 1, border: "1px solid #d7e0dd", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", background: savedId ? "#fff" : "#eef2f1" }} />
        <button style={primaryBtn} disabled={!!busy || !savedId || !aiEdit.trim()} onClick={aiEditSite}>{busy === "Editing with AI…" ? busy : "Apply edit"}</button>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 220, maxHeight: "calc(100vh - 130px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5b6d67", marginBottom: 2 }}>SECTIONS</div>
          {site.sections.map((s, i) => (
            <div key={s.id} style={{ padding: 10, borderRadius: 9, border: "1px solid #e3ebe8", background: "#fafcfb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0f6b5c" }}>{i + 1}. {s.kind}</span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button style={btn({ padding: "3px 7px", fontSize: 11 })} disabled={!!busy} onClick={() => regenSection(i)}>↻</button>
                <button style={btn({ padding: "3px 7px", fontSize: 11 })} onClick={() => moveSection(i, -1)}>↑</button>
                <button style={btn({ padding: "3px 7px", fontSize: 11 })} onClick={() => moveSection(i, 1)}>↓</button>
                <button style={btn({ padding: "3px 7px", fontSize: 11, color: "#b42318" })} onClick={() => removeSection(i)}>✕</button>
              </div>
            </div>
          ))}
          {busy && <div style={{ fontSize: 12, color: "#5b6d67", marginTop: 6 }}>{busy}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ margin: "0 auto", width: device === "mobile" ? 390 : "100%", transition: "width .2s", border: "1px solid #e3ebe8", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,.08)" }}>
            <iframe title="preview" srcDoc={site.html} style={{ width: "100%", height: "calc(100vh - 150px)", border: "none", background: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
