"use client";
import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/studio/markdown";
import CmsPreview, { type Artifact, type CmsTab, type Phase } from "@/components/cms/cms-preview";
import { cmsVars, appBg, R, TYPE, type Theme } from "@/components/cms/cms-tokens";
import { ArrowUpIcon, SquareIcon, SparkIcon, LayersIcon, GlobeIcon, MegaphoneIcon, QuestionIcon, MicIcon, TranslateIcon, GridIcon, PlusIcon, ChevronDownIcon, ClockIcon } from "@/components/icons";

type Turn = { role: "user" | "assistant"; text: string; streaming?: boolean; made?: string; time?: string };
type Tier = "Standard" | "Marketer" | "Editor" | "Admin";
type ModelOpt = { id: string; label: string; family: string; configured: boolean };

const STARTERS: { label: string; prompt: string; Icon: any; minTier: Tier; guided?: boolean }[] = [
  { label: "Create a landing page", prompt: "Create a landing page for our new campaign", Icon: GlobeIcon, minTier: "Standard", guided: true },
  { label: "Product page from brand", prompt: "Generate a product page using our brand guidelines", Icon: GridIcon, minTier: "Standard", guided: true },
  { label: "Add an FAQ section", prompt: "Write an FAQ section for our product with 6 common questions. Build it now.", Icon: QuestionIcon, minTier: "Standard" },
  { label: "Improve SEO", prompt: "Improve the SEO for this page — propose a stronger title, meta description and keywords.", Icon: SparkIcon, minTier: "Marketer" },
  { label: "Translate to Arabic", prompt: "Translate the homepage into Arabic, keeping it on-brand and RTL-correct.", Icon: TranslateIcon, minTier: "Standard" },
  { label: "Campaign microsite", prompt: "Create a campaign microsite for our product launch", Icon: MegaphoneIcon, minTier: "Marketer", guided: true },
];
const TIER_RANK: Record<Tier, number> = { Standard: 0, Marketer: 1, Editor: 2, Admin: 3 };
const clock = () => new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

// Client-side setup questions (mirrors the Decks "setup" clarifying step).
const SETUP = [
  { key: "style", q: "What style should it be?", opts: ["Minimal", "Bold", "Editorial", "Corporate"] },
  { key: "length", q: "How much content?", opts: ["Short", "Standard", "In-depth"] },
  { key: "locale", q: "Language?", opts: ["English", "Arabic", "Bilingual EN/AR"] },
] as const;

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button onClick={onToggle} title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      style={{ width: 34, height: 34, borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}>
      {theme === "dark"
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>}
    </button>
  );
}

