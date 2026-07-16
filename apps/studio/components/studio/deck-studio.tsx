"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// ---------- types (mirror apps/ai-service/src/deck.ts) ----------
type Theme = { id: string; name: string; bg: string; surface: string; fg: string; muted: string; accent: string; accent2: string; font: string; heading: string; radius: number };
type Slide = {
  id: string;
  layout: "title" | "section" | "bullets" | "two-column" | "quote" | "stat" | "image-right" | "image-left" | "closing";
  title?: string; subtitle?: string; bullets?: string[]; body?: string;
  columns?: { heading: string; items: string[] }[];
  stat?: { value: string; label: string }[];
  quote?: { text: string; author?: string };
  notes?: string; imagePrompt?: string; imageUrl?: string; html?: string;
};
type Deck = { id?: string; title: string; subtitle?: string; theme: string; slides: Slide[]; prompt?: string; outline?: any };
type OutlineItem = { title: string; intent: string };
type Question = { id: string; question: string; hint?: string; options: string[] };
type ChatMsg = { role: "user" | "assistant"; text: string };

const W = 1280, H = 720;
const uid = () => `s${Math.random().toString(36).slice(2, 9)}`;
const FALLBACK_THEME: Theme = { id: "midnight", name: "Midnight", bg: "#0b1020", surface: "#141a2e", fg: "#f5f7ff", muted: "#9aa6c4", accent: "#6ea8fe", accent2: "#c58bff", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 };

