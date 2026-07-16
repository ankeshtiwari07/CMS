"use client";
import React, { useEffect, useRef, useState } from "react";

type Section = { id: string; heading: string; body: string };
type OutlineItem = { heading: string; intent: string };
const uid = () => `c${Math.random().toString(36).slice(2, 9)}`;

// Tiny markdown -> HTML (headings, bold/italic, code, lists, paragraphs).
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const lines = String(md || "").split(/\r?\n/);
  let html = "", listType: "ul" | "ol" | null = null;
  const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>").replace(/`(.+?)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { closeList(); const lvl = m[1].length; html += `<h${lvl}>${inline(m[2])}</h${lvl}>`; }
    else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (listType !== "ul") { closeList(); listType = "ul"; html += "<ul>"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) { if (listType !== "ol") { closeList(); listType = "ol"; html += "<ol>"; } html += `<li>${inline(m[1])}</li>`; }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  closeList();
  return html;
}

export default function ContentStudio({ projectId }: { projectId: string | null }) {
  const urlPrompt = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prompt") || "" : "";
  const [phase, setPhase] = useState<"prompt" | "outline" | "editor">("prompt");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState(urlPrompt);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [preview, setPreview] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(projectId);
  const autoRan = useRef(false);
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2400); };

  useEffect(() => {
    if (projectId) {
      setBusy("Loading…");
      fetch(`/api/article/${projectId}`).then((r) => r.json()).then((d) => {
        if (d?.sections) { setTitle(d.title || ""); setSubtitle(d.subtitle || ""); setSections(d.sections.map((s: any) => ({ ...s, id: s.id || uid() }))); setPhase("editor"); setSavedId(d.id); setPrompt(d.prompt || ""); }
      }).finally(() => setBusy(""));
    }
  }, [projectId]);

  const genOutline = async () => {
    if (!prompt.trim()) return;
    setErr(""); setBusy("Planning the article…");
    try {
      const r = await fetch("/api/article/outline", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Failed to plan");
      setTitle(j.title || prompt); setSubtitle(j.subtitle || ""); setOutline(j.sections); setPhase("outline");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  useEffect(() => { if (!projectId && prompt.trim() && !autoRan.current) { autoRan.current = true; genOutline(); } /* eslint-disable-next-line */ }, []);

  const genArticle = async (fromOutline: boolean) => {
    setErr(""); setBusy("Writing your article… ~20s");
    try {
      const body: any = { prompt: prompt || title };
      if (fromOutline) body.outline = { title, subtitle, sections: outline };
      const r = await fetch("/api/article", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Generation failed");
      setTitle(j.title); setSubtitle(j.subtitle || ""); setSections(j.sections.map((s: any) => ({ ...s, id: s.id || uid() }))); setPhase("editor");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  const upd = (i: number, patch: Partial<Section>) => setSections((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => setSections((ss) => { const j = i + d; if (j < 0 || j >= ss.length) return ss; const n = [...ss]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const regen = async (i: number) => {
    const s = sections[i]; setBusy(`Rewriting “${s.heading}”…`);
    try { const r = await fetch("/api/article/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, section: s }) }); const j = await r.json(); if (j.id) upd(i, { heading: j.heading, body: j.body }); } catch { flash("Regenerate failed"); } finally { setBusy(""); }
  };

  const fullMd = () => `# ${title}\n${subtitle ? `\n_${subtitle}_\n` : ""}\n` + sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n");
  const fullHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/[<>]/g, "")}</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1a1a1a}h1{font-size:34px}h2{margin-top:32px}code{background:#f2f2f2;padding:2px 5px;border-radius:4px}</style></head><body><h1>${title}</h1>${subtitle ? `<p><em>${subtitle}</em></p>` : ""}${sections.map((s) => `<h2>${s.heading}</h2>${mdToHtml(s.body)}`).join("")}</body></html>`;
  const download = (name: string, content: string, mime: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = name; a.click(); };
  const slug = () => (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "article");
  const save = async () => {
    setBusy("Saving…");
    try { const r = await fetch("/api/article/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: savedId, title, subtitle, prompt, sections }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "Save failed"); setSavedId(j.id); flash("Saved to Projects"); } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };

  const shell: React.CSSProperties = { background: "#fff", borderRadius: 14, minHeight: "calc(100vh - 20px)", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.06)" };
  const btn = (x?: React.CSSProperties): React.CSSProperties => ({ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--hairline)", background: "var(--card-bg,#fff)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink)", ...x });
  const primaryBtn = btn({ background: "var(--studio-primary)", color: "#fff", border: "none" });

  if (phase === "prompt") {
    return (<div style={shell}><div style={{ maxWidth: 760, margin: "6vh auto 0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--studio-primary)", letterSpacing: 1 }}>CONTENT STUDIO</div>
      <h1 style={{ fontSize: 32, margin: "8px 0 6px", color: "var(--ink)" }}>Write long-form content</h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Describe the article, blog or press piece. HUMAIN plans an outline you can edit, writes it section by section, and lets you refine, export (MD / HTML / DOC) and save.</p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. A 1,200-word thought-leadership article on sovereign AI for enterprises in the Gulf — audience: CIOs; confident, practical tone." style={{ width: "100%", minHeight: 140, padding: 16, borderRadius: 12, border: "1px solid var(--hairline)", fontSize: 16, resize: "vertical", fontFamily: "inherit", background: "var(--card-bg,#fff)", color: "var(--ink)" }} />
      {err && <div style={{ color: "#b42318", marginTop: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button style={primaryBtn} disabled={!!busy || !prompt.trim()} onClick={genOutline}>{busy || "Plan outline →"}</button>
        <button style={btn()} disabled={!!busy || !prompt.trim()} onClick={() => genArticle(false)}>Skip — write it now</button>
      </div></div></div>);
  }

  if (phase === "outline") {
    return (<div style={shell}><div style={{ maxWidth: 760, margin: "3vh auto 0" }}>
      <button style={btn({ marginBottom: 14 })} onClick={() => setPhase("prompt")}>← Back</button>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", fontSize: 26, fontWeight: 700, border: "none", borderBottom: "2px solid var(--hairline)", padding: "6px 2px", color: "var(--ink)", background: "transparent", marginBottom: 14 }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>OUTLINE — edit, reorder or remove before writing</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {outline.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--soft-bg,#fafcfb)" }}>
            <span style={{ color: "var(--studio-primary)", fontWeight: 800, minWidth: 22 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <input value={o.heading} onChange={(e) => setOutline((os) => os.map((x, k) => k === i ? { ...x, heading: e.target.value } : x))} style={{ width: "100%", fontWeight: 600, border: "none", background: "transparent", fontSize: 15, color: "var(--ink)", outline: "none" }} />
              <input value={o.intent} onChange={(e) => setOutline((os) => os.map((x, k) => k === i ? { ...x, intent: e.target.value } : x))} style={{ width: "100%", border: "none", background: "transparent", fontSize: 13, color: "var(--muted)", marginTop: 3, outline: "none" }} />
            </div>
            <button style={btn({ padding: "4px 8px" })} onClick={() => setOutline((os) => os.filter((_, k) => k !== i))}>✕</button>
          </div>
        ))}
      </div>
      <button style={btn({ marginTop: 10 })} onClick={() => setOutline((os) => [...os, { heading: "New section", intent: "" }])}>+ Add section</button>
      {err && <div style={{ color: "#b42318", marginTop: 12 }}>{err}</div>}
      <div style={{ marginTop: 20 }}><button style={primaryBtn} disabled={!!busy} onClick={() => genArticle(true)}>{busy || `Write ${outline.length} sections →`}</button></div>
    </div></div>);
  }

  // editor
  return (<div style={shell}>
    {notice && <div style={{ position: "fixed", top: 16, right: 16, background: "var(--studio-primary)", color: "#fff", padding: "8px 14px", borderRadius: 8, zIndex: 50 }}>{notice}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16, maxWidth: 900, margin: "0 auto 16px" }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: 22, fontWeight: 800, border: "none", color: "var(--ink)", flex: 1, minWidth: 220, background: "transparent", outline: "none" }} />
      <button style={btn(preview ? { background: "var(--mint-pill)" } : {})} onClick={() => setPreview((p) => !p)}>{preview ? "Edit" : "Preview"}</button>
      <button style={btn()} onClick={() => download(`${slug()}.md`, fullMd(), "text/markdown")}>MD</button>
      <button style={btn()} onClick={() => download(`${slug()}.html`, fullHtml(), "text/html")}>HTML</button>
      <button style={btn()} onClick={() => download(`${slug()}.doc`, fullHtml(), "application/msword")}>DOC</button>
      <button style={primaryBtn} disabled={!!busy} onClick={save}>{savedId ? "Update" : "Save"}</button>
    </div>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle / dek (optional)" style={{ width: "100%", fontSize: 16, color: "var(--muted)", border: "none", borderBottom: "1px solid var(--hairline)", padding: "4px 2px 10px", marginBottom: 18, background: "transparent", outline: "none" }} />
      {busy && <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--studio-teal-dark)", fontSize: 13, marginBottom: 12 }}><span className="humain-spin" style={{ width: 16, height: 16, border: "2.5px solid var(--mint-pill)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block" }} /> {busy}<style>{`@keyframes humain-spin{to{transform:rotate(360deg)}}.humain-spin{animation:humain-spin .7s linear infinite}`}</style></div>}
      {preview ? (
        <article style={{ lineHeight: 1.75, color: "var(--ink)", fontSize: 16 }} dangerouslySetInnerHTML={{ __html: sections.map((s) => `<h2 style="margin-top:28px">${s.heading}</h2>${mdToHtml(s.body)}`).join("") }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {sections.map((s, i) => (
            <div key={s.id} style={{ border: "1px solid var(--hairline)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input value={s.heading} onChange={(e) => upd(i, { heading: e.target.value })} style={{ flex: 1, fontSize: 17, fontWeight: 700, border: "none", color: "var(--ink)", background: "transparent", outline: "none" }} />
                <button style={btn({ padding: "4px 8px" })} disabled={!!busy} onClick={() => regen(i)} title="Regenerate">↻</button>
                <button style={btn({ padding: "4px 8px" })} onClick={() => move(i, -1)}>↑</button>
                <button style={btn({ padding: "4px 8px" })} onClick={() => move(i, 1)}>↓</button>
                <button style={btn({ padding: "4px 8px", color: "#b42318" })} onClick={() => setSections((ss) => ss.filter((_, k) => k !== i))}>✕</button>
              </div>
              <textarea value={s.body} onChange={(e) => upd(i, { body: e.target.value })} style={{ width: "100%", minHeight: 150, border: "1px solid var(--hairline)", borderRadius: 8, padding: 12, fontSize: 14.5, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", color: "var(--ink)", background: "var(--card-bg,#fff)", outline: "none" }} />
            </div>
          ))}
          <button style={btn()} onClick={() => setSections((ss) => [...ss, { id: uid(), heading: "New section", body: "" }])}>+ Add section</button>
        </div>
      )}
    </div>
  </div>);
}