export default function CmsWorkspace({
  user, canEdit, canPublish, tier,
}: {
  user: { name?: string; email: string; roles?: string[] };
  canEdit: boolean; canPublish: boolean; tier: Tier;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [tab, setTab] = useState<CmsTab>("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [locale, setLocale] = useState<"EN" | "AR">("EN");
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [modelId, setModelId] = useState<string>("");
  const [modelOpen, setModelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [setup, setSetup] = useState<{ base: string; answers: Record<string, string> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const started = turns.length > 0 || !!setup;

  useEffect(() => { setTheme((localStorage.getItem("humain-cms-theme") as Theme) || "light"); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto", block: "end" }); }, [turns, setup]);
  useEffect(() => {
    (async () => { try { const r = await fetch("/api/models"); const j = await r.json(); const ms: ModelOpt[] = (j.models || []).filter((m: any) => m.configured); setModels(ms); setModelId(ms[0]?.id || ""); } catch {} })();
  }, []);
  function toggleTheme() { setTheme((t) => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("humain-cms-theme", n); return n; }); }

  const phase: Phase = busy && !artifact ? "generating" : setup ? "setup" : artifact ? "ready" : turns.length ? "ready" : "setup";
  const modelLabel = models.find((m) => m.id === modelId)?.label || "Auto";

  function patchLast(fn: (t: Turn) => Turn) {
    setTurns((p) => { const i = p.length - 1; if (i < 0 || p[i].role !== "assistant") return p; const n = p.slice(); n[i] = fn(n[i]); return n; });
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true); setSetup(null);
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: (t.text || "").slice(0, 6000) }));
    setTurns((p) => [...p, { role: "user", text, time: clock() }, { role: "assistant", text: "", streaming: true, time: clock() }]);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "auto", prompt: text, model: modelId || undefined, history }), signal: ctrl.signal });
      if (!res.ok || !res.body) { const d = await res.json().catch(() => ({})); patchLast((t) => ({ ...t, text: d.error || "The CMS agent is unavailable.", streaming: false })); setBusy(false); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
          if (!line) continue;
          let ev: any; try { ev = JSON.parse(line); } catch { continue; }
          if (ev.type === "delta") patchLast((t) => ({ ...t, text: (t.text || "") + ev.text }));
          else if (ev.type === "reset") patchLast((t) => ({ ...t, text: "" }));
          else if (ev.type === "artifact") {
            if (ev.kind === "html") { setArtifact({ kind: "html", html: ev.html, title: ev.title }); patchLast((t) => ({ ...t, made: "page" })); }
            else if (ev.kind === "doc") { setArtifact({ kind: "doc", doc: ev.doc, title: ev.title }); patchLast((t) => ({ ...t, made: "content" })); }
            else if (ev.kind === "image") { setArtifact({ kind: "image", imagePrompt: ev.imagePrompt, ratio: ev.ratio, title: ev.title }); patchLast((t) => ({ ...t, made: "image" })); }
            else if (ev.kind === "brand") { setArtifact({ kind: "brand", brand: ev.brand, title: ev.title }); patchLast((t) => ({ ...t, made: "brand" })); }
            else if (ev.kind === "theme") { setArtifact({ kind: "theme", theme: ev.theme, title: ev.title }); patchLast((t) => ({ ...t, made: "theme" })); }
            else if (ev.kind === "video") { setArtifact({ kind: "video", videoPrompt: ev.videoPrompt, script: ev.script, title: ev.title }); patchLast((t) => ({ ...t, made: "video" })); }
            setTab("preview");
          }
          else if (ev.type === "error") patchLast((t) => ({ ...t, text: `${t.text ? t.text + "\n\n" : ""}⚠️ ${ev.message}`, streaming: false }));
          else if (ev.type === "done") patchLast((t) => ({ ...t, streaming: false }));
        }
      }
      patchLast((t) => ({ ...t, streaming: false }));
    } catch (e: any) {
      if (e?.name !== "AbortError" && !ctrl.signal.aborted) patchLast((t) => ({ ...t, text: (t.text || "") || "Could not reach the CMS agent.", streaming: false }));
      else patchLast((t) => ({ ...t, streaming: false }));
    }
    abortRef.current = null; setBusy(false);
  }

  function startGuided(base: string) { setSetup({ base, answers: {} }); setTurns((p) => [...p, { role: "user", text: base, time: clock() }, { role: "assistant", text: "Let me ask a few quick questions to shape it.", time: clock() }]); }
  function runSetup() {
    if (!setup) return;
    const a = setup.answers;
    const enriched = `${setup.base}. Style: ${a.style || "Minimal"}. Length: ${a.length || "Standard"}. Language: ${a.locale || (locale === "AR" ? "Arabic" : "English")}. Build it now.`;
    send(enriched);
  }
  function submit() { const t = prompt.trim(); if (!t || busy) return; setPrompt(""); send(locale === "AR" ? `${t} (in Arabic)` : t); }

  // ---------- Composer (Decks-style: + · chips · model · mic · send) ----------
  const chipStyle = (active = false): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: R.full, border: "1px solid var(--hc-border)", background: active ? "var(--hc-primary-10)" : "transparent", color: active ? "var(--hc-primary)" : "var(--hc-fg-muted)", ...TYPE.sm, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" });

  const composer = (
    <div style={{ width: "100%", maxWidth: started ? "none" : 772, margin: started ? 0 : "0 auto", background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.x2, boxShadow: focus ? "var(--hc-shadow-lg)" : "var(--hc-shadow-md)", padding: 12, transition: "box-shadow .15s", position: "relative" }}>
      <textarea id="cms-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={started ? "Refine this page, a section, or create a new one…" : "Describe what you want to create…"}
        rows={started ? 1 : 2}
        style={{ width: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--hc-fg)", ...TYPE.base, fontFamily: "inherit" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        {/* + menu */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setAddOpen((v) => !v)} title="Add" style={{ width: 32, height: 32, borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "transparent", color: "var(--hc-fg-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}><PlusIcon size={17} /></button>
          {addOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, width: 190, background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.xl, boxShadow: "var(--hc-shadow-lg)", padding: 6 }} onMouseLeave={() => setAddOpen(false)}>
              {[["New page", GlobeIcon], ["Recent", ClockIcon]].map(([l, Ic]: any, i) => (
                <button key={i} onClick={() => { setAddOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: "none", background: "transparent", borderRadius: R.md, color: "var(--hc-fg)", ...TYPE.sm, cursor: "pointer", textAlign: "left" }}><Ic size={16} color="var(--hc-fg-muted)" /> {l}</button>
              ))}
            </div>
          )}
        </div>
        {/* config chips */}
        <span style={chipStyle(false)}><SparkIcon size={13} color="var(--hc-primary)" /> HUMAIN Brand</span>
        <button onClick={() => setLocale((l) => (l === "EN" ? "AR" : "EN"))} style={chipStyle(true)}><TranslateIcon size={13} /> {locale === "EN" ? "English" : "العربية"}</button>
        <div style={{ flex: 1 }} />
        {/* model selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setModelOpen((v) => !v)} style={{ ...chipStyle(false), background: "var(--hc-primary-10)", color: "var(--hc-primary)", border: "none" }}>{modelLabel} <ChevronDownIcon size={13} /></button>
          {modelOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40, width: 200, maxHeight: 260, overflowY: "auto", background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.xl, boxShadow: "var(--hc-shadow-lg)", padding: 6 }} onMouseLeave={() => setModelOpen(false)}>
              {models.map((m) => (
                <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 10px", border: "none", background: m.id === modelId ? "var(--hc-primary-10)" : "transparent", borderRadius: R.md, color: "var(--hc-fg)", ...TYPE.sm, cursor: "pointer" }}>{m.label}<span style={{ color: "var(--hc-fg-muted)", fontSize: 11 }}>{m.family}</span></button>
              ))}
            </div>
          )}
        </div>
        <button title="Voice" style={{ width: 34, height: 34, borderRadius: R.full, border: "1px solid var(--hc-border)", background: "transparent", color: "var(--hc-fg-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}><MicIcon size={16} /></button>
        <button onClick={busy ? () => abortRef.current?.abort() : submit} disabled={!busy && !prompt.trim()} title={busy ? "Stop" : "Send"}
          style={{ width: 34, height: 34, borderRadius: R.full, border: "none", background: busy || prompt.trim() ? "var(--hc-primary)" : "var(--hc-muted)", color: "#fff", display: "grid", placeItems: "center", cursor: busy || prompt.trim() ? "pointer" : "default" }}>
          {busy ? <SquareIcon size={14} color="#fff" /> : <ArrowUpIcon size={17} color="#fff" />}
        </button>
      </div>
    </div>
  );

  // ---------- Setup question card (Decks clarifying step) ----------
  const setupCard = setup && (
    <div style={{ background: "var(--hc-card)", border: "1px solid var(--hc-border)", borderRadius: R.x2, boxShadow: "var(--hc-shadow-md)", padding: 16, marginTop: 8 }}>
      <div style={{ fontWeight: 800, color: "var(--hc-fg)", ...TYPE.base, marginBottom: 2 }}>Set up</div>
      <div style={{ color: "var(--hc-fg-muted)", ...TYPE.sm, marginBottom: 14 }}>Answer a few quick questions so I can tailor it.</div>
      {SETUP.map((g) => (
        <div key={g.key} style={{ marginBottom: 12 }}>
          <div style={{ ...TYPE.sm, fontWeight: 700, color: "var(--hc-fg)", marginBottom: 6 }}>{g.q}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {g.opts.map((o) => {
              const on = setup.answers[g.key] === o;
              return <button key={o} onClick={() => setSetup((s) => (s ? { ...s, answers: { ...s.answers, [g.key]: o } } : s))}
                style={{ padding: "7px 13px", borderRadius: R.full, border: `1px solid ${on ? "var(--hc-primary)" : "var(--hc-border)"}`, background: on ? "var(--hc-primary-10)" : "transparent", color: on ? "var(--hc-primary)" : "var(--hc-fg)", ...TYPE.sm, fontWeight: 600, cursor: "pointer" }}>{o}</button>;
            })}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
        <button onClick={() => setSetup(null)} style={{ padding: "9px 14px", borderRadius: R.lg, border: "1px solid var(--hc-border)", background: "transparent", color: "var(--hc-fg-muted)", fontWeight: 700, ...TYPE.sm, cursor: "pointer" }}>Cancel</button>
        <button onClick={runSetup} style={{ padding: "9px 16px", borderRadius: R.lg, border: "none", background: "var(--hc-primary)", color: "#fff", fontWeight: 700, ...TYPE.sm, cursor: "pointer" }}>Generate</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...cmsVars(theme), height: "calc(100vh - 20px)", borderRadius: R.x3, border: "1px solid var(--hc-border)", overflow: "hidden", display: "flex", color: "var(--hc-fg)", backgroundColor: "var(--hc-bg)", backgroundImage: appBg(theme) } as any}>
      {/* LEFT — CMS Agent conversation */}
      <section style={{ width: started ? 440 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", padding: started ? "16px 16px 16px 20px" : "0 24px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: started ? "2px 2px 14px" : "20px 2px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 12px", borderRadius: R.full, background: "var(--hc-primary-10)", color: "var(--hc-primary)", fontWeight: 700, ...TYPE.sm }}>
            <LayersIcon size={15} color="var(--hc-primary)" /> HUMAIN CMS · {tier}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.roles?.includes("admin") && (
              <a href="/admin" target="_blank" rel="noreferrer"
                title="Open the CMS admin — collections, components, navigation & flows"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: R.full, background: "var(--hc-ghost)", color: "var(--hc-fg)", fontWeight: 700, textDecoration: "none", border: "1px solid var(--hc-border)", ...TYPE.sm }}>
                <GridIcon size={14} color="var(--hc-primary)" /> Admin
              </a>
            )}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        {!started ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 772, margin: "0 auto", width: "100%" }}>
            <h1 style={{ fontSize: 32, lineHeight: "38px", fontWeight: 800, color: "var(--hc-fg)", margin: "0 0 10px" }}>What would you like to manage{user.name ? `, ${user.name.split(" ")[0]}` : ""}?</h1>
            <p style={{ color: "var(--hc-fg-muted)", ...TYPE.base, margin: "0 0 24px" }}>Describe it in plain language. The CMS agent creates pages, content and campaigns — with a live, editable preview on the right.</p>
            {composer}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 }}>
              {STARTERS.filter((s) => TIER_RANK[tier] >= TIER_RANK[s.minTier]).map((s) => (
                <button key={s.label} onClick={() => (s.guided ? startGuided(s.prompt) : send(s.prompt))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: R.full, border: "1px solid var(--hc-border)", background: "var(--hc-card)", color: "var(--hc-fg)", ...TYPE.sm, fontWeight: 600, cursor: "pointer", boxShadow: "var(--hc-shadow-sm)" }}>
                  <s.Icon size={15} color="var(--hc-primary)" /> {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 10 }}>
              {turns.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: t.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: t.role === "user" ? 325 : 370, background: t.role === "user" ? "var(--hc-primary)" : "var(--hc-ghost)", color: t.role === "user" ? "var(--hc-primary-fg)" : "var(--hc-fg)", padding: "10px 14px", borderRadius: t.role === "user" ? `${R.x2}px ${R.x2}px ${R.base}px ${R.x2}px` : `${R.x2}px ${R.x2}px ${R.x2}px ${R.base}px` }}>
                    {/* Decks bubble header: name + timestamp */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 12.5, opacity: t.role === "user" ? 0.92 : 1, color: t.role === "user" ? "var(--hc-primary-fg)" : "var(--hc-fg)" }}>{t.role === "user" ? "You" : "HUMAIN"}</span>
                      {t.time && <span style={{ fontSize: 11.5, opacity: 0.7 }}>{t.time}</span>}
                    </div>
                    <div style={{ ...TYPE.sm }}>{t.role === "user" ? t.text : <Markdown text={t.text || (t.streaming ? "…" : "")} />}</div>
                    {t.made && <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8, padding: "5px 11px", borderRadius: R.full, background: "var(--hc-primary-10)", color: "var(--hc-primary)", fontSize: 12.5, fontWeight: 700 }}><SparkIcon size={13} color="var(--hc-primary)" /> {t.made} ready in preview →</div>}
                  </div>
                </div>
              ))}
              {setupCard}
              <div ref={endRef} />
            </div>
            <div style={{ marginTop: 10 }}>{composer}</div>
          </>
        )}
      </section>

      {/* RIGHT — live preview (state-driven, Decks chrome) */}
      {started && (
        <section style={{ flex: 1, minWidth: 0, padding: "14px 14px 14px 0" }}>
          <CmsPreview
            phase={phase} artifact={artifact} tab={tab} setTab={setTab} device={device} setDevice={setDevice}
            canEdit={canEdit} canPublish={canPublish} tier={tier}
            onClose={() => setArtifact(null)}
            onEditHtml={(html) => setArtifact((a) => (a && a.kind === "html" ? { ...a, html } : a))}
            onAskAboutSelection={(text) => { setPrompt(`Update the selected element ("${text.slice(0, 120)}") — `); setTimeout(() => document.getElementById("cms-prompt")?.focus(), 30); }}
          />
        </section>
      )}
    </div>
  );
}
