"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Block = { id?: string; kind: string; brief?: string; html: string; componentKey?: string | null; componentSource?: string };
type LibComp = { id: string; name: string; key: string; type: string; status: string; html: string };
type Item = { id: string; title: string; contentType: string; status: string; blocks: number; updatedAt: string };

const TEAL = "#00a18b", INK = "#0b1416", LINE = "#e3ebe9", MUT = "#5a6a6c";
const TYPES = [{ v: "page", l: "Page" }, { v: "blog", l: "Blog" }, { v: "post", l: "Post" }];
const sourceBadge = (b: Block) =>
  b.componentSource === "library" ? { t: `◆ Reused · ${b.componentKey}`, c: "#159a5b", bg: "#e7f6ee" }
  : b.componentSource === "delegated" ? { t: `✦ AI-delegated · ${b.componentKey || ""}`, c: "#8a5a00", bg: "#fbf1e0" }
  : { t: "◇ Generated", c: MUT, bg: "#eef2f0" };

function assemble(blocks: Block[]): string {
  return `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fff}img{max-width:100%}</style></head><body>${blocks.map((b) => b.html).join("\n")}</body></html>`;
}

export default function PageStudio() {
  const [contentType, setContentType] = useState("page");
  const [prompt, setPrompt] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [brand, setBrand] = useState<any>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [lib, setLib] = useState<LibComp[]>([]);
  const [picker, setPicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [delegation, setDelegation] = useState<any>(null);

  async function loadList() { try { const d = await fetch("/api/page").then((r) => r.json()); setItems(d.items || []); } catch {} }
  useEffect(() => { loadList(); fetch("/api/components").then((r) => r.json()).then((j) => setLib((j.docs || []).filter((c: any) => c.status === "live").map((c: any) => ({ id: c.id, name: c.name, key: c.key, type: c.type, status: c.status, html: c.html || "" })))).catch(() => {}); }, []);

  async function generate() {
    if (!prompt.trim()) { setMsg("Describe the content first."); return; }
    setBusy("gen"); setMsg("Composing from the component library…"); setDelegation(null);
    try {
      const d = await fetch("/api/page", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, contentType }) }).then((r) => r.json());
      if (!d?.ok) { setMsg(d?.error || "Generation failed"); return; }
      setId(d.id); setTitle(d.title); setBlocks(d.blocks || []); setBrand(d.brand || {}); setDelegation(d.delegation); setMsg("");
      loadList();
    } catch { setMsg("Generation failed."); } finally { setBusy(""); }
  }
  async function load(it: Item) {
    setBusy("load");
    try { const d = await fetch(`/api/page/${it.id}`).then((r) => r.json()); setId(d.id); setTitle(d.title); setBlocks(d.blocks || []); setBrand(d.brand || {}); setContentType(d.contentType || "page"); setMsg(""); } catch {} finally { setBusy(""); }
  }
  async function save() {
    if (!id) return; setBusy("save"); setMsg("Saving…");
    try { const r = await fetch(`/api/page/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ blocks, title, brand }) }); setMsg(r.ok ? "Saved." : "Save failed."); loadList(); } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }
  async function publish() {
    if (!id) return; setBusy("pub"); await save();
    try {
      const r = await fetch(`/api/page/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      if (r.ok) setMsg("Published ✓");
      else setMsg("Sent for approval — a Brand Manager/Admin publishes it (Flow A/B). It's in the Review Queue.");
    } catch { setMsg("Publish failed."); } finally { setBusy(""); loadList(); }
  }

  const move = (i: number, d: number) => setBlocks((b) => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) return b; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const del = (i: number) => setBlocks((b) => b.filter((_, k) => k !== i));
  const editBlock = (i: number, html: string) => setBlocks((b) => b.map((x, k) => (k === i ? { ...x, html } : x)));
  const addFromLib = (c: LibComp) => { setBlocks((b) => [...b, { kind: c.type, html: c.html, componentKey: c.key, componentSource: "library" }]); setPicker(false); };

  const previewDoc = useMemo(() => assemble(blocks), [blocks]);
  const card: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 12, background: "#fff" };
  const btn = (p?: boolean, dis?: boolean): React.CSSProperties => ({ padding: "8px 13px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: dis ? "default" : "pointer", border: p ? "none" : `1px solid ${LINE}`, background: p ? TEAL : "#fff", color: p ? "#fff" : INK, opacity: dis ? 0.55 : 1 });

  return (
    <div style={{ background: "#fff", borderRadius: 16, minHeight: "calc(100vh - 20px)", padding: "22px 26px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: INK }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: TEAL, textTransform: "uppercase" }}>Pages · Blogs · Posts</div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, letterSpacing: "-.01em" }}>Library Page Builder</h1>
      <p style={{ color: MUT, margin: 0, maxWidth: "72ch", fontSize: 14.5 }}>Generate a page, blog or post <b>composed from your component library</b> — the builder reuses live components and delegates any gaps to the Component Agent. Then reorder, edit, add or remove blocks (full CRUD) and publish through the approval flow.</p>

      {/* compose */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ padding: "9px 11px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 13.5 }}>{TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} placeholder={`Describe the ${contentType} to compose…`} style={{ flex: 1, minWidth: 260, padding: "9px 12px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 13.5, outline: "none" }} />
        <button style={btn(true, !!busy)} disabled={!!busy} onClick={generate}>{busy === "gen" ? "Composing…" : "Compose from library"}</button>
        {msg && <span style={{ color: MUT, fontSize: 13 }}>{msg}</span>}
      </div>
      {delegation && <div style={{ marginTop: 8, fontSize: 12.5, color: MUT }}>Reused <b style={{ color: "#159a5b" }}>{delegation.reused?.length || 0}</b> live component(s) · <b style={{ color: "#8a5a00" }}>{delegation.created?.length || 0}</b> new component(s) delegated{delegation.gated ? " (draft, pending approval)" : ""}.</div>}

      {blocks.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, alignItems: "start" }}>
          {/* blocks CRUD */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontWeight: 800, fontSize: 15, border: "none", outline: "none", flex: 1, color: INK }} />
              <span style={{ fontSize: 11, color: MUT }}>{blocks.length} blocks</span>
            </div>
            <div style={{ display: "grid", gap: 8, maxHeight: 460, overflow: "auto" }}>
              {blocks.map((b, i) => { const sb = sourceBadge(b); return (
                <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: INK, textTransform: "capitalize" }}>{b.kind}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: sb.c, background: sb.bg, padding: "1px 7px", borderRadius: 5 }}>{sb.t}</span>
                    <span style={{ marginInlineStart: "auto", display: "flex", gap: 4 }}>
                      <button title="Up" onClick={() => move(i, -1)} style={mini}>↑</button>
                      <button title="Down" onClick={() => move(i, 1)} style={mini}>↓</button>
                      <button title="Edit HTML" onClick={() => setEditing(editing === i ? null : i)} style={mini}>✎</button>
                      <button title="Delete" onClick={() => del(i)} style={{ ...mini, color: "#c0392b" }}>🗑</button>
                    </span>
                  </div>
                  {editing === i
                    ? <textarea value={b.html} onChange={(e) => editBlock(i, e.target.value)} rows={5} style={{ width: "100%", marginTop: 7, fontFamily: "ui-monospace,monospace", fontSize: 11, border: `1px solid ${LINE}`, borderRadius: 7, padding: 7 }} />
                    : <iframe title={`b${i}`} srcDoc={b.html} style={{ width: "100%", height: 90, border: `1px solid ${LINE}`, borderRadius: 7, marginTop: 7, background: "#fff", pointerEvents: "none" }} />}
                </div>
              ); })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button style={btn(false)} onClick={() => setPicker(true)}>+ Add block from library</button>
              <button style={btn(false, !!busy)} disabled={!!busy} onClick={save}>Save</button>
              <button style={btn(true, !!busy)} disabled={!!busy} onClick={publish}>Publish</button>
            </div>
          </div>
          {/* live preview */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Live preview</div>
            <iframe title="preview" srcDoc={previewDoc} style={{ width: "100%", height: 520, border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff" }} />
          </div>
        </div>
      )}

      {/* existing content */}
      {items.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Your pages / blogs / posts</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
            {items.map((it) => (
              <div key={it.id} onClick={() => load(it)} style={{ ...card, padding: "11px 13px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: TEAL, textTransform: "uppercase" }}>{it.contentType}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: it.status === "published" ? "#159a5b" : "#8a5a00" }}>{it.status}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div>
                <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{it.blocks} blocks</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* library picker */}
      {picker && (
        <div onClick={() => setPicker(false)} style={{ position: "fixed", inset: 0, background: "rgba(6,16,12,.5)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 720, width: "100%", maxHeight: "80vh", overflow: "auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><b>Add a live library component</b><button onClick={() => setPicker(false)} style={mini}>✕</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {lib.map((c) => (
                <div key={c.id} onClick={() => addFromLib(c)} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 10, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MUT }}>{c.type} · {c.key}</div>
                </div>
              ))}
              {lib.length === 0 && <div style={{ color: MUT, fontSize: 13 }}>No live components in the library yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mini: React.CSSProperties = { border: `1px solid ${LINE}`, background: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 12, lineHeight: 1, color: "#334" };
