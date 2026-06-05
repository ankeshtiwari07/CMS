"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparkIcon, PlusIcon, TrashIcon, CheckIcon, XIcon, BookmarkIcon, PaletteIcon } from "@/components/icons";

type Section = { id: string; type: string; title: string; content: string };
type Swatch = { name: string; hex: string; usage?: string };
type Guideline = {
  id?: string | number;
  name: string;
  industry?: string;
  summary?: string;
  source?: string;
  isArchetype?: boolean;
  data?: { sections?: Section[]; palette?: Swatch[]; typography?: any };
  sections?: Section[];
  palette?: Swatch[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const secs = (g: Guideline): Section[] => g.sections || g.data?.sections || [];
const pal = (g: Guideline): Swatch[] => g.palette || g.data?.palette || [];

export default function BrandStudio({
  archetypes, mine,
}: { archetypes: Guideline[]; mine: Guideline[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"library" | "ai">("library");
  const [viewing, setViewing] = useState<Guideline | null>(archetypes[0] || null);

  // builder state
  const [name, setName] = useState("My Brand Guideline");
  const [industry, setIndustry] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [palette, setPalette] = useState<Swatch[]>([]);
  const [editId, setEditId] = useState<string | number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // AI suggest state
  const [ai, setAi] = useState({ industry: "", audience: "", tone: "", notes: "" });
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<Guideline | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);

  function addSection(s: Section) {
    setSections((p) => [...p, { ...s, id: uid() }]);
    setToast(`Added "${s.title}"`);
    setTimeout(() => setToast(null), 1400);
  }
  function addAllFrom(g: Guideline) {
    const ss = secs(g).map((s) => ({ ...s, id: uid() }));
    setSections((p) => [...p, ...ss]);
    const ps = pal(g);
    if (ps.length) setPalette((p) => [...p, ...ps]);
    setName(g.name ? `${g.name} (my version)` : name);
    if (g.industry) setIndustry(g.industry);
    setToast(`Added ${ss.length} sections from ${g.name}`);
    setTimeout(() => setToast(null), 1600);
  }
  const move = (i: number, d: -1 | 1) =>
    setSections((p) => {
      const n = [...p]; const j = i + d;
      if (j < 0 || j >= n.length) return n;
      [n[i], n[j]] = [n[j], n[i]]; return n;
    });

  function loadMine(g: Guideline) {
    setEditId(g.id);
    setName(g.name);
    setIndustry(g.industry || "");
    setSections(secs(g).map((s) => ({ ...s, id: s.id || uid() })));
    setPalette(pal(g));
    setToast(`Loaded "${g.name}"`);
    setTimeout(() => setToast(null), 1400);
  }
  function reset() {
    setEditId(undefined); setName("My Brand Guideline"); setIndustry("");
    setSections([]); setPalette([]);
  }

  async function save() {
    if (!sections.length) { setToast("Add at least one section first."); setTimeout(() => setToast(null), 1600); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/brand-guidelines", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: editId, name, industry, data: { sections, palette } }),
      });
      const d = await res.json();
      if (res.ok) { setEditId(d.doc?.id ?? editId); setToast("Saved ✓"); router.refresh(); }
      else setToast("Save failed.");
    } catch { setToast("Save failed."); }
    setSaving(false);
    setTimeout(() => setToast(null), 1600);
  }

  async function runAI() {
    setAiBusy(true); setAiErr(null); setAiResult(null);
    try {
      const res = await fetch("/api/brand-guidelines/suggest", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(ai),
      });
      const d = await res.json();
      if (d.ok) setAiResult(d.guideline);
      else setAiErr(d.message || "Could not generate.");
    } catch { setAiErr("Could not reach the generation service."); }
    setAiBusy(false);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>
      {/* ---------- LEFT: sources ---------- */}
      <div style={card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTab("library")} style={pill(tab === "library")}><BookmarkIcon size={15} /> Library</button>
          <button onClick={() => setTab("ai")} style={pill(tab === "ai")}><SparkIcon size={15} /> AI suggest</button>
        </div>

        {tab === "library" && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {archetypes.map((g) => (
                <button key={String(g.id)} onClick={() => setViewing(g)}
                  style={{ ...chip(viewing?.id === g.id), maxWidth: "100%" }}>
                  {g.name}
                </button>
              ))}
            </div>
            {viewing && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{viewing.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{viewing.industry}</div>
                  </div>
                  <button onClick={() => addAllFrom(viewing)} style={addAllBtn}><PlusIcon size={15} color="#fff" /> Add all</button>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 12px" }}>{viewing.summary}</p>
                {pal(viewing).length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {pal(viewing).map((c, i) => <Swatchet key={i} c={c} />)}
                  </div>
                )}
                <div style={{ display: "grid", gap: 8 }}>
                  {secs(viewing).map((s) => (
                    <div key={s.id} style={srcSec}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{s.content}</div>
                      </div>
                      <button onClick={() => addSection(s)} title="Add to my guideline" style={addBtn}><PlusIcon size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "ai" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>Describe your brand and let Claude tailor a guideline. Add the sections you like to your own.</p>
            <div style={{ display: "grid", gap: 10 }}>
              <input placeholder="Industry (e.g. fintech, telecom, healthcare)" value={ai.industry} onChange={(e) => setAi({ ...ai, industry: e.target.value })} style={field} />
              <input placeholder="Target audience" value={ai.audience} onChange={(e) => setAi({ ...ai, audience: e.target.value })} style={field} />
              <input placeholder="Desired tone (e.g. bold, trustworthy, premium)" value={ai.tone} onChange={(e) => setAi({ ...ai, tone: e.target.value })} style={field} />
              <textarea placeholder="Anything else? (values, competitors, must-haves)" value={ai.notes} onChange={(e) => setAi({ ...ai, notes: e.target.value })} rows={2} style={{ ...field, resize: "vertical" }} />
              <button onClick={runAI} disabled={aiBusy} style={{ ...addAllBtn, justifyContent: "center", height: 42 }}>
                <SparkIcon size={16} color="#fff" /> {aiBusy ? "Generating…" : "Generate with Claude"}
              </button>
            </div>
            {aiErr && <div style={{ color: "#b42318", fontSize: 13, marginTop: 10 }}>{aiErr}</div>}
            {aiResult && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{aiResult.name}</div>
                  <button onClick={() => addAllFrom(aiResult)} style={addAllBtn}><PlusIcon size={15} color="#fff" /> Add all</button>
                </div>
                {(aiResult.palette || []).length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
                    {(aiResult.palette || []).map((c, i) => <Swatchet key={i} c={c} />)}
                  </div>
                )}
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {(aiResult.sections || []).map((s) => (
                    <div key={s.id} style={srcSec}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{s.content}</div>
                      </div>
                      <button onClick={() => addSection(s)} style={addBtn}><PlusIcon size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- RIGHT: builder ---------- */}
      <div style={{ ...card, position: "sticky", top: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>My brand guideline</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={ghostBtn}>New</button>
            <button onClick={save} disabled={saving} style={addAllBtn}>{saving ? "Saving…" : (editId ? "Update" : "Save")}</button>
          </div>
        </div>

        {mine.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>Open:</span>
            {mine.map((g) => (
              <span key={String(g.id)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => loadMine(g)} style={chip(editId === g.id)}>{g.name}</button>
              </span>
            ))}
          </div>
        )}

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guideline name" style={{ ...field, fontWeight: 700, fontSize: 15, marginBottom: 8 }} />
        <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" style={{ ...field, marginBottom: 12 }} />

        {palette.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {palette.map((c, i) => (
              <span key={i} style={{ position: "relative" }}>
                <Swatchet c={c} />
                <button onClick={() => setPalette((p) => p.filter((_, j) => j !== i))} style={swatchX}><XIcon size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {sections.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13.5, padding: "30px 0", border: "1.5px dashed var(--hairline)", borderRadius: 12 }}>
            Pick sections from the library or AI suggestions on the left to build your guideline.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sections.map((s, i) => (
              <div key={s.id} style={{ border: "1px solid var(--hairline)", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <input value={s.title}
                    onChange={(e) => setSections((p) => p.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x))}
                    style={{ flex: 1, border: "none", outline: "none", fontWeight: 700, fontSize: 14, background: "transparent" }} />
                  <button onClick={() => move(i, -1)} title="Up" style={iconMini}>▲</button>
                  <button onClick={() => move(i, 1)} title="Down" style={iconMini}>▼</button>
                  <button onClick={() => setSections((p) => p.filter((x) => x.id !== s.id))} title="Remove" style={{ ...iconMini, color: "#b42318" }}><TrashIcon size={14} /></button>
                </div>
                <textarea value={s.content}
                  onChange={(e) => setSections((p) => p.map((x) => x.id === s.id ? { ...x, content: e.target.value } : x))}
                  rows={3}
                  style={{ width: "100%", border: "1px solid var(--hairline)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--ink)", outline: "none", resize: "vertical", lineHeight: 1.5 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13.5, zIndex: 200 }}>{toast}</div>
      )}
    </div>
  );
}

function Swatchet({ c }: { c: Swatch }) {
  return (
    <span title={`${c.name} ${c.hex}${c.usage ? " · " + c.usage : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--hairline)", borderRadius: 999, padding: "3px 9px 3px 4px", fontSize: 11.5 }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.1)" }} />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{c.hex}</span>
    </span>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--hairline)", borderRadius: 16, padding: 18 };
const field: React.CSSProperties = { width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "9px 11px", fontSize: 13.5, color: "var(--ink)", outline: "none", background: "#fff" };
const pill = (a: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 999, border: "none", fontWeight: 600, fontSize: 13.5, cursor: "pointer", background: a ? "var(--studio-primary)" : "var(--mint-pill)", color: a ? "#fff" : "var(--studio-teal-dark)" });
const chip = (a: boolean): React.CSSProperties => ({ height: 30, padding: "0 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1px solid ${a ? "var(--studio-primary)" : "var(--hairline)"}`, background: a ? "var(--mint-pill)" : "#fff", color: a ? "var(--studio-teal-dark)" : "var(--ink)" });
const srcSec: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px" };
const addBtn: React.CSSProperties = { flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: "1px solid var(--studio-primary)", background: "var(--mint-pill)", color: "var(--studio-teal-dark)", display: "grid", placeItems: "center", cursor: "pointer" };
const addAllBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { height: 34, padding: "0 12px", borderRadius: 10, border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const iconMini: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: "1px solid var(--hairline)", background: "#fff", color: "var(--muted)", cursor: "pointer", fontSize: 11, display: "grid", placeItems: "center" };
const swatchX: React.CSSProperties = { position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", border: "none", background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" };
