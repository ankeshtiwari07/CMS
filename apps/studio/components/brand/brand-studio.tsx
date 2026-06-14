"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparkIcon, TrashIcon, PlusIcon, BookmarkIcon, CheckIcon } from "@/components/icons";
import Markdown from "@/components/studio/markdown";

type Section = { id: string; type: string; title: string; content: string };
type Swatch = { name: string; hex: string; usage?: string };
type Guideline = {
  id?: string | number;
  name: string;
  industry?: string;
  summary?: string;
  source?: string;
  isActive?: boolean;
  isArchetype?: boolean;
  data?: { sections?: Section[]; palette?: Swatch[]; typography?: any };
  sections?: Section[];
  palette?: Swatch[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const secs = (g: Guideline | null): Section[] => (g ? g.sections || g.data?.sections || [] : []);
const pal = (g: Guideline | null): Swatch[] => (g ? g.palette || g.data?.palette || [] : []);

function toMarkdown(g: Guideline): string {
  let md = `# ${g.name}\n\n`;
  if (g.summary) md += `${g.summary}\n\n`;
  const p = pal(g);
  if (p.length) md += `## Colour Palette\n\n${p.map((c) => `- **${c.name}** \`${c.hex}\`${c.usage ? ` — ${c.usage}` : ""}`).join("\n")}\n\n`;
  for (const s of secs(g)) md += `## ${s.title}\n\n${s.content}\n\n`;
  return md.trim();
}
function toHtml(g: Guideline): string {
  const p = pal(g);
  const esc = (s: string) => String(s || "").replace(/</g, "&lt;");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(g.name)}</title>
