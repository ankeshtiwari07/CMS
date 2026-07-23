"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { id: string | number; title: string; status?: string; updatedAt?: string };
const TEAL = "var(--primary)", INK = "var(--background)", LINE = "var(--hairline)", MUT = "var(--text-muted)";

// Grouped collection catalogue (mirrors the API allowlist).
const CATALOG: { group: string; items: { slug: string; label: string }[] }[] = [
  { group: "Content", items: [["articles", "Articles"], ["blogPosts", "Blog Posts"], ["pressReleases", "Press Releases"], ["events", "Events"], ["products", "Products"], ["caseStudies", "Case Studies"], ["faqs", "FAQs"], ["careers", "Careers"], ["leadership", "Leadership"], ["mediaGalleries", "Media Galleries"], ["campaignMicrosites", "Campaign Microsites"], ["pages", "Pages"], ["tags", "Tags"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Building blocks", items: [["components", "Components"], ["media", "Media"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Create", items: [["aiwebsites", "Websites & Pages"], ["decks", "Decks"], ["projects", "Projects"], ["conversations", "Conversations"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Studio", items: [["brandGuidelines", "Brand Guidelines"], ["sites", "Sites"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Governance", items: [["approvals", "Approvals"], ["auditLog", "Audit Log"]].map(([slug, label]) => ({ slug, label })) },
  { group: "System", items: [["users", "Users"]].map(([slug, label]) => ({ slug, label })) },
];
const GLOBALS = [{ slug: "navigation", label: "Navigation" }, { slug: "settings", label: "Site Settings" }];
const SKIP = new Set(["id", "createdAt", "updatedAt", "sizes", "thumbnailURL"]);
const isScalar = (v: any) => v == null || ["string", "number", "boolean"].includes(typeof v);

export default function DataStudio({ initialCollection }: { initialCollection: string | null }) {
  const [coll, setColl] = useState<string | null>(initialCollection);
  const [globalSlug, setGlobalSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState<any | null>(null);
  const [editVals, setEditVals] = useState<Record<string, string>>({});
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const label = useMemo(() => {
    for (const g of CATALOG) { const it = g.items.find((x) => x.slug === coll); if (it) return it.label; }
    return coll || "";
  }, [coll]);

  async function loadList(slug: string, pg = 1, query = "") {
    setColl(slug); setGlobalSlug(null); setDoc(null); setBusy("list"); setMsg("");
    try {
      const d = await fetch(`/api/manage/${slug}?page=${pg}&q=${encodeURIComponent(query)}`).then((r) => r.json());
      setRows(d.rows || []); setPage(d.page || 1); setTotalPages(d.totalPages || 1); setTotal(d.totalDocs || 0);
    } catch { setMsg("Load failed."); } finally { setBusy(""); }
  }
  useEffect(() => { if (initialCollection) loadList(initialCollection); }, []); // eslint-disable-line

  function openDoc(d: any, asNew = false) {
    setDoc(d); setIsNew(asNew);
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(d)) { if (SKIP.has(k)) continue; v[k] = isScalar(val) ? (val == null ? "" : String(val)) : JSON.stringify(val, null, 2); }
    setEditVals(v);
  }
  async function edit(id: string | number) {
    setBusy("get");
    try { const d = await fetch(`/api/manage/${coll}/${id}`).then((r) => r.json()); if (d.doc) openDoc(d.doc, false); } catch { setMsg("Load failed."); } finally { setBusy(""); }
  }
  async function newDoc() {
    // Template from an existing record's shape (empty values); else blank.
    let tpl: any = {};
    if (rows[0]) { try { const d = await fetch(`/api/manage/${coll}/${rows[0].id}`).then((r) => r.json()); for (const [k, val] of Object.entries(d.doc || {})) { if (SKIP.has(k)) continue; tpl[k] = isScalar(val) ? "" : (Array.isArray(val) ? [] : {}); } } catch {} }
    openDoc(tpl, true);
  }
  function build(): any {
    const out: any = {};
    for (const [k, raw] of Object.entries(editVals)) {
      const orig = doc?.[k];
      if (!isScalar(orig) || (isNew && (raw.trim().startsWith("{") || raw.trim().startsWith("[")))) { try { out[k] = JSON.parse(raw); } catch { /* skip invalid json */ } }
      else if (typeof orig === "boolean") out[k] = raw === "true";
      else if (typeof orig === "number") out[k] = raw === "" ? null : Number(raw);
      else out[k] = raw;
    }
    return out;
  }
  async function save() {
    setBusy("save"); setMsg("");
    try {
      const payload = build();
      const url = isNew ? `/api/manage/${coll}` : `/api/manage/${coll}/${doc.id}`;
      const r = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (r.ok) { setMsg(isNew ? "Created ✓" : "Saved ✓"); setDoc(null); loadList(coll!, page, q); }
      else setMsg(j.error || "Save failed.");
    } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }
  async function del(id: string | number) {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/manage/${coll}/${id}`, { method: "DELETE" }); setDoc(null); loadList(coll!, page, q);
  }
  async function openGlobal(slug: string) {
    setGlobalSlug(slug); setColl(null); setRows([]); setBusy("get");
    try { const d = await fetch(`/api/manage/global/${slug}`).then((r) => r.json()); if (d.doc) { setDoc({ ...d.doc, _global: slug }); const v: Record<string, string> = {}; for (const [k, val] of Object.entries(d.doc)) { if (SKIP.has(k)) continue; v[k] = isScalar(val) ? (val == null ? "" : String(val)) : JSON.stringify(val, null, 2); } setEditVals(v); setIsNew(false); } } catch {} finally { setBusy(""); }
  }
  async function saveGlobal() {
    setBusy("save");
    try { const r = await fetch(`/api/manage/global/${globalSlug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(build()) }); setMsg(r.ok ? "Saved ✓" : "Save failed."); } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }

  const card: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 12, background: "var(--card)" };
  const inp: React.CSSProperties = { width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${LINE}`, fontSize: 13, outline: "none", color: INK };
  const btn = (p?: boolean, dis?: boolean): React.CSSProperties => ({ padding: "7px 13px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: dis ? "default" : "pointer", border: p ? "none" : `1px solid ${LINE}`, background: p ? TEAL : "var(--card)", color: p ? "var(--primary-foreground)" : INK, opacity: dis ? 0.5 : 1 });

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, minHeight: "calc(100vh - 20px)", display: "flex", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: INK, overflow: "hidden" }}>
      {/* collection rail */}
      <div style={{ width: 220, borderInlineEnd: `1px solid ${LINE}`, padding: "18px 12px", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", color: TEAL, textTransform: "uppercase", padding: "0 6px 8px" }}>CMS Data</div>
        {CATALOG.map((g) => (
          <div key={g.group} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, padding: "4px 6px" }}>{g.group}</div>
            {g.items.map((it) => (
              <div key={it.slug} onClick={() => loadList(it.slug)} style={{ padding: "6px 8px", borderRadius: 7, cursor: "pointer", fontSize: 13, background: coll === it.slug ? "color-mix(in srgb, var(--success) 12%, var(--background))" : "transparent", color: coll === it.slug ? TEAL : "var(--ink)", fontWeight: coll === it.slug ? 700 : 500 }}>{it.label}</div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, padding: "4px 6px" }}>Globals</div>
        {GLOBALS.map((it) => <div key={it.slug} onClick={() => openGlobal(it.slug)} style={{ padding: "6px 8px", borderRadius: 7, cursor: "pointer", fontSize: 13, background: globalSlug === it.slug ? "color-mix(in srgb, var(--success) 12%, var(--background))" : "transparent", color: globalSlug === it.slug ? TEAL : "var(--ink)", fontWeight: globalSlug === it.slug ? 700 : 500 }}>{it.label}</div>)}
      </div>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, padding: "20px 24px", overflowY: "auto" }}>
        {!coll && !globalSlug && (
          <div style={{ color: MUT, marginTop: 60, textAlign: "center" }}>
            <h1 style={{ color: INK, fontSize: 24, marginBottom: 6 }}>CMS Data — native back-office</h1>
            Full create / read / update / delete over every collection and global, via the Payload API. Pick a collection on the left.
          </div>
        )}

        {/* record editor (collection or global) */}
        {doc && (
          <div style={{ ...card, padding: 18, maxWidth: 720 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <b style={{ fontSize: 16 }}>{globalSlug ? `Global · ${globalSlug}` : isNew ? `New ${label}` : `Edit ${label} #${doc.id}`}</b>
              {!globalSlug && <button onClick={() => setDoc(null)} style={btn(false)}>← Back to list</button>}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {Object.keys(editVals).map((k) => {
                const orig = doc[k]; const complex = !isScalar(orig) || (isNew && (editVals[k].trim().startsWith("{") || editVals[k].trim().startsWith("[")));
                return (
                  <label key={k} style={{ display: "block" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: MUT }}>{k}{typeof orig === "boolean" ? " (true/false)" : complex ? " (JSON)" : ""}</span>
                    {complex
                      ? <textarea value={editVals[k]} onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))} rows={4} style={{ ...inp, fontFamily: "ui-monospace,monospace", fontSize: 11.5, marginTop: 3 }} />
                      : (String(editVals[k]).length > 80
                        ? <textarea value={editVals[k]} onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))} rows={3} style={{ ...inp, marginTop: 3 }} />
                        : <input value={editVals[k]} onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))} style={{ ...inp, marginTop: 3 }} />)}
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
              <button style={btn(true, !!busy)} disabled={!!busy} onClick={globalSlug ? saveGlobal : save}>{busy === "save" ? "Saving…" : globalSlug ? "Save global" : isNew ? "Create" : "Save"}</button>
              {!globalSlug && !isNew && <button style={{ ...btn(false), color: "var(--destructive)", borderColor: "color-mix(in srgb, var(--destructive) 30%, var(--background))" }} onClick={() => del(doc.id)}>Delete</button>}
              {msg && <span style={{ color: MUT, fontSize: 13 }}>{msg}</span>}
            </div>
          </div>
        )}

        {/* list */}
        {coll && !doc && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, margin: 0 }}>{label}</h1>
              <span style={{ fontSize: 12, color: MUT }}>{total} record{total === 1 ? "" : "s"}</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadList(coll, 1, q)} placeholder="Search…" style={{ ...inp, width: 200, marginInlineStart: "auto" }} />
              <button style={btn(true)} onClick={newDoc}>+ New</button>
              {msg && <span style={{ color: MUT, fontSize: 13 }}>{msg}</span>}
            </div>
            <div style={{ ...card, overflow: "hidden" }}>
              {rows.map((r) => (
                <div key={r.id} onClick={() => edit(r.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${LINE}`, cursor: "pointer" }}>
                  <span style={{ fontSize: 11, color: MUT, width: 48, flexShrink: 0 }}>#{r.id}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                  {r.status && <span style={{ fontSize: 10.5, fontWeight: 700, color: r.status === "published" || r.status === "live" ? "var(--success)" : "var(--warning)", textTransform: "uppercase" }}>{r.status}</span>}
                </div>
              ))}
              {rows.length === 0 && <div style={{ padding: 24, color: MUT, textAlign: "center", fontSize: 13 }}>{busy ? "Loading…" : "No records."}</div>}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", fontSize: 13, color: MUT }}>
                <button style={btn(false, page <= 1)} disabled={page <= 1} onClick={() => loadList(coll, page - 1, q)}>← Prev</button>
                <span>Page {page} / {totalPages}</span>
                <button style={btn(false, page >= totalPages)} disabled={page >= totalPages} onClick={() => loadList(coll, page + 1, q)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
