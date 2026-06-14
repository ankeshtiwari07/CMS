"use client";
import { useEffect, useRef, useState } from "react";
import {
  PlusIcon, ImageIcon, LayoutAutoIcon, PaletteIcon, MicIcon, ChevronDownIcon, ArrowUpIcon,
  PaperclipIcon, ClockIcon, MonitorIcon, GlobeIcon, MailIcon, TranslateIcon, GridIcon,
  CodeIcon, CheckIcon, XIcon, FileIcon, SquareIcon, SparkIcon, CalendarIcon, MegaphoneIcon,
  BookmarkIcon, VideoIcon, BuildingIcon,
} from "@/components/icons";
import Markdown from "@/components/studio/markdown";

type Mode =
  | "auto" | "image" | "deck" | "website" | "email" | "writing" | "translation" | "designSystem"
  | "event" | "webinar" | "campaign" | "brandGuideline" | "websiteBuild" | "video"
  | "conference" | "summit";
type Att = { name: string; size: number; text?: string };

// Quick-action buttons shown below the chat — fast mode selectors.
const QUICK_ACTIONS: { key: string; label: string; mode: Mode; Icon: any }[] = [
  { key: "conference", label: "Conference", mode: "conference", Icon: CalendarIcon },
  { key: "webinar", label: "Webinar", mode: "webinar", Icon: MonitorIcon },
  { key: "summit", label: "Summit", mode: "summit", Icon: BuildingIcon },
  { key: "content", label: "Content", mode: "writing", Icon: FileIcon },
  { key: "campaign", label: "Campaign", mode: "campaign", Icon: MegaphoneIcon },
];
type Turn = {
  role: "user" | "assistant";
  text: string;
  mode?: Mode;
  preview?: boolean;
  html?: boolean;
  video?: boolean;
  videoPrompt?: string;
  model?: string;
  streaming?: boolean;
  artifactHtml?: string; // a built website/app, rendered in an in-chat viewer
};

// Text modes stream a conversational, agentic reply (token-by-token). The rich
// artifact modes (websiteBuild → iframe, video → render panel, image/deck →
// concept preview) keep the one-shot /api/generate path.
const STREAM_MODES: Mode[] = [
  "auto", "writing", "website", "email", "translation", "designSystem",
  "event", "webinar", "campaign", "brandGuideline", "conference", "summit",
];

// Active-mode chip metadata (label + icon) for the secondary modes.
const MODE_META: Partial<Record<Mode, { label: string; Icon: any }>> = {
  website: { label: "Create Website", Icon: GlobeIcon },
  email: { label: "Create Email", Icon: MailIcon },
  translation: { label: "Translate", Icon: TranslateIcon },
  designSystem: { label: "Design System", Icon: PaletteIcon },
  event: { label: "Create Event", Icon: CalendarIcon },
  webinar: { label: "Create Webinar", Icon: MonitorIcon },
  campaign: { label: "Build Campaign", Icon: MegaphoneIcon },
  brandGuideline: { label: "Brand Guideline", Icon: BookmarkIcon },
  websiteBuild: { label: "Build Website", Icon: CodeIcon },
  video: { label: "Create Video", Icon: VideoIcon },
  conference: { label: "Create Conference", Icon: CalendarIcon },
  summit: { label: "Create Summit", Icon: BuildingIcon },
  writing: { label: "Create Content", Icon: FileIcon },
};

const RATIOS = [
  { key: "auto", label: "Auto", hint: "" },
  { key: "square", label: "Square", hint: "1:1" },
  { key: "portrait", label: "Portrait", hint: "3:4" },
  { key: "story", label: "Story", hint: "9:16" },
  { key: "landscape", label: "Landscape", hint: "4:3" },
  { key: "widescreen", label: "Widescreen", hint: "16:9" },
];
const STYLES = ["No style", "Abstract", "Risograph", "Vector Art", "Photorealistic"];