<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 20px;color:#16242F;line-height:1.6}
h1{color:#0A5C58}h2{color:#0B7A75;border-bottom:2px solid #C8A45C;padding-bottom:4px;margin-top:32px}
.sw{display:inline-flex;align-items:center;gap:8px;border:1px solid #e2e8ec;border-radius:999px;padding:4px 12px 4px 6px;margin:4px 6px 4px 0}
.dot{width:18px;height:18px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.1)}</style></head><body>
<h1>${esc(g.name)}</h1>${g.summary ? `<p>${esc(g.summary)}</p>` : ""}
${p.length ? `<h2>Colour Palette</h2><div>${p.map((c) => `<span class="sw"><span class="dot" style="background:${esc(c.hex)}"></span>${esc(c.name)} · ${esc(c.hex)}${c.usage ? " · " + esc(c.usage) : ""}</span>`).join("")}</div>` : ""}
${secs(g).map((s) => `<h2>${esc(s.title)}</h2><div>${esc(s.content).replace(/\n/g, "<br>")}</div>`).join("")}
</body></html>`;
}
function download(name: string, content: string, mime: string, ext: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name.replace(/[^\w]+/g, "-").slice(0, 60) || "brand"}.${ext}`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BrandStudio({ archetypes, mine }: { archetypes: Guideline[]; mine: Guideline[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"recommend" | "library">("recommend");
  const [brief, setBrief] = useState({ industry: "", audience: "", tone: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [g, setG] = useState<Guideline | null>(null); // the guideline being viewed/verified
  const [editing, setEditing] = useState(false);
  const [dest, setDest] = useState<"library" | "active">("active");
  const [pub, setPub] = useState<{ s: "idle" | "busy" | "ok" | "err"; m?: string }>({ s: "idle" });

  async function recommend() {
    setBusy(true); setErr(null); setPub({ s: "idle" });
    try {
      const res = await fetch("/api/brand-guidelines/suggest", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(brief),
      });
      const d = await res.json();
      if (d.ok) {
        setG({ ...d.guideline, sections: (d.guideline.sections || []).map((s: Section) => ({ ...s, id: s.id || uid() })) });
        setEditing(false);
      } else setErr(d.message || "Could not generate.");
    } catch { setErr("Could not reach the generation service."); }
    setBusy(false);
  }

  function view(src: Guideline) {
    setG({ ...src, sections: secs(src).map((s) => ({ ...s, id: s.id || uid() })), palette: pal(src) });
    setEditing(false); setPub({ s: "idle" });
  }

  function patchSection(id: string, k: "title" | "content", v: string) {
    setG((cur) => cur ? { ...cur, sections: secs(cur).map((s) => s.id === id ? { ...s, [k]: v } : s) } : cur);
  }

  async function publish() {
    if (!g) return;
    setPub({ s: "busy" });
    try {
      const res = await fetch("/api/brand-guidelines", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: g.id, name: g.name, industry: g.industry, summary: g.summary, source: g.source || "ai",
          data: { sections: secs(g), palette: pal(g), typography: g.data?.typography },
          active: dest === "active",
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setG((cur) => cur ? { ...cur, id: d.doc?.id ?? cur.id, isActive: dest === "active" } : cur);
        setPub({ s: "ok", m: dest === "active" ? "Published — now the active brand the AI follows" : "Saved to Brand Library" });
        router.refresh();
      } else setPub({ s: "err", m: d.error || "Publish failed" });
    } catch { setPub({ s: "err", m: "Could not reach publish service" }); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 20, alignItems: "start" }}>
      {/* LEFT: recommend / library */}
      <div style={{ ...card, position: "sticky", top: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTab("recommend")} style={pill(tab === "recommend")}><SparkIcon size={15} /> Recommend</button>
          <button onClick={() => setTab("library")} style={pill(tab === "library")}><BookmarkIcon size={15} /> Library</button>
        </div>
        {tab === "recommend" ? (
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Describe your brand — the AI recommends a full guideline you can review, edit, publish or download.</p>
            <input placeholder="Industry (fintech, telecom, healthcare…)" value={brief.industry} onChange={(e) => setBrief({ ...brief, industry: e.target.value })} style={field} />
            <input placeholder="Target audience" value={brief.audience} onChange={(e) => setBrief({ ...brief, audience: e.target.value })} style={field} />
            <input placeholder="Desired tone (bold, trustworthy, premium…)" value={brief.tone} onChange={(e) => setBrief({ ...brief, tone: e.target.value })} style={field} />
            <textarea placeholder="Anything else? (values, competitors, must-haves)" value={brief.notes} onChange={(e) => setBrief({ ...brief, notes: e.target.value })} rows={3} style={{ ...field, resize: "vertical" }} />
            <button onClick={recommend} disabled={busy} style={{ ...primary, justifyContent: "center", height: 42 }}>
              <SparkIcon size={16} color="#fff" /> {busy ? "Recommending…" : "Recommend brand guideline"}
            </button>
            {err && <div style={{ color: "#b42318", fontSize: 13 }}>{err}</div>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>YOUR GUIDELINES</div>
              {mine.length ? mine.map((m) => (
                <button key={String(m.id)} onClick={() => view(m)} style={{ ...rowBtn, ...(g?.id === m.id ? rowOn : {}) }}>
                  {m.name}{m.isActive && <span style={activeTag}>ACTIVE</span>}
                </button>
              )) : <div style={{ fontSize: 13, color: "var(--muted)" }}>None yet — recommend one.</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>ARCHETYPE LIBRARY</div>
              {archetypes.map((a) => (
                <button key={String(a.id)} onClick={() => view(a)} style={{ ...rowBtn, ...(g?.id === a.id ? rowOn : {}) }}>{a.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: the viewable / verifiable guideline */}
      <div style={card}>
        {!g ? (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, padding: "60px 0", border: "1.5px dashed var(--hairline)", borderRadius: 12 }}>
            <SparkIcon size={26} /><div style={{ marginTop: 10 }}>Recommend a brand guideline, or open one from the library, to review it here.</div>
          </div>
        ) : (
          <>
            {/* action bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--studio-teal-dark)", letterSpacing: "0.04em" }}>{editing ? "EDITING" : "BRAND GUIDELINE"}</span>
                {g.isActive && <span style={activeTag}>ACTIVE</span>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => setEditing((e) => !e)} style={ghost}>{editing ? "Done" : "Edit"}</button>
                <button onClick={() => download(g.name, toMarkdown(g), "text/markdown", "md")} style={ghost}>Download .md</button>
                <button onClick={() => download(g.name, toHtml(g), "text/html", "html")} style={ghost}>Download .html</button>
                <select value={dest} onChange={(e) => setDest(e.target.value as any)} style={{ ...ghost, paddingRight: 8 }}>
                  <option value="active">Active Brand (AI follows)</option>
                  <option value="library">Brand Library</option>
                </select>
                <button onClick={publish} disabled={pub.s === "busy"} style={primary}>{pub.s === "busy" ? "Publishing…" : "Publish"}</button>
              </div>
            </div>
            {pub.s === "ok" && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--studio-teal-dark)", fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}><CheckIcon size={15} /> {pub.m}</div>}
            {pub.s === "err" && <div style={{ color: "#b42318", fontSize: 13.5, marginBottom: 12 }}>⚠ {pub.m}</div>}

            {/* title + summary */}
            {editing ? (
              <input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} style={{ ...field, fontSize: 22, fontWeight: 700, marginBottom: 8 }} />
            ) : (
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>{g.name}</h1>
            )}
            {editing ? (
              <textarea value={g.summary || ""} onChange={(e) => setG({ ...g, summary: e.target.value })} rows={2} style={{ ...field, marginBottom: 18, resize: "vertical" }} />
            ) : (g.summary && <p style={{ color: "var(--muted)", fontSize: 14.5, margin: "0 0 18px" }}>{g.summary}</p>)}

            {/* palette */}
            {pal(g).length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={sectionH}>Colour Palette</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {pal(g).map((c, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ width: 72, height: 72, borderRadius: 14, background: c.hex, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--shadow-card)" }} />
                      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{c.hex}</div>
                      {c.usage && <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.usage}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* sections */}
            <div style={{ display: "grid", gap: 18 }}>
              {secs(g).map((s) => (
                <div key={s.id}>
                  {editing ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input value={s.title} onChange={(e) => patchSection(s.id, "title", e.target.value)} style={{ ...field, fontWeight: 700, fontSize: 15 }} />
                        <button onClick={() => setG({ ...g, sections: secs(g).filter((x) => x.id !== s.id) })} title="Remove" style={{ ...ghost, color: "#b42318" }}><TrashIcon size={14} /></button>
                      </div>
                      <textarea value={s.content} onChange={(e) => patchSection(s.id, "content", e.target.value)} rows={5} style={{ ...field, resize: "vertical", lineHeight: 1.6 }} />
                    </>
                  ) : (
                    <>
                      <div style={sectionH}>{s.title}</div>
                      <Markdown text={s.content} />
                    </>
                  )}
                </div>
              ))}
              {editing && (
                <button onClick={() => setG({ ...g, sections: [...secs(g), { id: uid(), type: "section", title: "New section", content: "" }] })} style={{ ...ghost, justifyContent: "center" }}>
                  <PlusIcon size={15} /> Add section
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--hairline)", borderRadius: 16, padding: 18 };
const field: React.CSSProperties = { width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "9px 11px", fontSize: 13.5, color: "var(--ink)", outline: "none", background: "#fff" };
const sectionH: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "var(--studio-teal-dark)", margin: "0 0 6px", paddingBottom: 4, borderBottom: "2px solid var(--mint-pill)" };
const pill = (a: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 999, border: "none", fontWeight: 600, fontSize: 13.5, cursor: "pointer", background: a ? "var(--studio-primary)" : "var(--mint-pill)", color: a ? "#fff" : "var(--studio-teal-dark)" });
const primary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { height: 34, padding: "0 12px", borderRadius: 10, border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const rowBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 6 };
const rowOn: React.CSSProperties = { border: "1px solid var(--studio-primary)", background: "var(--mint-pill)", color: "var(--studio-teal-dark)" };
const activeTag: React.CSSProperties = { marginLeft: "auto", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: "#fff", background: "var(--studio-primary)", padding: "2px 7px", borderRadius: 999 };
