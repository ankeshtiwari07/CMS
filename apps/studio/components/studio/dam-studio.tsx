"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Rendition = { name: string; url: string; width?: number; height?: number; filesize?: number };
type Asset = {
  id: string | number; filename: string; url: string; mimeType: string; filesize: number;
  width?: number; height?: number; alt?: string; usageRights?: string; aiGenerated?: boolean; createdAt?: string; sizes: Rendition[];
};

const TEAL = "#00a18b", INK = "#0b1416", LINE = "#e3ebe9", MUT = "#5a6a6c";
const kb = (n?: number) => (n == null ? "—" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const isImg = (m?: string) => (m || "").startsWith("image/");

export default function DamStudio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [store, setStore] = useState<string>("humain-media");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [altDraft, setAltDraft] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function open(a: Asset) { setSel(a); setAltDraft(a.alt || ""); }

  async function saveAlt() {
    if (!sel) return;
    setSavingAlt(true);
    try {
      const r = await fetch(`/api/dam/${sel.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ alt: altDraft }) });
      if (r.ok) { setAssets((xs) => xs.map((x) => (x.id === sel.id ? { ...x, alt: altDraft } : x))); setSel({ ...sel, alt: altDraft }); }
    } catch {}
    setSavingAlt(false);
  }

  async function load() {
    try {
      const d = await fetch("/api/dam").then((r) => r.json());
      setAssets(d.assets || []); setStore(d.store || "humain-media");
    } catch { setMsg("Could not load assets."); }
  }
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      setMsg(`Uploading ${f.name} → S3/MinIO…`);
      try {
        const fd = new FormData(); fd.append("file", f); fd.append("alt", f.name.replace(/\.[a-z0-9]+$/i, ""));
        const r = await fetch("/api/dam", { method: "POST", body: fd });
        if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(`Upload failed: ${e.error || r.status}`); }
      } catch { setMsg(`Upload failed: ${f.name}`); }
    }
    setBusy(false); setMsg(""); await load();
  }

  async function del(a: Asset) {
    if (!confirm(`Delete “${a.filename}” from the asset store?`)) return;
    await fetch(`/api/dam/${a.id}`, { method: "DELETE" });
    setSel(null); await load();
  }

  const shown = useMemo(() => assets.filter((a) => !q.trim() || (a.filename + " " + (a.alt || "")).toLowerCase().includes(q.toLowerCase())), [assets, q]);
  const totalBytes = useMemo(() => assets.reduce((s, a) => s + (a.filesize || 0), 0), [assets]);

  const card: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 14, background: "#fff" };

  return (
    <div style={{ background: "#fff", borderRadius: 16, minHeight: "calc(100vh - 20px)", padding: "22px 26px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: INK }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: TEAL, textTransform: "uppercase" }}>Digital Asset Management</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#159a5b", background: "#e7f6ee", border: `1px solid ${LINE}`, padding: "3px 9px", borderRadius: 999 }}>
          ● Storage: self-hosted S3 / MinIO · bucket “{store}”
        </span>
      </div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, letterSpacing: "-.01em" }}>Asset Library</h1>
      <p style={{ color: MUT, margin: 0, maxWidth: "72ch", fontSize: 14.5 }}>
        Every asset — uploaded or agent-generated — is stored in the object store behind the media API, with responsive renditions and AI alt-text. {assets.length} asset{assets.length === 1 ? "" : "s"} · {kb(totalBytes)}.
      </p>

      {/* toolbar */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets…" style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 13.5, outline: "none", minWidth: 220 }} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: TEAL, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Uploading…" : "Upload assets"}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,video/*" style={{ display: "none" }} onChange={(e) => upload(e.target.files)} />
        {msg && <span style={{ color: MUT, fontSize: 13 }}>{msg}</span>}
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginTop: 18 }}>
        {shown.map((a) => (
          <div key={a.id} onClick={() => open(a)} style={{ ...card, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ height: 130, background: "#f4f8f7", display: "grid", placeItems: "center", borderBottom: `1px solid ${LINE}` }}>
              {isImg(a.mimeType)
                ? <img src={(a.sizes.find((s) => s.name === "thumbnail")?.url) || a.url} alt={a.alt || a.filename} style={{ maxWidth: "100%", maxHeight: 130, objectFit: "contain" }} />
                : <div style={{ fontSize: 34 }}>📄</div>}
            </div>
            <div style={{ padding: "9px 11px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.filename}</div>
              <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{a.width && a.height ? `${a.width}×${a.height} · ` : ""}{kb(a.filesize)}</div>
              {a.alt && <div style={{ marginTop: 5 }}><span style={{ fontSize: 9.5, fontWeight: 700, color: TEAL, background: "#e7f6ef", padding: "1px 6px", borderRadius: 5 }}>AI alt-text</span></div>}
            </div>
          </div>
        ))}
        {shown.length === 0 && <div style={{ color: MUT, fontSize: 14, gridColumn: "1/-1", padding: "40px 0", textAlign: "center" }}>No assets yet — click “Upload assets”.</div>}
      </div>

      {/* detail modal */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(6,16,12,.5)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 860, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{sel.filename}</div>
              <button onClick={() => setSel(null)} style={{ border: `1px solid ${LINE}`, background: "#fff", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
              <div style={{ background: "#f4f8f7", borderRadius: 12, display: "grid", placeItems: "center", minHeight: 240, border: `1px solid ${LINE}` }}>
                {isImg(sel.mimeType) ? <img src={sel.url} alt={sel.alt || sel.filename} style={{ maxWidth: "100%", maxHeight: 360 }} /> : <div style={{ fontSize: 60 }}>📄</div>}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                <Row k="Type" v={sel.mimeType} />
                <Row k="Dimensions" v={sel.width && sel.height ? `${sel.width} × ${sel.height}` : "—"} />
                <Row k="Size" v={kb(sel.filesize)} />
                <Row k="Store" v={`S3 / MinIO · ${store}`} />
                <Row k="Uploaded" v={sel.createdAt ? new Date(sel.createdAt).toLocaleString() : "—"} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 4 }}>AI alt-text (editable)</div>
                  <textarea value={altDraft} onChange={(e) => setAltDraft(e.target.value)} rows={2}
                    style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, resize: "vertical", outline: "none", color: INK }} />
                  <button onClick={saveAlt} disabled={savingAlt || altDraft === (sel.alt || "")}
                    style={{ marginTop: 6, border: "none", background: TEAL, color: "#fff", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12.5, cursor: savingAlt ? "default" : "pointer", opacity: savingAlt || altDraft === (sel.alt || "") ? 0.5 : 1 }}>
                    {savingAlt ? "Saving…" : "Save alt-text"}
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 4 }}>Renditions ({sel.sizes.length})</div>
                  {sel.sizes.map((s) => (
                    <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#334" }}>
                      <span style={{ textTransform: "capitalize" }}>{s.name}</span><span style={{ color: MUT }}>{s.width}×{s.height} · {kb(s.filesize)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 4 }}>Public URL</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input readOnly value={sel.url} style={{ flex: 1, fontSize: 11.5, padding: "6px 8px", border: `1px solid ${LINE}`, borderRadius: 7, color: MUT }} />
                    <button onClick={() => navigator.clipboard?.writeText(sel.url)} style={{ border: `1px solid ${LINE}`, background: "#fff", borderRadius: 7, padding: "0 10px", cursor: "pointer", fontSize: 12 }}>Copy</button>
                  </div>
                </div>
                <button onClick={() => del(sel)} style={{ marginTop: 16, border: "1px solid #f0c4bd", background: "#fff", color: "#c0392b", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete asset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <span style={{ width: 96, color: "#5a6a6c", flexShrink: 0 }}>{k}</span>
      <span style={{ color: "#22302e", wordBreak: "break-word" }}>{v}</span>
    </div>
  );
}