type ModelOpt = { id: string; label: string; family: string; fast: boolean; configured: boolean };
const FALLBACK_MODELS: ModelOpt[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", family: "Claude", fast: false, configured: true },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", family: "Claude", fast: true, configured: true },
];

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [ratio, setRatio] = useState("auto");
  const [style, setStyle] = useState("No style");
  const [deckFormat, setDeckFormat] = useState<"html" | "image">("html");
  const [files, setFiles] = useState<Att[]>([]);
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [models, setModels] = useState<ModelOpt[]>(FALLBACK_MODELS);
  const [modelId, setModelId] = useState("claude-opus-4-8");
  const [open, setOpen] = useState<null | "plus" | "ratio" | "style" | "model" | "suggest">(null);

  const current = models.find((m) => m.id === modelId) || models[0];

  const recRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close any open menu (+, ratio, style, model, suggestions) on an outside
  // click or Escape.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function focusPrompt() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => document.querySelector<HTMLTextAreaElement>("#studio-prompt")?.focus(), 50);
  }

  useEffect(() => {
    // Quick-create / "+" menu prefill the prompt and focus it.
    const prefill = (e: Event) => {
      const d = (e as CustomEvent).detail as { prompt?: string; mode?: Mode };
      if (d.prompt !== undefined) setPrompt(d.prompt);
      if (d.mode) setMode(d.mode);
      setTurns([]);
      focusPrompt();
    };
    // "Create new" in the sidebar resets to a blank conversation.
    const newChat = () => {
      setPrompt("");
      setTurns([]);
      setFiles([]);
      setMode("auto");
      focusPrompt();
    };
    // "Add photos & files" from the Create-new menu opens the file picker.
    const addFiles = () => { focusPrompt(); setTimeout(() => fileRef.current?.click(), 200); };
    globalThis.addEventListener("humain:prefill", prefill);
    globalThis.addEventListener("humain:newchat", newChat);
    globalThis.addEventListener("humain:addfiles", addFiles);

    // Load the model catalog (Claude / GPT / Grok / Gemini) + configured status.
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.models) && d.models.length) setModels(d.models);
      })
      .catch(() => {});

    return () => {
      globalThis.removeEventListener("humain:prefill", prefill);
      globalThis.removeEventListener("humain:newchat", newChat);
      globalThis.removeEventListener("humain:addfiles", addFiles);
    };
  }, []);

  const suggestions =
    prompt.trim().length >= 3 && open !== null
      ? ["deck", "image", "email"].map((s) => `${prompt.trim()} ${s}`)
      : [];

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const next: Att[] = [];
    for (const f of Array.from(list)) {
      let text: string | undefined;
      if (f.type.startsWith("text") || /\.(txt|md|csv|json|html?)$/i.test(f.name)) {
        text = (await f.text()).slice(0, 8000);
      }
      next.push({ name: f.name, size: f.size, text });
    }
    setFiles((p) => [...p, ...next]);
  }

  // Update the most recent assistant turn (used while streaming tokens in).
  function patchLastAssistant(fn: (t: Turn) => Turn) {
    setTurns((p) => {
      const i = p.length - 1;
      if (i < 0 || p[i].role !== "assistant") return p;
      const next = p.slice();
      next[i] = fn(next[i]);
      return next;
    });
  }

  async function generate() {
    if (!prompt.trim() || busy) return;
    const userText = prompt.trim();
    setBusy(true);
    setOpen(null);
    setPrompt(""); // clear the composer after sending, like Claude
    const aiMode = mode === "auto" ? "writing" : mode;
    const attachments = files.filter((f) => f.text).map((f) => ({ name: f.name, text: f.text }));
    // Build conversation context from the last few turns (text only, truncated).
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: (t.text || "").slice(0, 6000) }));
    const options = { ratio, style, deckFormat, modelLabel: current?.label, files: files.map((f) => f.name), attachments };
    setTurns((p) => [...p, { role: "user", text: userText, mode }]);

    // ---- Conversational, streaming, agentic path (text modes) ----
    if (STREAM_MODES.includes(mode)) {
      setTurns((p) => [...p, { role: "assistant", text: "", mode, model: current?.label, streaming: true }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: aiMode, prompt: userText, model: modelId, history, options }),
        });
        if (!res.ok || !res.body) {
          const d = await res.json().catch(() => ({}));
          patchLastAssistant((t) => ({ ...t, text: d.error || "Generation failed.", streaming: false }));
          setBusy(false);
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
            if (!line) continue;
            let ev: any;
            try { ev = JSON.parse(line); } catch { continue; }
            if (ev.type === "delta") patchLastAssistant((t) => ({ ...t, text: (t.text || "") + ev.text }));
            else if (ev.type === "reset") patchLastAssistant((t) => ({ ...t, text: "" }));
            else if (ev.type === "artifact" && ev.kind === "html") patchLastAssistant((t) => ({ ...t, artifactHtml: ev.html }));
            else if (ev.type === "error") patchLastAssistant((t) => ({ ...t, text: `${t.text ? t.text + "\n\n" : ""}⚠️ ${ev.message}`, streaming: false }));
            else if (ev.type === "done") patchLastAssistant((t) => ({ ...t, model: ev.modelLabel || t.model, streaming: false }));
            // "status" / "agents" events carry agent activity — no visual change.
          }
        }
        patchLastAssistant((t) => ({ ...t, streaming: false }));
      } catch {
        patchLastAssistant((t) => ({ ...t, text: "Could not reach the generation service.", streaming: false }));
      }
      setBusy(false);
      return;
    }

    // ---- Rich artifact modes (websiteBuild / video / image / deck) ----
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: aiMode, prompt: userText, model: modelId, history, options }),
      });
      const data = await res.json();
      if (!res.ok) setTurns((p) => [...p, { role: "assistant", text: data.error || "Generation failed." }]);
      else setTurns((p) => [...p, {
        role: "assistant",
        text: data.artifact ?? "No output.",
        mode,
        preview: data.preview,
        model: data.modelLabel || current?.label,
        html: data.html,
        video: data.video,
        videoPrompt: data.videoPrompt,
      }]);
    } catch {
      setTurns((p) => [...p, { role: "assistant", text: "Could not reach the generation service." }]);
    }
    setBusy(false);
  }

  function toggleMic() {
    const SR = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (!SR) { setTurns((p) => [...p, { role: "assistant", text: "Voice input needs Chrome or Edge." }]); return; }
    if (listening) return recRef.current?.stop();
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e: any) => setPrompt(Array.from(e.results).map((r: any) => r[0].transcript).join(" "));
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  const chip = (active: boolean, extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 13px",
    borderRadius: 999, border: `1px solid ${active ? "var(--studio-primary)" : "var(--hairline)"}`,
    background: active ? "var(--mint-pill)" : "#fff", color: active ? "var(--studio-teal-dark)" : "var(--ink)",
    fontSize: 13.5, fontWeight: 600, cursor: "pointer", position: "relative", ...extra,
  });
  const menuWrap: React.CSSProperties = {
    position: "absolute", zIndex: 40, background: "#fff", border: "1px solid var(--hairline)",
    borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 6, minWidth: 220,
  };
  const item: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px",
    border: "none", background: "transparent", borderRadius: 8, fontSize: 14, color: "var(--ink)",
    cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
  };

  const hasText = prompt.trim().length > 0;

  return (
    <div ref={rootRef} style={{ width: "100%", maxWidth: 840, margin: "0 auto", position: "relative" }}>
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      <div style={{ border: "1.5px solid var(--studio-primary)", borderRadius: 16, background: "#fff", padding: "14px 16px 12px" }}>
        {/* upload chips */}
        {files.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginBottom: 12 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--hairline)", borderRadius: 12, padding: "10px 12px" }}>
                <span style={{ width: 34, height: 40, borderRadius: 6, background: "var(--mint-pill)", display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                  <FileIcon size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmtSize(f.size)} · 100% uploaded</span>
                </span>
                <button aria-label="Remove" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: "var(--muted)" }}>
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          id="studio-prompt"
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setOpen(e.target.value.trim().length >= 3 ? "suggest" : null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
          placeholder={turns.length ? "Ask a follow-up or refine…" : "Describe what you want to create"}
          rows={1}
          style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 16, color: "var(--ink)", minHeight: 26, lineHeight: 1.5 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {/* + menu */}
          <div style={{ position: "relative" }}>
            <button aria-label="Add" onClick={() => setOpen(open === "plus" ? null : "plus")}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", color: "var(--studio-primary)", display: "grid", placeItems: "center" }}>
              <PlusIcon size={20} />
            </button>
            {open === "plus" && (
              <div style={{ ...menuWrap, top: 38, left: 0, maxHeight: 360, overflow: "auto" }}>
                <button style={item} onClick={() => { fileRef.current?.click(); setOpen(null); }}><PaperclipIcon size={17} color="var(--muted)" /> Add photos &amp; files</button>
                <button style={item} onClick={() => globalThis.dispatchEvent(new CustomEvent("humain:recent"))}><ClockIcon size={17} color="var(--muted)" /> Recent projects</button>
                <div style={{ height: 1, background: "var(--hairline)", margin: "4px 0" }} />
                <button style={item} onClick={() => { setMode("deck"); setOpen(null); }}><MonitorIcon size={17} color="var(--muted)" /> Create Deck</button>
                <button style={item} onClick={() => { setMode("image"); setOpen(null); }}><ImageIcon size={17} color="var(--muted)" /> Create Image</button>
                <button style={item} onClick={() => { setMode("video"); setOpen(null); }}><VideoIcon size={17} color="var(--muted)" /> Create Video</button>
                <button style={item} onClick={() => { setMode("websiteBuild"); setOpen(null); }}><CodeIcon size={17} color="var(--muted)" /> Build Website</button>
                <button style={item} onClick={() => { setMode("website"); setOpen(null); }}><GlobeIcon size={17} color="var(--muted)" /> Website Copy</button>
                <button style={item} onClick={() => { setMode("email"); setOpen(null); }}><MailIcon size={17} color="var(--muted)" /> Create Email</button>
                <button style={item} onClick={() => { setMode("event"); setOpen(null); }}><CalendarIcon size={17} color="var(--muted)" /> Create Event</button>
                <button style={item} onClick={() => { setMode("webinar"); setOpen(null); }}><MonitorIcon size={17} color="var(--muted)" /> Create Webinar</button>
                <button style={item} onClick={() => { setMode("campaign"); setOpen(null); }}><MegaphoneIcon size={17} color="var(--muted)" /> Build Campaign</button>
                <button style={item} onClick={() => { setMode("brandGuideline"); setOpen(null); }}><BookmarkIcon size={17} color="var(--muted)" /> Brand Guideline</button>
                <button style={item} onClick={() => { globalThis.dispatchEvent(new CustomEvent("humain:prefill", { detail: { mode: "auto" } })); setOpen(null); }}><GridIcon size={17} color="var(--muted)" /> Use template</button>
                <button style={item} onClick={() => { setMode("designSystem"); setOpen(null); }}><PaletteIcon size={17} color="var(--muted)" /> Design System</button>
                <button style={item} onClick={() => { setMode("translation"); setOpen(null); }}><TranslateIcon size={17} color="var(--muted)" /> Translate</button>
              </div>
            )}
          </div>

          {/* per-mode controls */}
          {mode === "image" && (
            <>
              <span style={chip(true)} onClick={() => setMode("auto")}><XIcon size={14} /><ImageIcon size={16} /> Create Image</span>
              <div style={{ position: "relative" }}>
                <span style={chip(false)} onClick={() => setOpen(open === "ratio" ? null : "ratio")}>
                  <LayoutAutoIcon size={16} /> {RATIOS.find((r) => r.key === ratio)?.label} <ChevronDownIcon size={14} />
                </span>
                {open === "ratio" && (
                  <div style={{ ...menuWrap, top: 42, left: 0, minWidth: 200 }}>
                    <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Choose image ratio</div>
                    {RATIOS.map((r) => (
                      <button key={r.key} style={item} onClick={() => { setRatio(r.key); setOpen(null); }}>
                        <SquareIcon size={15} color="var(--muted)" /> {r.label}
                        <span style={{ marginInlineStart: "auto", color: "var(--muted)", fontSize: 12 }}>{r.hint}</span>
                        {ratio === r.key && <CheckIcon size={15} color="var(--studio-primary)" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <span style={chip(false)} onClick={() => setOpen(open === "style" ? null : "style")}><PaletteIcon size={16} /> Style</span>
                {open === "style" && (
                  <div style={{ ...menuWrap, top: 42, left: 0 }}>
                    <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Choose image style</div>
                    {STYLES.map((s) => (
                      <button key={s} style={{ ...item, justifyContent: "space-between" }} onClick={() => { setStyle(s); setOpen(null); }}>
                        <span>{s}</span>{style === s && <CheckIcon size={15} color="var(--studio-primary)" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ ...chip(false), color: "var(--muted)", padding: "0 11px" }}><ImageIcon size={15} /> {files.length || 1}</span>
            </>
          )}
          {mode === "deck" && (
            <>
              <span style={chip(true)} onClick={() => setMode("auto")}><XIcon size={14} /><MonitorIcon size={16} /> Create Deck</span>
              <span style={chip(deckFormat === "html")} onClick={() => setDeckFormat("html")}><CodeIcon size={16} /> HTML</span>
              <span style={chip(deckFormat === "image")} onClick={() => setDeckFormat("image")}><ImageIcon size={16} /> Image</span>
            </>
          )}
          {MODE_META[mode] && (
            <span style={chip(true)} onClick={() => setMode("auto")}>
              <XIcon size={14} />
              {(() => { const M = MODE_META[mode]!; const I = M.Icon; return <><I size={16} /> {M.label}</>; })()}
            </span>
          )}

          <span style={{ flex: 1 }} />

          {/* model selector — Claude / GPT / Grok / Gemini */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(open === "model" ? null : "model")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", border: "none", borderRadius: 999, background: "var(--mint-pill)", color: "var(--studio-teal-dark)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
            >
              {current?.label ?? "Model"} <ChevronDownIcon size={15} />
            </button>
            {open === "model" && (
              <div style={{ ...menuWrap, top: 42, right: 0, minWidth: 248, maxHeight: 360, overflow: "auto" }}>
                <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Choose a model</div>
                {models.map((m) => {
                  const active = m.id === modelId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setModelId(m.id); setOpen(null); }}
                      title={m.configured ? "" : "Add this provider's API key to enable"}
                      style={{ ...item, justifyContent: "space-between", opacity: m.configured ? 1 : 0.55 }}
                    >
                      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {m.family}{m.fast ? " · fast" : ""}{m.configured ? "" : " · key needed"}
                        </span>
                      </span>
                      {active ? <CheckIcon size={15} color="var(--studio-primary)" />
                        : !m.configured ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#d1d5db" }} />
                        : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--studio-primary)" }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* mic when empty, send-arrow when text */}
          <button
            aria-label={hasText ? "Generate" : listening ? "Stop voice" : "Voice input"}
            onClick={hasText ? generate : toggleMic}
            disabled={busy}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: listening ? "var(--studio-teal-dark)" : "var(--studio-primary)", color: "#fff", display: "grid", placeItems: "center" }}
          >
            {busy ? "…" : hasText ? <ArrowUpIcon size={19} color="#fff" /> : <MicIcon size={19} color="#fff" />}
          </button>
        </div>
      </div>

      {/* quick-action buttons below the chat */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
        {QUICK_ACTIONS.map((a) => {
          const on = mode === a.mode;
          const I = a.Icon;
          return (
            <button
              key={a.key}
              onClick={() => { setMode(a.mode); focusPrompt(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px",
                borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                border: "1px solid transparent",
                background: on ? "var(--studio-primary)" : "var(--mint-pill)",
                color: on ? "#ffffff" : "var(--studio-teal-dark)",
                transition: "background .15s, color .15s",
              }}
            >
              <I size={16} /> {a.label}
            </button>
          );
        })}
      </div>

      {/* type-ahead suggestions */}
      {open === "suggest" && suggestions.length > 0 && !turns.length && (
        <div style={{ marginTop: 10, background: "#fff", border: "1px solid var(--hairline)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13, padding: "4px 8px" }}><SparkIcon size={15} /> Suggestions</div>
          {suggestions.map((s, i) => {
            const m = ["deck", "image", "email"][i] as Mode;
            return (
              <button key={i} onClick={() => { setPrompt(s); setMode(m); setOpen(null); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", border: "none", background: "transparent", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
                <span style={{ color: "var(--studio-primary)", fontWeight: 600 }}>{prompt.trim()}</span> <span style={{ color: "var(--ink)" }}>{["deck", "image", "email"][i]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* conversation thread — Claude-like multi-turn */}
      {(turns.length > 0 || busy) && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: "85%", background: "var(--mint-pill)", color: "var(--studio-teal-dark)", borderRadius: 14, padding: "10px 14px", fontSize: 14.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {t.text}
              </div>
            ) : (
              <AssistantTurn key={i} t={t} />
            ),
          )}
          {busy && turns[turns.length - 1]?.role !== "assistant" && (
            <div style={{ background: "#fff", border: "1px solid var(--hairline)", borderRadius: 18, padding: 18, display: "flex", alignItems: "center", gap: 12, color: "var(--studio-teal-dark)" }}>
              <span className="humain-spin" style={{ width: 18, height: 18, border: "2.5px solid var(--mint-pill)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontWeight: 600 }}>Generating with {current?.label ?? "Claude"}…</span>
              <style>{`@keyframes humain-spin{to{transform:rotate(360deg)}}.humain-spin{animation:humain-spin .7s linear infinite}`}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One assistant message: text, live-HTML iframe, or video concept + render panel.
function AssistantTurn({ t }: { t: Turn }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--hairline)", borderRadius: 18, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          {t.preview && <span style={badge}>CONCEPT PREVIEW</span>}
          {t.html && <span style={badge}>LIVE HTML</span>}
          {t.artifactHtml && <span style={badge}>WEBSITE</span>}
          {t.video && <span style={badge}>VIDEO</span>}
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{t.model ?? "Claude"}</span>
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          {t.html && (
            <button onClick={() => { const w = window.open(); if (w) { w.document.write(t.text); w.document.close(); } }} style={btnSm}>Open</button>
          )}
          <button onClick={() => navigator.clipboard?.writeText(t.text)} style={btnSm}>Copy</button>
        </span>
      </div>
      {t.html ? (
        <iframe title="Website preview" srcDoc={t.text} style={{ width: "100%", height: 520, border: "1px solid var(--hairline)", borderRadius: 12, background: "#fff" }} />
      ) : (
        <div style={{ color: "var(--ink)", lineHeight: 1.6, fontSize: 15 }}>
          {t.streaming && !t.text ? (
            <span style={{ color: "var(--muted)" }}>Thinking…</span>
          ) : (
            <>
              <Markdown text={t.text} />
              {t.streaming && <span className="humain-caret" style={{ color: "var(--studio-primary)", fontWeight: 700 }}>▌</span>}
            </>
          )}
          {t.streaming && <style>{`@keyframes humain-blink{0%,100%{opacity:1}50%{opacity:0}}.humain-caret{animation:humain-blink 1s step-end infinite}`}</style>}
        </div>
      )}
      {t.artifactHtml && <SiteViewer html={t.artifactHtml} />}
      {t.video && <VideoRender prompt={t.videoPrompt || t.text} />}
    </div>
  );
}

const badge: React.CSSProperties = {
  display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em",
  color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "4px 10px", borderRadius: 999,
};
const btnSm: React.CSSProperties = {
  border: "1px solid var(--hairline)", background: "#fff", borderRadius: 8, padding: "5px 10px",
  fontSize: 12.5, color: "var(--ink)", cursor: "pointer",
};

// In-chat viewer for a website/app the Build Agent produced: live iframe preview
// with open-in-new-tab and download. Lets the user actually see and use the build.
function SiteViewer({ html }: { html: string }) {
  function openTab() { const w = window.open(); if (w) { w.document.write(html); w.document.close(); } }
  function download() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "humain-site.html"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div style={{ marginTop: 14, border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--mint-pill)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--studio-teal-dark)", letterSpacing: "0.04em" }}>LIVE PREVIEW</span>
        <span style={{ display: "flex", gap: 8 }}>
          <button onClick={openTab} style={btnSm}>Open</button>
          <button onClick={download} style={btnSm}>Download</button>
        </span>
      </div>
      <iframe title="Built site preview" srcDoc={html} style={{ width: "100%", height: 560, border: "none", background: "#fff", display: "block" }} />
    </div>
  );
}

// Real text-to-video render panel: starts a render job and polls until done.
function VideoRender({ prompt }: { prompt: string }) {
  const [state, setState] = useState<{ status: string; url?: string; message?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<any>(null);

  useEffect(() => () => clearTimeout(pollRef.current), []);

  async function poll(id: string) {
    try {
      const res = await fetch(`/api/video/status/${id}`);
      const d = await res.json();
      setState(d);
      if (d.status === "processing") pollRef.current = setTimeout(() => poll(id), 4000);
      else setBusy(false);
    } catch {
      setState({ status: "failed", message: "Lost connection to the render service." });
      setBusy(false);
    }
  }

  async function render() {
    setBusy(true); setState({ status: "starting" });
    try {
      const res = await fetch("/api/video/render", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const d = await res.json();
      setState(d);
      if (d.status === "processing" && d.id) poll(d.id);
      else setBusy(false);
    } catch {
      setState({ status: "failed", message: "Could not reach the render service." });
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16, borderTop: "1px solid var(--hairline)", paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>🎬 Render this as a real video</span>
        <button onClick={render} disabled={busy}
          style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
          {busy ? "Rendering…" : "Render video"}
        </button>
      </div>
      {state && state.status !== "starting" && (
        <div style={{ marginTop: 12 }}>
          {state.status === "processing" && <div style={{ color: "var(--studio-teal-dark)", fontSize: 13.5 }}>⏳ Rendering on the video model — this can take a minute…</div>}
          {state.status === "succeeded" && state.url && (
            <video src={state.url} controls style={{ width: "100%", borderRadius: 12, background: "#000" }} />
          )}
          {(state.status === "unconfigured" || state.status === "failed") && (
            <div style={{ fontSize: 13, color: "var(--muted)", background: "#f8f9fa", border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px" }}>
              {state.message || "Render unavailable."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