// =====================================================================
// Slide renderer — authored at 1280x720, scaled by the caller.
// =====================================================================
// Compose a clean, themed HTML representation of a slide — the seed for inline
// editing and the HTML SOURCE panel.
function slideHtml(s: Slide, t: Theme): string {
  const esc = (x: any) => String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  let body = "";
  if (s.subtitle) body += `<div style="color:${t.accent};font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:24px;margin-bottom:16px">${esc(s.subtitle)}</div>`;
  if (s.title) body += `<h1 style="font-size:${s.layout === "title" || s.layout === "closing" ? 84 : 60}px;font-weight:800;line-height:1.05;margin:0 0 18px">${esc(s.title)}</h1>`;
  if (s.body) body += `<p style="font-size:28px;color:${t.muted};line-height:1.4;margin:0 0 18px">${esc(s.body)}</p>`;
  if (s.bullets?.length) body += `<ul style="font-size:32px;line-height:1.4;padding:0;list-style:none;margin:0">${s.bullets.map((b) => `<li style="margin:16px 0;display:flex;gap:16px"><span style="color:${t.accent}">◆</span><span>${esc(b)}</span></li>`).join("")}</ul>`;
  if (s.quote?.text) body += `<blockquote style="font-size:46px;font-weight:600;margin:0">&ldquo;${esc(s.quote.text)}&rdquo;<div style="color:${t.accent};font-size:28px;margin-top:20px">— ${esc(s.quote.author || "")}</div></blockquote>`;
  if (s.stat?.length) body += `<div style="display:flex;gap:40px;margin-top:20px">${s.stat.map((x) => `<div><div style="font-size:76px;font-weight:800;color:${t.accent}">${esc(x.value)}</div><div style="font-size:24px;color:${t.muted}">${esc(x.label)}</div></div>`).join("")}</div>`;
  if (s.columns?.length) body += `<div style="display:flex;gap:40px">${s.columns.map((c) => `<div style="flex:1"><div style="color:${t.accent};font-weight:700;font-size:30px;margin-bottom:12px">${esc(c.heading)}</div><ul style="font-size:26px;list-style:none;padding:0;margin:0">${c.items.map((i) => `<li style="margin:10px 0">${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`;
  return `<div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(${t.accent},${t.accent2})"></div><div style="height:100%;padding:84px;display:flex;flex-direction:column;justify-content:center">${body}</div>`;
}

// A contenteditable slide surface — sets innerHTML once (uncontrolled) so the
// caret is preserved while typing; reports changes via onChange.
function EditableSlide({ html, t, onChange }: { html: string; t: Theme; onChange: (h: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.innerHTML = html; /* seed once */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => onChange(ref.current!.innerHTML)}
    style={{ width: W, height: H, background: t.bg, color: t.fg, fontFamily: t.font, position: "relative", overflow: "hidden", outline: "none" }} />;
}

function SlideView({ slide, t, index, total }: { slide: Slide; t: Theme; index: number; total: number }) {
  const pad = 84;
  const base: React.CSSProperties = { width: W, height: H, background: t.bg, color: t.fg, fontFamily: t.font, position: "relative", overflow: "hidden" };
  // Inline-edited slides carry a raw-HTML override — render it verbatim.
  if (slide.html) return <div style={base} dangerouslySetInnerHTML={{ __html: slide.html }} />;
  const accentBar = <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: `linear-gradient(${t.accent}, ${t.accent2})` }} />;
  const pageNo = <div style={{ position: "absolute", right: 40, bottom: 30, color: t.muted, fontSize: 20 }}>{index + 1} / {total}</div>;
  const kicker = (txt: string) => <div style={{ color: t.accent, fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 18 }}>{txt}</div>;
  const H1 = (txt?: string, size = 72) => <div style={{ fontFamily: t.heading, fontWeight: 800, fontSize: size, lineHeight: 1.05, letterSpacing: -1 }}>{txt}</div>;
  const bulletsEl = (items?: string[]) => (
    <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "flex", flexDirection: "column", gap: 20 }}>
      {(items || []).map((b, i) => (
        <li key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start", fontSize: 32, lineHeight: 1.35 }}>
          <span style={{ marginTop: 14, minWidth: 12, width: 12, height: 12, borderRadius: 3, background: t.accent, transform: "rotate(45deg)" }} />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
  const imgEl = slide.imageUrl ? (
    <div style={{ flex: 1, borderRadius: t.radius, overflow: "hidden", background: t.surface, backgroundImage: `url(${slide.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
  ) : (
    <div style={{ flex: 1, borderRadius: t.radius, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", color: t.muted, fontSize: 22, textAlign: "center", padding: 24 }}>
      {slide.imagePrompt ? "🖼 Generate image" : "Visual"}
    </div>
  );
  let inner: React.ReactNode = null;
  switch (slide.layout) {
    case "title":
      inner = (<div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${pad}px` }}>{slide.subtitle && kicker(slide.subtitle)}{H1(slide.title, 84)}{slide.body && <div style={{ color: t.muted, fontSize: 30, marginTop: 28, maxWidth: 900, lineHeight: 1.4 }}>{slide.body}</div>}</div>); break;
    case "section":
      inner = (<div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${pad}px`, background: `radial-gradient(1200px 500px at 20% 10%, ${t.surface}, ${t.bg})` }}>{kicker(`Section ${index + 1}`)}{H1(slide.title, 80)}{slide.subtitle && <div style={{ color: t.muted, fontSize: 30, marginTop: 20 }}>{slide.subtitle}</div>}</div>); break;
    case "quote":
      inner = (<div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${pad}px` }}><div style={{ fontSize: 120, color: t.accent, lineHeight: 0.6, fontFamily: "Georgia, serif" }}>&ldquo;</div><div style={{ fontFamily: t.heading, fontSize: 46, fontWeight: 600, lineHeight: 1.3, maxWidth: 980 }}>{slide.quote?.text || slide.title}</div>{slide.quote?.author && <div style={{ color: t.accent, fontSize: 28, marginTop: 26 }}>— {slide.quote.author}</div>}</div>); break;
    case "stat":
      inner = (<div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${pad}px` }}>{slide.title && H1(slide.title, 56)}<div style={{ display: "flex", gap: 40, marginTop: 44, flexWrap: "wrap" }}>{(slide.stat || []).map((s, i) => (<div key={i} style={{ background: t.surface, borderRadius: t.radius, padding: "34px 40px", minWidth: 240 }}><div style={{ fontSize: 76, fontWeight: 800, color: t.accent, fontFamily: t.heading }}>{s.value}</div><div style={{ fontSize: 24, color: t.muted, marginTop: 8 }}>{s.label}</div></div>))}</div></div>); break;
    case "two-column":
      inner = (<div style={{ height: "100%", padding: `${pad - 20}px ${pad}px`, display: "flex", flexDirection: "column" }}>{slide.title && H1(slide.title, 56)}<div style={{ display: "flex", gap: 40, marginTop: 34, flex: 1 }}>{(slide.columns || []).map((c, i) => (<div key={i} style={{ flex: 1, background: t.surface, borderRadius: t.radius, padding: 34 }}><div style={{ fontSize: 30, fontWeight: 700, color: t.accent, marginBottom: 16 }}>{c.heading}</div>{bulletsEl(c.items)}</div>))}</div></div>); break;
    case "image-left":
    case "image-right":
      inner = (<div style={{ height: "100%", padding: `${pad - 10}px ${pad}px`, display: "flex", gap: 48, alignItems: "stretch", flexDirection: slide.layout === "image-left" ? "row" : "row-reverse" }}>{imgEl}<div style={{ flex: 1.1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{slide.title && H1(slide.title, 52)}{slide.body && <div style={{ color: t.muted, fontSize: 28, marginTop: 18, lineHeight: 1.4 }}>{slide.body}</div>}{slide.bullets?.length ? bulletsEl(slide.bullets) : null}</div></div>); break;
    case "closing":
      inner = (<div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: `0 ${pad}px`, background: `radial-gradient(1000px 600px at 50% 40%, ${t.surface}, ${t.bg})` }}>{H1(slide.title || "Thank you", 88)}{slide.subtitle && <div style={{ color: t.accent, fontSize: 34, marginTop: 24 }}>{slide.subtitle}</div>}{slide.body && <div style={{ color: t.muted, fontSize: 26, marginTop: 18, maxWidth: 820 }}>{slide.body}</div>}</div>); break;
    default:
      inner = (<div style={{ height: "100%", padding: `${pad - 10}px ${pad}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>{slide.subtitle && kicker(slide.subtitle)}{slide.title && H1(slide.title, 56)}{slide.body && <div style={{ color: t.muted, fontSize: 28, marginTop: 16, lineHeight: 1.4 }}>{slide.body}</div>}{bulletsEl(slide.bullets)}</div>);
  }
  return <div style={base}>{accentBar}{inner}{slide.layout !== "title" && slide.layout !== "closing" ? pageNo : null}</div>;
}
function ScaledSlide({ slide, t, index, total, boxW }: { slide: Slide; t: Theme; index: number; total: number; boxW: number }) {
  const scale = boxW / W;
  return (<div style={{ width: boxW, height: H * scale, overflow: "hidden", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,.18)" }}><div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}><SlideView slide={slide} t={t} index={index} total={total} /></div></div>);
}
function PresentSlide({ slide, t, index, total }: { slide: Slide; t: Theme; index: number; total: number }) {
  const [scale, setScale] = useState(1);
  useEffect(() => { const fit = () => setScale(Math.min(window.innerWidth / W, (window.innerHeight - 20) / H)); fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit); }, []);
  return <div style={{ width: W * scale, height: H * scale, overflow: "hidden" }}><div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}><SlideView slide={slide} t={t} index={index} total={total} /></div></div>;
}

// =====================================================================
// Deck Studio v2 — two-pane agentic (chat + deck canvas)
// =====================================================================
type Phase = "compose" | "setup" | "outline" | "deck";

export default function DeckStudio({ deckId, userName }: { deckId: string | null; userName?: string }) {
  const urlPrompt = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prompt") || "" : "";
  const [phase, setPhase] = useState<Phase>("compose");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState(urlPrompt);
  const [compose, setCompose] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  // clarifying questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  // outline + deck
  const [themes, setThemes] = useState<Theme[]>([FALLBACK_THEME]);
  const [themeId, setThemeId] = useState("humain");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [outTitle, setOutTitle] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cur, setCur] = useState(0);
  const [present, setPresent] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(deckId);
  // inline editing + menu + translate
  const [editing, setEditing] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [srcNonce, setSrcNonce] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState<"" | "tr" | "cp">("");
  // compose-hero setup chips (Figma home)
  const [slideCount, setSlideCount] = useState(10);
  const [deckType, setDeckType] = useState<"HTML" | "Images">("HTML");
  const [style, setStyle] = useState("Story Telling");
  const dragI = useRef<number | null>(null);
  function composePrefs(): string[] {
    return [`About ${slideCount} slides`, `${style} style`, deckType === "Images" ? "image-forward slides with a strong visual on each" : ""].filter(Boolean);
  }
  function dropAt(j: number) {
    const from = dragI.current; dragI.current = null;
    if (from == null || from === j) return;
    setOutline((os) => { const n = [...os]; const [it] = n.splice(from, 1); n.splice(j, 0, it); return n; });
  }
  const autoRan = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(720);

  const t = useMemo(() => themes.find((x) => x.id === (deck?.theme || themeId)) || themes[0] || FALLBACK_THEME, [themes, deck, themeId]);
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2400); };
  const addChat = (m: ChatMsg) => setChat((c) => [...c, m]);

  useEffect(() => { fetch("/api/deck/themes").then((r) => r.json()).then((j) => { if (j.themes?.length) setThemes(j.themes); }).catch(() => {}); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, questions, qi, busy]);
  useEffect(() => { const on = () => { if (stageRef.current) setBoxW(Math.min(940, stageRef.current.clientWidth - 4)); }; on(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, [phase]);

  // load an existing deck by id
  useEffect(() => {
    if (!deckId) return;
    setBusy("Loading deck…");
    fetch(`/api/deck/${deckId}`).then((r) => r.json()).then((d) => {
      if (d?.slides) { setDeck({ ...d }); setThemeId(d.theme || "midnight"); setPhase("deck"); setSavedId(d.id); setPrompt(d.prompt || ""); }
    }).finally(() => setBusy(""));
  }, [deckId]);

  // auto-start from ?prompt=
  useEffect(() => {
    if (!deckId && urlPrompt.trim() && !autoRan.current) { autoRan.current = true; startFromPrompt(urlPrompt); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- agentic flow ----------
  async function startFromPrompt(p: string) {
    const text = p.trim(); if (!text) return;
    setPrompt(text); setErr(""); setChat([{ role: "user", text }]); setPhase("setup"); setBusy("Preparing a few questions…");
    try {
      const r = await fetch("/api/deck/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: text }) });
      const j = await r.json();
      if (r.ok && Array.isArray(j.questions) && j.questions.length) {
        addChat({ role: "assistant", text: "Let me ask a few questions to shape the deck." });
        setQuestions(j.questions); setQi(0); setChoice(""); setOther("");
      } else { addChat({ role: "assistant", text: "Great — drafting your outline now." }); await buildOutline(text, []); }
    } catch { addChat({ role: "assistant", text: "Great — drafting your outline now." }); await buildOutline(text, []); }
    finally { setBusy(""); }
  }

  function answerCurrent() {
    const q = questions[qi]; if (!q) return;
    const ans = (choice === "__other__" ? other.trim() : choice) || "Any";
    const nextAnswers = { ...answers, [q.question]: ans };
    setAnswers(nextAnswers);
    const last = qi >= questions.length - 1;
    setChoice(""); setOther("");
    if (!last) { setQi(qi + 1); return; }
    // all answered → summarize + build outline
    const summary = Object.entries(nextAnswers).map(([k, v]) => `Q: ${k} · A: ${v}`).join("\n");
    addChat({ role: "user", text: summary });
    buildOutline(prompt, Object.entries(nextAnswers).map(([k, v]) => `${k}: ${v}`));
  }

  async function buildOutline(basePrompt: string, prefs: string[]) {
    setBusy("Drafting your outline…"); setErr("");
    const allPrefs = [...composePrefs(), ...prefs];
    const eff = allPrefs.length ? `${basePrompt}\n\nPreferences:\n- ${allPrefs.join("\n- ")}` : basePrompt;
    try {
      const r = await fetch("/api/deck/outline", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: eff }) });
      const j = await r.json();
      if (!r.ok || !j.slides) throw new Error(j.error || "Failed to plan deck");
      setOutTitle(j.title || basePrompt); setOutline(j.slides); setQuestions([]); setPhase("outline");
      addChat({ role: "assistant", text: `Done — review your ${j.slides.length}-slide outline on the right. Edit any title, reorder, then generate when ready.` });
    } catch (e: any) { setErr(e.message || "Failed"); addChat({ role: "assistant", text: `⚠️ ${e.message || "Failed to plan the deck."}` }); }
    finally { setBusy(""); }
  }

  async function generateDeck() {
    setBusy("Designing slides… ~20s"); setErr("");
    addChat({ role: "assistant", text: "Generating your slides…" });
    try {
      const body: any = { prompt: prompt || outTitle, theme: themeId, outline: { title: outTitle, slides: outline } };
      const r = await fetch("/api/deck", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.slides) throw new Error(j.error || j.artifact || "Failed to generate deck");
      const slides: Slide[] = j.slides.map((s: any) => ({ ...s, id: s.id || uid() }));
      setDeck({ title: j.title, subtitle: j.subtitle, theme: themeId, slides, prompt, outline: { title: outTitle, slides: outline } });
      setCur(0); setPhase("deck");
      addChat({ role: "assistant", text: `Your ${slides.length}-slide deck is ready. Refine any slide from here, or Present.` });
    } catch (e: any) { setErr(e.message || "Failed"); addChat({ role: "assistant", text: `⚠️ ${e.message}` }); }
    finally { setBusy(""); }
  }

  // refine from the chat composer (deck phase = regenerate current slide with the instruction)
  async function sendRefine() {
    const text = compose.trim(); if (!text) return;
    setCompose(""); addChat({ role: "user", text });
    if (phase !== "deck" || !deck) { addChat({ role: "assistant", text: "Finish setup first — answer the questions or generate the outline." }); return; }
    const slide = deck.slides[cur];
    setBusy("Refining slide…");
    try {
      const r = await fetch("/api/deck/slide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deckTitle: deck.title, slide, instruction: text }) });
      const j = await r.json();
      if (!r.ok || !j.id) throw new Error(j.error || "Failed");
      updateSlide(cur, { ...j, id: slide.id, imageUrl: slide.imageUrl });
      addChat({ role: "assistant", text: `Updated slide ${cur + 1}.` });
    } catch (e: any) { addChat({ role: "assistant", text: `⚠️ ${e.message}` }); } finally { setBusy(""); }
  }

  const updateSlide = (i: number, patch: Partial<Slide>) => setDeck((d) => d ? { ...d, slides: d.slides.map((s, k) => k === i ? { ...s, ...patch } : s) } : d);
  const move = (i: number, dir: -1 | 1) => setOutline((os) => { const j = i + dir; if (j < 0 || j >= os.length) return os; const n = [...os]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  async function save() {
    if (!deck) return; setBusy("Saving…");
    try {
      const r = await fetch("/api/deck/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...deck, id: savedId, theme: deck.theme, status: "ready" }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Save failed");
      setSavedId(j.id); setDirty(false); flash("Saved to CMS");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  }

  // ---------- inline editing ----------
  const LANGS = ["Arabic", "French", "Spanish", "German", "Chinese", "Hindi", "Japanese", "Portuguese", "Italian", "Korean"];
  function enableEditing() {
    if (!deck) return;
    // seed an HTML representation for any slide that doesn't have one yet
    setDeck((d) => d ? { ...d, slides: d.slides.map((s) => (s.html ? s : { ...s, html: slideHtml(s, t) })) } : d);
    setEditing(true);
  }
  // execCommand mutates the focused contenteditable; its onInput syncs the html.
  function exec(cmd: string, val?: string) { document.execCommand(cmd, false, val); setDirty(true); }
  function setCurHtml(html: string) { updateSlide(cur, { html }); setDirty(true); }
  async function translate(lang: string, asCopy: boolean) {
    if (!deck) return; setLangOpen(""); setMenuOpen(false); setBusy(`Translating to ${lang}…`);
    try {
      const r = await fetch("/api/deck/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang, deck: { title: deck.title, subtitle: deck.subtitle, slides: deck.slides } }) });
      const j = await r.json();
      if (!r.ok || !j.slides) throw new Error(j.error || "Translate failed");
      const slides = j.slides.map((s: any) => ({ ...s, id: s.id || uid(), html: undefined }));
      if (asCopy) { setSavedId(null); setDeck({ title: `${j.title} (${lang})`, subtitle: j.subtitle, theme: deck.theme, slides, prompt: deck.prompt }); flash(`Translated copy in ${lang}`); }
      else { setDeck({ ...deck, title: j.title, subtitle: j.subtitle, slides }); flash(`Translated to ${lang}`); }
      setCur(0); setEditing(false); setDirty(true);
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  }
  function makeCopy() {
    if (!deck) return; setMenuOpen(false); setSavedId(null);
    setDeck({ ...deck, title: `${deck.title} (copy)`, slides: deck.slides.map((s) => ({ ...s, id: uid() })) });
    flash("Copy created — Save to keep it");
  }

  const exportPptx = async () => {
    if (!deck) return; setBusy("Building PPTX…");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const p = new PptxGenJS(); p.defineLayout({ name: "16x9", width: 13.333, height: 7.5 }); p.layout = "16x9";
      const hex = (c: string) => c.replace("#", "");
      for (let i = 0; i < deck.slides.length; i++) {
        const s = deck.slides[i]; const sl = p.addSlide(); sl.background = { color: hex(t.bg) };
        sl.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.13, h: 7.5, fill: { color: hex(t.accent) } });
        const tc = hex(t.fg), mc = hex(t.muted), ac = hex(t.accent);
        if (s.subtitle) sl.addText(String(s.subtitle).toUpperCase(), { x: 0.7, y: 0.5, w: 11.9, fontSize: 12, color: ac, bold: true });
        if (s.title) sl.addText(s.title, { x: 0.7, y: s.layout === "title" || s.layout === "section" || s.layout === "closing" ? 2.7 : 0.9, w: 11.9, h: 1.3, fontSize: s.layout === "title" ? 40 : 30, bold: true, color: tc });
        let y = 2.2;
        if (s.body) { sl.addText(s.body, { x: 0.7, y, w: 11.9, fontSize: 16, color: mc }); y += 0.9; }
        if (s.bullets?.length) sl.addText(s.bullets.map((b) => ({ text: b, options: { bullet: true } })), { x: 0.7, y, w: 11.9, h: 4, fontSize: 18, color: tc, lineSpacingMultiple: 1.3 });
        if (s.stat?.length) s.stat.forEach((st, k) => { sl.addText(st.value, { x: 0.7 + k * 3, y: 3, w: 2.8, fontSize: 40, bold: true, color: ac }); sl.addText(st.label, { x: 0.7 + k * 3, y: 4, w: 2.8, fontSize: 14, color: mc }); });
        if (s.quote?.text) { sl.addText(`"${s.quote.text}"`, { x: 0.9, y: 2.5, w: 11.5, fontSize: 26, italic: true, color: tc }); if (s.quote.author) sl.addText(`— ${s.quote.author}`, { x: 0.9, y: 5, w: 11, fontSize: 16, color: ac }); }
        if (s.columns?.length) s.columns.forEach((c, k) => { sl.addText(c.heading, { x: 0.7 + k * 6, y: 2.1, w: 5.6, fontSize: 20, bold: true, color: ac }); sl.addText(c.items.map((it) => ({ text: it, options: { bullet: true } })), { x: 0.7 + k * 6, y: 2.7, w: 5.6, h: 4, fontSize: 16, color: tc }); });
        if (s.imageUrl) { try { sl.addImage({ path: s.imageUrl, x: 7.2, y: 1, w: 5.4, h: 5.5, sizing: { type: "cover", w: 5.4, h: 5.5 } }); } catch {} }
        if (s.notes) sl.addNotes(s.notes);
      }
      await p.writeFile({ fileName: `${deck.title.replace(/[^\w -]/g, "").slice(0, 60) || "deck"}.pptx` });
    } catch { flash("PPTX export failed"); } finally { setBusy(""); }
  };

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setCur((c) => Math.min((deck?.slides.length || 1) - 1, c + 1));
      else if (e.key === "ArrowLeft") setCur((c) => Math.max(0, c - 1));
      else if (e.key === "Escape") setPresent(false);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [present, deck]);

  // ---------- styles ----------
  const btn = (x?: React.CSSProperties): React.CSSProperties => ({ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--hairline)", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink)", ...x });
  const primaryBtn = btn({ background: "var(--studio-primary)", color: "#fff", border: "none" });
  const tb: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: "1px solid var(--hairline)", background: "var(--card-bg,#fff)", cursor: "pointer", fontSize: 14, color: "var(--ink)", display: "grid", placeItems: "center" };
  const menuItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: "none", background: "transparent", borderRadius: 8, fontSize: 13.5, color: "var(--ink)", cursor: "pointer", textAlign: "left", whiteSpace: "nowrap" };
  const pane: React.CSSProperties = { background: "#fff", borderRadius: 16, border: "1px solid var(--hairline)", display: "flex", flexDirection: "column", minWidth: 0 };
  const scale = boxW / W;
  const langMenu = (asCopy: boolean) => (
    <div style={{ position: "absolute", right: "100%", top: 0, marginRight: 4, background: "var(--card-bg,#fff)", border: "1px solid var(--hairline)", borderRadius: 10, boxShadow: "var(--shadow-card)", padding: 6, minWidth: 140, maxHeight: 280, overflowY: "auto" }}>
      {LANGS.map((l) => <button key={l} style={menuItem} onClick={() => translate(l, asCopy)}>{l}</button>)}
    </div>
  );

  // ============================ render ============================
  const slide = deck?.slides[cur];
  const setupLabel = phase === "compose" ? "" : phase === "deck" ? "Ready" : "Setup in progress";

  // ---- Compose hero (Figma home) — shown before a deck is started ----
  if (phase === "compose" && !deck && chat.length === 0) {
    const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 999, border: "1px solid var(--hairline)", background: "var(--card-bg,#fff)", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" };
    const first = (userName || "").trim().split(/[\s@]+/)[0] || "";
    const greeting = first ? `Good morning ${first.charAt(0).toUpperCase() + first.slice(1)}! What do you want to create today?` : "What do you want to create today?";
    // Realistic fanned previews (deck slide · city visual · email) — matches Figma.
    const deckMock = (
      <div style={{ position: "absolute", inset: 0, background: "#fff", padding: "12px 13px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: "#0b1416" }}>Q4 2024 GROWTH</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0b1416", marginBottom: 6 }}>STRATEGY</div>
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {["Expand market reach", "Innovate product line", "Optimize journey"].map((t, k) => <div key={k} style={{ fontSize: 6.5, color: "#3a4a4a" }}>▸ {t}</div>)}
          </div>
          <div style={{ width: 46, display: "flex", alignItems: "flex-end", gap: 3 }}>
            {[10, 18, 13, 24].map((h, k) => <div key={k} style={{ width: 8, height: h, background: k === 3 ? "#c2e54b" : "#00a18b", borderRadius: 2 }} />)}
          </div>
        </div>
      </div>
    );
    const cityMock = (
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#04121a,#0a2b2f)", overflow: "hidden" }}>
        {[14, 30, 46, 60, 74, 88].map((l, k) => <div key={k} style={{ position: "absolute", left: `${l}%`, bottom: 0, width: 3, height: `${30 + (k % 3) * 22}%`, background: k % 2 ? "linear-gradient(#7de7c6,transparent)" : "linear-gradient(#c2e54b,transparent)", opacity: 0.85 }} />)}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 55%,rgba(0,0,0,.5))" }} />
      </div>
    );
    const emailMock = (
      <div style={{ position: "absolute", inset: 0, background: "#eef4f3", padding: "12px 13px" }}>
        <div style={{ fontSize: 8, color: "#5a6a6c" }}>To: janet.chen@…</div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0b1416", margin: "4px 0" }}>Subject: Q4 Project Alpha</div>
        <div style={{ fontSize: 8, color: "#5a6a6c", marginBottom: 8 }}>From: Janet Chen</div>
        {[100, 92, 80, 96, 60].map((w, k) => <div key={k} style={{ height: 3, width: `${w}%`, background: "#cdd9d6", borderRadius: 2, marginBottom: 4 }} />)}
      </div>
    );
    const previews = [
      { rot: -13, x: -150, content: deckMock },
      { rot: 0, x: 0, front: true, content: cityMock },
      { rot: 13, x: 150, content: emailMock },
    ];
    return (
      <div style={{ ...pane, height: "calc(100vh - 20px)", position: "relative" }}>
        {notice && <div style={{ position: "fixed", top: 16, right: 16, background: "var(--studio-primary)", color: "#fff", padding: "8px 14px", borderRadius: 8, zIndex: 60 }}>{notice}</div>}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {/* fanned deck previews */}
          <div style={{ position: "relative", width: 420, height: 150, marginBottom: 34 }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: "absolute", left: "50%", top: 0, width: 220, height: 132, marginLeft: -110, transform: `translateX(${p.x * 0.55}px) rotate(${p.rot}deg)`, borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.35)", zIndex: p.front ? 3 : 1, background: "#fff" }}>{p.content}</div>
            ))}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", textAlign: "center", margin: "0 0 22px" }}>{greeting}</h1>
          <div style={{ width: "100%", maxWidth: 760, border: "1.5px solid var(--studio-primary)", borderRadius: 16, padding: 14, background: "var(--card-bg,#fff)" }}>
            <textarea value={compose} onChange={(e) => setCompose(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (compose.trim()) { startFromPrompt(compose); setCompose(""); } } }}
              placeholder="What topics should your deck include? Tell the main points and visuals." rows={2}
              style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 16, color: "var(--ink)", minHeight: 30, background: "transparent", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select value={deckType} onChange={(e) => setDeckType(e.target.value as any)} style={chip} title="Deck Type">
                <option value="HTML">🖥 HTML</option><option value="Images">🖼 Images</option>
              </select>
              <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={chip} title="Theme">
                {themes.map((th) => <option key={th.id} value={th.id}>🎨 {th.name}</option>)}
              </select>
              <select value={style} onChange={(e) => setStyle(e.target.value)} style={chip} title="Style">
                {["Story Telling", "Data-driven", "Minimal", "Persuasive", "Technical"].map((s) => <option key={s} value={s}>✎ {s}</option>)}
              </select>
              <select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} style={chip} title="Slides">
                {[6, 8, 10, 12, 15].map((n) => <option key={n} value={n}># {n} Slides</option>)}
              </select>
              <span style={{ marginInlineStart: "auto" }} />
              <span style={{ ...chip, background: "var(--mint-pill)", color: "var(--studio-teal-dark)", border: "none" }}>Claude Opus 4.8</span>
              <button style={{ width: 40, height: 34, borderRadius: 999, border: "none", background: "var(--studio-primary)", color: "#fff", cursor: "pointer", fontSize: 18 }}
                disabled={!compose.trim()} onClick={() => { if (compose.trim()) { startFromPrompt(compose); setCompose(""); } }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, height: "calc(100vh - 20px)" }}>
      {notice && <div style={{ position: "fixed", top: 16, right: 16, background: "var(--studio-primary)", color: "#fff", padding: "8px 14px", borderRadius: 8, zIndex: 60 }}>{notice}</div>}

      {/* ---------------- LEFT: chat ---------------- */}
      <div style={{ ...pane, width: 440, flexShrink: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {phase === "compose" && chat.length === 0 && (
            <div style={{ margin: "auto 0", textAlign: "center", color: "var(--muted)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--studio-primary)", letterSpacing: 1 }}>DECK STUDIO</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: "8px 0" }}>Describe your deck</div>
              <div style={{ fontSize: 13.5 }}>HUMAIN will ask a couple of questions, draft an outline you can edit, then design the slides.</div>
            </div>
          )}
          {chat.map((m, i) => (
            m.role === "user" ? (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: "88%", background: "var(--studio-primary)", color: "#fff", borderRadius: 14, padding: "10px 13px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.text}</div>
            ) : (
              <div key={i} style={{ alignSelf: "flex-start", maxWidth: "92%", background: "var(--soft-bg, #f4f7f6)", color: "var(--ink)", borderRadius: 14, padding: "10px 13px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--studio-primary)", marginBottom: 3 }}>HUMAIN</div>{m.text}
              </div>
            )
          ))}
          {/* current clarifying question */}
          {phase === "setup" && questions.length > 0 && questions[qi] && (
            <div style={{ border: "1px solid var(--hairline)", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 12, fontWeight: 700 }}><span>Question</span><span>{qi + 1} of {questions.length}</span></div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink)", margin: "8px 0 2px" }}>{questions[qi].question}</div>
              {questions[qi].hint && <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>{questions[qi].hint}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {questions[qi].options.map((o) => (
                  <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `1px solid ${choice === o ? "var(--studio-primary)" : "var(--hairline)"}`, background: choice === o ? "var(--mint-pill)" : "#fff" }}>
                    <input type="radio" checked={choice === o} onChange={() => setChoice(o)} /> <span style={{ fontSize: 14 }}>{o}</span>
                  </label>
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, cursor: "pointer", border: `1px solid ${choice === "__other__" ? "var(--studio-primary)" : "var(--hairline)"}` }}>
                  <input type="radio" checked={choice === "__other__"} onChange={() => setChoice("__other__")} />
                  <input value={other} onChange={(e) => { setOther(e.target.value); setChoice("__other__"); }} placeholder="Other" style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "var(--ink)" }} />
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button style={primaryBtn} disabled={!!busy || (!choice)} onClick={answerCurrent}>{qi >= questions.length - 1 ? "Generate outline" : "Next"}</button>
              </div>
            </div>
          )}
          {busy && <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--studio-teal-dark)", fontSize: 13 }}><span className="humain-spin" style={{ width: 16, height: 16, border: "2.5px solid var(--mint-pill)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block" }} /> {busy}<style>{`@keyframes humain-spin{to{transform:rotate(360deg)}}.humain-spin{animation:humain-spin .7s linear infinite}`}</style></div>}
          {err && <div style={{ color: "#b42318", fontSize: 13 }}>{err}</div>}
          <div ref={chatEndRef} />
        </div>
        {/* composer */}
        <div style={{ borderTop: "1px solid var(--hairline)", padding: 12 }}>
          <textarea
            value={phase === "compose" ? compose : compose}
            onChange={(e) => setCompose(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (phase === "compose") { startFromPrompt(compose); setCompose(""); } else sendRefine(); } }}
            placeholder={phase === "compose" ? "Describe your deck…" : phase === "deck" ? "Refine this deck, a slide, or add a new one…" : "Answer the questions above…"}
            rows={2}
            style={{ width: "100%", border: "1px solid var(--hairline)", borderRadius: 12, padding: "10px 12px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", color: "var(--ink)", background: "var(--card-bg, #fff)" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button style={primaryBtn} disabled={!!busy || !compose.trim()} onClick={() => { if (phase === "compose") { startFromPrompt(compose); setCompose(""); } else sendRefine(); }}>{phase === "compose" ? "Start" : "Send"}</button>
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT: deck canvas ---------------- */}
      <div style={{ ...pane, flex: 1 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck?.title || outTitle || "Deck setup"}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{phase === "deck" ? `${deck?.slides.length} slides` : phase === "outline" ? "Review your outline before generating" : "I am preparing questions before generating the outline."}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {phase === "deck" && !editing && (<>
              <button style={btn()} onClick={enableEditing}>✎ Enable editing</button>
              <button style={btn()} onClick={() => setPresent(true)}>▶ Present</button>
              <button style={btn()} onClick={exportPptx}>PPTX</button>
              <div style={{ position: "relative" }}>
                <button style={btn()} onClick={() => { setMenuOpen((o) => !o); setLangOpen(""); }}>⋮</button>
                {menuOpen && (
                  <div style={{ position: "absolute", right: 0, top: 40, zIndex: 60, background: "var(--card-bg,#fff)", border: "1px solid var(--hairline)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 6, minWidth: 210 }}>
                    <button style={menuItem} onClick={makeCopy}>⧉ Make a copy</button>
                    <div style={{ position: "relative" }}>
                      <button style={menuItem} onClick={() => setLangOpen((m) => (m === "tr" ? "" : "tr"))}>🌐 Translate Deck ▸</button>
                      {langOpen === "tr" && langMenu(false)}
                    </div>
                    <div style={{ position: "relative" }}>
                      <button style={menuItem} onClick={() => setLangOpen((m) => (m === "cp" ? "" : "cp"))}>🌐 Make a translated copy ▸</button>
                      {langOpen === "cp" && langMenu(true)}
                    </div>
                  </div>
                )}
              </div>
              <button style={primaryBtn} disabled={!!busy} onClick={save}>{savedId ? "Update" : "Save"}</button>
            </>)}
            {phase === "deck" && editing && (<>
              <button style={tb} title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")}><b>B</b></button>
              <button style={tb} title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")}><i>I</i></button>
              <button style={tb} title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")}><u>U</u></button>
              <label style={{ ...tb, position: "relative" }} title="Text color" onMouseDown={(e) => e.preventDefault()}>A<input type="color" onInput={(e) => exec("foreColor", (e.target as HTMLInputElement).value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} /></label>
              <label style={{ ...tb, position: "relative" }} title="Highlight" onMouseDown={(e) => e.preventDefault()}>🖍<input type="color" onInput={(e) => exec("hiliteColor", (e.target as HTMLInputElement).value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} /></label>
              <button style={tb} title="Undo" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")}>↶</button>
              <button style={tb} title="Redo" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")}>↷</button>
              <button style={btn(showSource ? { background: "var(--mint-pill)" } : {})} onClick={() => setShowSource((s) => !s)}>&lt;/&gt; Source</button>
              <button style={btn()} onClick={() => { setEditing(false); setShowSource(false); }}>Exit edit</button>
              {dirty && <span style={{ fontSize: 12, fontWeight: 700, color: "#b26a00", background: "#fff3e0", padding: "4px 9px", borderRadius: 999 }}>Unsaved</span>}
              <button style={primaryBtn} disabled={!!busy} onClick={save}>Save</button>
            </>)}
            {!editing && setupLabel && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "5px 11px", borderRadius: 999 }}>{setupLabel}</span>}
          </div>
        </div>

        {/* body */}
        {phase !== "deck" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {phase === "outline" ? (
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <input value={outTitle} onChange={(e) => setOutTitle(e.target.value)} style={{ width: "100%", fontSize: 24, fontWeight: 700, border: "none", borderBottom: "2px solid var(--hairline)", padding: "6px 2px", color: "var(--ink)", background: "transparent", marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "10px 0 16px" }}>
                  <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{outline.length} slides · 16:9 · theme</span>
                  <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={{ ...btn(), padding: "6px 8px" }}>{themes.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}</select>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10 }}>SLIDE TITLES — edit, reorder or remove</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {outline.map((o, i) => (
                    <div key={i} draggable onDragStart={() => { dragI.current = i; }} onDragOver={(e) => e.preventDefault()} onDrop={() => dropAt(i)}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--soft-bg, #fafcfb)" }}>
                      <span title="Drag to reorder" style={{ cursor: "grab", color: "var(--muted)", fontSize: 16, lineHeight: 1, userSelect: "none" }}>⠿</span>
                      <span style={{ color: "var(--studio-primary)", fontWeight: 800, minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                      <input value={o.title} onChange={(e) => setOutline((os) => os.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} style={{ flex: 1, border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: "var(--ink)", outline: "none" }} />
                      <button style={btn({ padding: "4px 8px" })} onClick={() => move(i, -1)}>↑</button>
                      <button style={btn({ padding: "4px 8px" })} onClick={() => move(i, 1)}>↓</button>
                      <button style={btn({ padding: "4px 8px", color: "#b42318" })} onClick={() => setOutline((os) => os.filter((_, k) => k !== i))}>✕</button>
                    </div>
                  ))}
                </div>
                <button style={btn({ marginTop: 10 })} onClick={() => setOutline((os) => [...os, { title: "New slide", intent: "" }])}>+ Add slide</button>
                <div style={{ position: "sticky", bottom: 0, marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <span style={{ alignSelf: "center", fontSize: 13, color: "var(--muted)" }}>{outline.length} slides · Ready to generate</span>
                  <button style={primaryBtn} disabled={!!busy} onClick={generateDeck}>{busy || "Generate deck →"}</button>
                </div>
              </div>
            ) : (
              // setup / compose placeholder
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--studio-teal-dark)", marginBottom: 14 }}>Content</div>
                <div style={{ width: 220, border: "1px dashed var(--hairline)", borderRadius: 12, padding: 20 }}>
                  <div style={{ height: 46, background: "var(--mint-pill)", borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ height: 8, background: "var(--hairline)", borderRadius: 4, marginBottom: 7 }} />
                  <div style={{ height: 8, background: "var(--hairline)", borderRadius: 4, width: "80%", marginBottom: 7 }} />
                  <div style={{ height: 8, background: "var(--studio-primary)", borderRadius: 4, width: "40%" }} />
                </div>
                <div style={{ marginTop: 16, fontSize: 13.5 }}>{phase === "setup" ? "Answer the setup questions and I will start drafting the deck here." : "Describe your deck on the left to begin."}</div>
              </div>
            )}
          </div>
        ) : deck && slide ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* thumbnails */}
            <div style={{ width: 150, borderRight: "1px solid var(--hairline)", overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)" }}>{deck.slides.length} SLIDES</div>
              {deck.slides.map((s, i) => (
                <div key={s.id} onClick={() => setCur(i)} style={{ cursor: "pointer", border: i === cur ? "2px solid var(--studio-primary)" : "2px solid transparent", borderRadius: 10, padding: 2 }}>
                  <ScaledSlide slide={s} t={t} index={i} total={deck.slides.length} boxW={122} />
                </div>
              ))}
            </div>
            {/* stage */}
            <div ref={stageRef} style={{ flex: 1, minWidth: 0, padding: 20, overflowY: "auto", background: "var(--soft-bg, #f4f6f6)", display: "flex", gap: 16 }}>
              <div style={{ margin: "0 auto", width: "fit-content" }}>
                {editing ? (
                  <div style={{ width: boxW, height: H * scale, overflow: "hidden", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,.18)" }}>
                    <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}>
                      <EditableSlide key={`${slide.id}-${srcNonce}`} html={slide.html || slideHtml(slide, t)} t={t} onChange={setCurHtml} />
                    </div>
                  </div>
                ) : (
                  <ScaledSlide slide={slide} t={t} index={cur} total={deck.slides.length} boxW={boxW} />
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <button style={btn()} onClick={() => setCur((c) => Math.max(0, c - 1))}>←</button>
                  <span style={{ alignSelf: "center", fontSize: 13, color: "var(--muted)" }}>{cur + 1} / {deck.slides.length}</span>
                  <button style={btn()} onClick={() => setCur((c) => Math.min(deck.slides.length - 1, c + 1))}>→</button>
                  {!editing && <button style={btn()} disabled={!!busy} onClick={() => sendRefineQuick("Improve and tighten this slide.")}>↻ Refine</button>}
                  {!editing && <select value={deck.theme} onChange={(e) => setDeck({ ...deck, theme: e.target.value })} style={{ ...btn(), padding: "8px 10px" }}>{themes.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}</select>}
                </div>
              </div>
              {editing && showSource && (
                <div style={{ width: 340, flexShrink: 0, background: "var(--card-bg,#fff)", border: "1px solid var(--hairline)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>HTML SOURCE</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", margin: "2px 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slide.title || `Slide ${cur + 1}`}</div>
                  <textarea value={slide.html || slideHtml(slide, t)} onChange={(e) => { setCurHtml(e.target.value); setSrcNonce((n) => n + 1); }}
                    style={{ flex: 1, minHeight: 380, width: "100%", border: "1px solid var(--hairline)", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 12, resize: "none", color: "var(--ink)", background: "var(--soft-bg,#fafcfb)" }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)" }}>{busy || "Loading…"}</div>
        )}
      </div>

      {/* present overlay */}
      {present && deck && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCur((c) => Math.min(deck.slides.length - 1, c + 1))}>
          <PresentSlide slide={deck.slides[cur]} t={t} index={cur} total={deck.slides.length} />
          <div style={{ position: "fixed", bottom: 20, display: "flex", gap: 14, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <button style={btn()} onClick={() => setCur((c) => Math.max(0, c - 1))}>←</button>
            <span style={{ color: "#fff" }}>{cur + 1} / {deck.slides.length}</span>
            <button style={btn()} onClick={() => setCur((c) => Math.min(deck.slides.length - 1, c + 1))}>→</button>
            <button style={btn()} onClick={() => setPresent(false)}>✕ Esc</button>
          </div>
        </div>
      )}
    </div>
  );

  // quick refine (button) reuses the slide agent
  function sendRefineQuick(instruction: string) {
    if (!deck) return;
    const slide = deck.slides[cur]; setBusy("Refining slide…");
    fetch("/api/deck/slide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deckTitle: deck.title, slide, instruction }) })
      .then((r) => r.json()).then((j) => { if (j.id) updateSlide(cur, { ...j, id: slide.id, imageUrl: slide.imageUrl }); }).finally(() => setBusy(""));
  }
}
