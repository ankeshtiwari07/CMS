"use client";
import { useEffect, useRef, useState } from "react";
import {
  PlusIcon, ImageIcon, LayoutAutoIcon, PaletteIcon, MicIcon, ChevronDownIcon, ArrowUpIcon,
  PaperclipIcon, ClockIcon, MonitorIcon, GlobeIcon, MailIcon, TranslateIcon, GridIcon,
  CodeIcon, CheckIcon, XIcon, FileIcon, SquareIcon, SparkIcon, CalendarIcon, MegaphoneIcon,
  BookmarkIcon, VideoIcon, BuildingIcon,
} from "@/components/icons";
import Markdown from "@/components/studio/markdown";
import { useT } from "@/lib/i18n-client";

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
  doc?: DocArt; // a structured content piece, rendered as an editable/publishable card
  videoScript?: string; // a video package (script/storyboard) + render control
  imagePrompt?: string; // an image to generate inline
  ratio?: string;
  brandArt?: any; // a brand guideline card (publish/download)
  themeArt?: any; // a design theme (swatches + apply)
};

type DocArt = {
  type: string;
  title: string;
  summary?: string;
  bodyMarkdown: string;
  seo?: { title?: string; description?: string; keywords?: string[] };
  tags?: string[];
  category?: string;
  language?: string;
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

// Topic name for a thread: first non-empty line of the first user message.
function deriveChatTitle(turns: Turn[]): string {
  const firstUser = turns.find((t) => t.role === "user");
  const line = (firstUser?.text || "").split("\n").map((s) => s.trim()).find(Boolean);
  return (line || "New chat").slice(0, 80);
}

// Trim turns before persisting so a saved thread stays bounded (built sites and
// long replies are capped; the transient `streaming` flag is dropped).
function trimTurns(turns: Turn[]): Turn[] {
  return turns.map(({ streaming, ...t }) => ({
    ...t,
    text: (t.text || "").slice(0, 20000),
    ...(t.artifactHtml ? { artifactHtml: t.artifactHtml.slice(0, 200000) } : {}),
  }));
}

export default function PromptBox({ onActive }: { onActive?: (active: boolean) => void } = {}) {
  const t = useT();
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
  // A conversation is active once there are turns — the page switches to a focused
  // chat view and the composer drops below the thread (Claude-style).
  const active = turns.length > 0;
  useEffect(() => { onActive?.(active); }, [active, onActive]);

  const recRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Per-user chat history: the id of the conversation this thread is saved under
  // (null until the first message is persisted), plus a re-entrancy guard.
  const convIdRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  // Streaming controls: abort the in-flight generation, and auto-follow tokens.
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true); // keep pinned to the latest tokens unless the user scrolls up
  const taRef = useRef<HTMLTextAreaElement>(null); // composer textarea (auto-grow)
  const listeningRef = useRef(false); // intended dictation state (survives onend restarts)
  const projectIdRef = useRef<string | null>(null); // one Project per conversation (reused across turns)

  // Auto-grow the composer textarea with content, capped so it can't overrun the UI.
  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }
  useEffect(() => { autoGrow(); }, [prompt]);

  // Open a dedicated Studio (Deck / Website) carrying whatever is typed so it
  // pre-fills and runs there — the rich builders live in their own workspaces.
  function openStudio(path: string) {
    const p = prompt.trim();
    window.location.href = path + (p ? `?prompt=${encodeURIComponent(p)}` : "");
  }

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
      convIdRef.current = null;
      projectIdRef.current = null;
      setTurns([]);
      focusPrompt();
    };
    // "Create new" in the sidebar resets to a blank conversation.
    const newChat = () => {
      convIdRef.current = null;
      projectIdRef.current = null;
      setPrompt("");
      setTurns([]);
      setFiles([]);
      setMode("auto");
      focusPrompt();
    };
    // "Add photos & files" from the Create-new menu opens the file picker.
    const addFiles = () => { focusPrompt(); setTimeout(() => fileRef.current?.click(), 200); };
    // Open a saved conversation (topic) from the sidebar history.
    const loadChat = async (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (!id) return;
      try {
        const res = await fetch(`/api/conversations/${id}`);
        if (!res.ok) return;
        const d = await res.json();
        convIdRef.current = String(d.id);
        projectIdRef.current = d.projectId ? String(d.projectId) : null;
        setTurns(Array.isArray(d.messages) ? (d.messages as Turn[]) : []);
        if (d.mode) setMode(d.mode);
        setPrompt("");
        setFiles([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch { /* ignore */ }
    };
    globalThis.addEventListener("humain:prefill", prefill);
    globalThis.addEventListener("humain:newchat", newChat);
    globalThis.addEventListener("humain:addfiles", addFiles);
    globalThis.addEventListener("humain:loadchat", loadChat);

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
      globalThis.removeEventListener("humain:loadchat", loadChat);
    };
  }, []);

  // Persist the thread after each completed exchange (per-user chat history).
  // Fires when the busy flag drops to false and the last turn is a finished
  // assistant reply — creates the conversation on first save, then PATCHes it.
  useEffect(() => {
    if (busy) return;
    const last = turns[turns.length - 1];
    if (!last || last.role !== "assistant" || last.streaming) return;
    let cancelled = false;
    (async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        const title = deriveChatTitle(turns);
        const messages = trimTurns(turns);
        const modelLabel = current?.label;
        if (convIdRef.current) {
          await fetch(`/api/conversations/${convIdRef.current}`, {
            method: "PATCH", headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, messages, model: modelLabel }),
          });
        } else {
          const res = await fetch("/api/conversations", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, messages, mode, model: modelLabel }),
          });
          const d = await res.json().catch(() => ({}));
          if (!cancelled && d.id) convIdRef.current = String(d.id);
        }
        globalThis.dispatchEvent(new CustomEvent("humain:chatsaved", { detail: { id: convIdRef.current } }));
      } catch { /* non-fatal */ }
      finally { savingRef.current = false; }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  // Actionable "do this with what you typed" suggestions — distinct from the
  // prompt text itself. Deck/Website open their builders; the rest set the mode.
  const suggestions: { label: string; kind: string }[] =
    prompt.trim().length >= 3 && open !== null
      ? [
          { label: "Turn this into a presentation deck", kind: "deck" },
          { label: "Build this as a website", kind: "website" },
          { label: "Write a long-form article about this", kind: "writing" },
          { label: "Draft a marketing email about this", kind: "email" },
          { label: "Generate an image from this", kind: "image" },
        ]
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

  // Track whether the user is pinned near the bottom; only auto-follow then, so
  // scrolling up to read earlier replies isn't yanked back down mid-stream.
  useEffect(() => {
    const onScroll = () => {
      stickRef.current = window.innerHeight + window.scrollY >= document.body.scrollHeight - 140;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Follow the stream: scroll the latest tokens into view as the reply grows.
  useEffect(() => {
    if (active && stickRef.current) endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, busy]);

  // Stop the in-flight generation — aborts the fetch; the stream's reader unwinds
  // and the partial reply is kept (and persisted) as a finished turn.
  function stop() {
    abortRef.current?.abort();
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

  async function send(userText: string, addUserTurn = true) {
    if (!userText.trim() || busy) return;
    setBusy(true);
    setOpen(null);
    const aiMode = mode === "auto" ? "writing" : mode;
    const attachments = files.filter((f) => f.text).map((f) => ({ name: f.name, text: f.text }));
    // Build conversation context from the last few turns (text only, truncated).
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: (t.text || "").slice(0, 6000) }));
    const options = { ratio, style, deckFormat, modelLabel: current?.label, files: files.map((f) => f.name), attachments };
    if (addUserTurn) setTurns((p) => [...p, { role: "user", text: userText, mode }]);
    stickRef.current = true; // a fresh send re-pins to the bottom
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // ---- Conversational, streaming, agentic path (text modes) ----
    if (STREAM_MODES.includes(mode)) {
      setTurns((p) => [...p, { role: "assistant", text: "", mode, model: current?.label, streaming: true }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: aiMode, prompt: userText, model: modelId, history, options, projectId: projectIdRef.current }),
          signal: ctrl.signal,
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
            else if (ev.type === "artifact" && ev.kind === "doc") patchLastAssistant((t) => ({ ...t, doc: ev.doc }));
            else if (ev.type === "artifact" && ev.kind === "video") patchLastAssistant((t) => ({ ...t, video: true, videoPrompt: ev.videoPrompt, videoScript: ev.script }));
            else if (ev.type === "artifact" && ev.kind === "image") patchLastAssistant((t) => ({ ...t, imagePrompt: ev.imagePrompt, ratio: ev.ratio }));
            else if (ev.type === "artifact" && ev.kind === "brand") patchLastAssistant((t) => ({ ...t, brandArt: ev.brand }));
            else if (ev.type === "artifact" && ev.kind === "theme") patchLastAssistant((t) => ({ ...t, themeArt: ev.theme }));
            else if (ev.type === "error") patchLastAssistant((t) => ({ ...t, text: `${t.text ? t.text + "\n\n" : ""}⚠️ ${ev.message}`, streaming: false }));
            else if (ev.type === "project") { projectIdRef.current = String(ev.id); }
            else if (ev.type === "done") patchLastAssistant((t) => ({ ...t, model: ev.modelLabel || t.model, streaming: false }));
            // "status" / "agents" events carry agent activity — no visual change.
          }
        }
        patchLastAssistant((t) => ({ ...t, streaming: false }));
      } catch (e: any) {
        // A user-initiated Stop aborts the fetch — keep the partial reply, no error.
        if (e?.name === "AbortError" || ctrl.signal.aborted) {
          patchLastAssistant((t) => ({ ...t, streaming: false }));
        } else {
          patchLastAssistant((t) => ({ ...t, text: t.text || "Could not reach the generation service.", streaming: false }));
        }
      }
      abortRef.current = null;
      setBusy(false);
      return;
    }

    // ---- Image mode: render a REAL image via the Replicate pipeline ----
    // (ImageRender does the /api/image/render + poll + <img> display). The old
    // path returned a text "concept preview" and never produced a picture.
    if (mode === "image") {
      setTurns((p) => [...p, { role: "assistant", text: "", mode, imagePrompt: userText, ratio }]);
      abortRef.current = null;
      setBusy(false);
      return;
    }

    // ---- Rich artifact modes (websiteBuild / video / deck) ----
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: aiMode, prompt: userText, model: modelId, history, options }),
        signal: ctrl.signal,
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
    } catch (e: any) {
      if (!(e?.name === "AbortError" || ctrl.signal.aborted)) {
        setTurns((p) => [...p, { role: "assistant", text: "Could not reach the generation service." }]);
      }
    }
    abortRef.current = null;
    setBusy(false);
  }

  function generate() {
    const t = prompt.trim();
    if (!t || busy) return;
    // Decks: route into the real Deck Studio (which plans + renders + saves
    // slides) instead of the /api/generate text path that only returns a brief.
    if (mode === "deck") { openStudio("/cms/deck"); return; }
    setPrompt(""); // clear the composer after sending, like Claude
    send(t, true);
  }
  // Re-answer the last question (the ↻ action under a reply).
  function regenerate() {
    if (busy) return;
    const lastUser = [...turns].reverse().find((x) => x.role === "user");
    if (lastUser) send(lastUser.text, false);
  }
  // Edit a previous prompt: load it back into the composer and truncate the
  // conversation to before it, so sending regenerates from that point.
  function editTurn(i: number) {
    if (busy) return;
    const turn = turns[i];
    if (!turn || turn.role !== "user") return;
    setPrompt(turn.text);
    setTurns((p) => p.slice(0, i));
    focusPrompt();
  }

  function toggleMic() {
    const SR = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (!SR) { setTurns((p) => [...p, { role: "assistant", text: "Voice input needs Chrome or Edge." }]); return; }
    if (listening) { listeningRef.current = false; recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;      // keep listening across natural pauses
    rec.interimResults = true;
    // Accumulate finalized speech onto whatever is already in the box; only the
    // trailing interim chunk changes as the user speaks.
    let base = prompt ? prompt.replace(/\s+$/, "") + " " : "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) base += r[0].transcript.trim() + " ";
        else interim += r[0].transcript;
      }
      setPrompt((base + interim).replace(/\s+/g, " ").trimStart());
    };
    // Chrome ends recognition on a longer pause — if the user hasn't stopped,
    // restart so they can keep dictating the next sentence/paragraph.
    rec.onend = () => {
      if (listeningRef.current) { try { rec.start(); } catch { /* already starting */ } }
      else setListening(false);
    };
    rec.onerror = (ev: any) => { if (ev?.error === "not-allowed" || ev?.error === "service-not-allowed") { listeningRef.current = false; setListening(false); } };
    listeningRef.current = true;
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
    <div ref={rootRef} style={{ width: "100%", maxWidth: 840, margin: "0 auto", position: "relative", display: "flex", flexDirection: "column" }}>
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
          ref={taRef}
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); autoGrow(); setOpen(e.target.value.trim().length >= 3 ? "suggest" : null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
          placeholder={turns.length ? t("prompt.followup") : t("prompt.placeholder")}
          rows={1}
          style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 16, color: "var(--ink)", minHeight: 26, maxHeight: 220, overflowY: "auto", lineHeight: 1.5 }}
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
                <button style={item} onClick={() => openStudio("/cms/deck")}><MonitorIcon size={17} color="var(--muted)" /> Create Deck</button>
                <button style={item} onClick={() => { setMode("image"); setOpen(null); }}><ImageIcon size={17} color="var(--muted)" /> Create Image</button>
                <button style={item} onClick={() => { setMode("video"); setOpen(null); }}><VideoIcon size={17} color="var(--muted)" /> Create Video</button>
                <button style={item} onClick={() => openStudio("/cms/website")}><CodeIcon size={17} color="var(--muted)" /> Build Website</button>
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

          {/* busy → Stop, text → send-arrow, empty → mic */}
          <button
            aria-label={busy ? t("prompt.stop") : hasText ? "Generate" : listening ? "Stop voice" : "Voice input"}
            title={busy ? t("prompt.stop") : undefined}
            onClick={busy ? stop : hasText ? generate : toggleMic}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: busy ? "var(--studio-teal-dark)" : listening ? "var(--studio-teal-dark)" : "var(--studio-primary)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            {busy ? <SquareIcon size={15} color="#fff" /> : hasText ? <ArrowUpIcon size={19} color="#fff" /> : <MicIcon size={19} color="#fff" />}
          </button>
        </div>
      </div>

      {/* quick-action buttons below the chat (landing only) */}
      {!active && (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
        {/* Deck / Website open their dedicated builders (carry the typed prompt). */}
        <button onClick={() => openStudio("/cms/deck")}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "none", background: "var(--studio-primary)", color: "#fff" }}>
          <MonitorIcon size={16} /> Deck
        </button>
        <button onClick={() => openStudio("/cms/website")}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "none", background: "var(--studio-primary)", color: "#fff" }}>
          <CodeIcon size={16} /> Website
        </button>
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
              <I size={16} /> {t(`qa.${a.key}`)}
            </button>
          );
        })}
      </div>
      )}

      {/* type-ahead suggestions */}
      {open === "suggest" && suggestions.length > 0 && !turns.length && (
        <div style={{ marginTop: 10, background: "#fff", border: "1px solid var(--hairline)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13, padding: "4px 8px" }}><SparkIcon size={15} /> Suggestions</div>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => {
              setOpen(null);
              if (s.kind === "deck") return openStudio("/cms/deck");
              if (s.kind === "website") return openStudio("/cms/website");
              setMode(s.kind as Mode); focusPrompt();
            }}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "9px 10px", border: "none", background: "transparent", borderRadius: 8, fontSize: 14.5, cursor: "pointer", color: "var(--ink)" }}>
              <SparkIcon size={14} color="var(--studio-primary)" /> {s.label}
            </button>
          ))}
        </div>
      )}

      {/* conversation thread — Claude-like multi-turn (sits ABOVE the composer when active) */}
      {(turns.length > 0 || busy) && (
        <div style={{ marginTop: active ? 0 : 18, marginBottom: active ? 18 : 0, order: active ? -1 : 0, display: "flex", flexDirection: "column", gap: 18 }}>
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: "85%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <div style={{ background: "var(--mint-pill)", color: "var(--studio-teal-dark)", borderRadius: 14, padding: "10px 14px", fontSize: 14.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{t.text}</div>
                <button onClick={() => editTurn(i)} disabled={busy} title="Edit this prompt" style={{ border: "none", background: "transparent", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: "0 4px" }}>✎ Edit</button>
              </div>
            ) : (
              <AssistantTurn key={i} t={t} onRegen={i === turns.length - 1 ? regenerate : undefined} />
            ),
          )}
          {busy && turns[turns.length - 1]?.role !== "assistant" && (
            <div style={{ background: "#fff", border: "1px solid var(--hairline)", borderRadius: 18, padding: 18, display: "flex", alignItems: "center", gap: 12, color: "var(--studio-teal-dark)" }}>
              <span className="humain-spin" style={{ width: 18, height: 18, border: "2.5px solid var(--mint-pill)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontWeight: 600 }}>{t("prompt.generating")} {current?.label ?? "Claude"}…</span>
              <style>{`@keyframes humain-spin{to{transform:rotate(360deg)}}.humain-spin{animation:humain-spin .7s linear infinite}`}</style>
            </div>
          )}
          <div ref={endRef} aria-hidden style={{ height: 1 }} />
        </div>
      )}
    </div>
  );
}

// One assistant message: text, live-HTML iframe, or video concept + render panel.
// One assistant message — rendered as a natural, flowing chat reply (no framed
// card), Claude-style. Only true artifacts (website/image/video/brand/theme) get
// their own inline frame; a subtle action row sits underneath.
function AssistantTurn({ t, onRegen }: { t: Turn; onRegen?: () => void }) {
  const tr = useT();
  const hasArtifact = t.preview || t.html || t.artifactHtml || t.doc || t.video || t.imagePrompt || t.brandArt || t.themeArt;
  return (
    <div style={{ padding: "0 2px 2px" }}>
      {hasArtifact && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {t.preview && <span style={badge}>CONCEPT</span>}
          {t.html && <span style={badge}>LIVE HTML</span>}
          {t.artifactHtml && <span style={badge}>WEBSITE</span>}
          {t.doc && <span style={badge}>{(t.doc.type || "CONTENT").toUpperCase()}</span>}
          {t.video && <span style={badge}>VIDEO</span>}
          {t.imagePrompt && <span style={badge}>IMAGE</span>}
          {t.brandArt && <span style={badge}>BRAND</span>}
          {t.themeArt && <span style={badge}>THEME</span>}
        </div>
      )}

      {t.html ? (
        <iframe title="Website preview" srcDoc={t.text} style={{ width: "100%", height: 520, border: "1px solid var(--hairline)", borderRadius: 12, background: "#fff" }} />
      ) : (
        <div style={{ color: "var(--ink)", lineHeight: 1.65, fontSize: 15 }}>
          {t.streaming && !t.text ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
              <span style={{ width: 15, height: 15, border: "2.5px solid var(--hairline)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block", animation: "humainspin .7s linear infinite" }} />
              {tr("prompt.thinking")}
              <style>{`@keyframes humainspin{to{transform:rotate(360deg)}}`}</style>
            </span>
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
      {t.doc && <DocCard doc={t.doc} />}
      {t.videoScript && <VideoCard script={t.videoScript} prompt={t.videoPrompt || ""} />}
      {t.video && !t.videoScript && <VideoRender prompt={t.videoPrompt || t.text} />}
      {t.imagePrompt && <ImageRender prompt={t.imagePrompt} ratio={t.ratio} />}
      {t.brandArt && <BrandArtifactCard brand={t.brandArt} />}
      {t.themeArt && <ThemeArtifactCard theme={t.themeArt} />}

      {!t.streaming && (t.text || hasArtifact) && (
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8 }}>
          <button onClick={() => navigator.clipboard?.writeText(t.text || "")} title="Copy" style={actionBtn}>Copy</button>
          {onRegen && <button onClick={onRegen} title="Regenerate" style={actionBtn}>↻ Retry</button>}
          <span style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 6 }}>{t.model ?? "Claude"}</span>
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer",
  fontSize: 12.5, fontWeight: 600, padding: "4px 8px", borderRadius: 7,
};

const badge: React.CSSProperties = {
  display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em",
  color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "4px 10px", borderRadius: 999,
};
const btnSm: React.CSSProperties = {
  border: "1px solid var(--hairline)", background: "#fff", borderRadius: 8, padding: "5px 10px",
  fontSize: 12.5, color: "var(--ink)", cursor: "pointer",
};

// Interactive card for a structured content piece the Content Agent produced.
// View as rich text, take over manually (Edit), copy, download, or publish to a
// CMS module of the user's choice.
const PUBLISH_TARGETS: { slug: string; label: string }[] = [
  { slug: "blogPosts", label: "Blog Post" }, { slug: "articles", label: "Article" },
  { slug: "pressReleases", label: "Press Release" }, { slug: "events", label: "Event" },
  { slug: "caseStudies", label: "Case Study" }, { slug: "products", label: "Product" },
  { slug: "faqs", label: "FAQ" },
];

function DocCard({ doc }: { doc: DocArt }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title || "Untitled");
  const [body, setBody] = useState(doc.bodyMarkdown || "");
  const [dest, setDest] = useState(PUBLISH_TARGETS.find((t) => t.slug === doc.type)?.slug || "blogPosts");
  const [pub, setPub] = useState<{ state: "idle" | "busy" | "ok" | "err"; msg?: string }>({ state: "idle" });

  function downloadMd() {
    const md = `# ${title}\n\n${body}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/[^\w]+/g, "-").slice(0, 60) || "content"}.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function publish() {
    setPub({ state: "busy" });
    try {
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection: dest, title, bodyMarkdown: body, seo: doc.seo, tags: doc.tags, category: doc.category }),
      });
      const d = await res.json();
      if (res.ok && d.ok) setPub({ state: "ok", msg: d.draft ? "Saved as draft for review" : "Published" });
      else setPub({ state: "err", msg: d.error || "Publish failed" });
    } catch { setPub({ state: "err", msg: "Could not reach publish service" }); }
  }

  return (
    <div style={{ marginTop: 14, border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--mint-pill)", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--studio-teal-dark)", letterSpacing: "0.04em" }}>
          {editing ? "EDITING" : "CONTENT"}{doc.language === "ar" ? " · AR" : doc.language === "both" ? " · EN/AR" : ""}
        </span>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setEditing((e) => !e)} style={btnSm}>{editing ? "Done" : "Edit"}</button>
          <button onClick={() => navigator.clipboard?.writeText(`# ${title}\n\n${body}`)} style={btnSm}>Copy</button>
          <button onClick={downloadMd} style={btnSm}>Download</button>
        </span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {editing ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", fontSize: 18, fontWeight: 700, border: "1px solid var(--hairline)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }} />
        ) : (
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
        )}
        {doc.summary && !editing && <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 10px" }}>{doc.summary}</p>}
        {editing ? (
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
            style={{ width: "100%", fontFamily: "var(--font-mono, monospace)", fontSize: 13.5, lineHeight: 1.6, border: "1px solid var(--hairline)", borderRadius: 8, padding: "10px 12px", resize: "vertical" }} />
        ) : (
          <Markdown text={body} />
        )}
        {(doc.tags?.length || doc.seo?.keywords?.length) && !editing && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {(doc.tags || []).map((t, i) => (
              <span key={i} style={{ fontSize: 12, background: "var(--mint-pill)", color: "var(--studio-teal-dark)", padding: "3px 9px", borderRadius: 999, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      {/* publish to a CMS module of the user's choice (lands as a draft for review) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: "1px solid var(--hairline)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>Publish to</span>
        <select value={dest} onChange={(e) => setDest(e.target.value)}
          style={{ height: 34, borderRadius: 8, border: "1px solid var(--hairline)", padding: "0 10px", fontSize: 13.5, background: "#fff", color: "var(--ink)" }}>
          {PUBLISH_TARGETS.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
        </select>
        <button onClick={publish} disabled={pub.state === "busy"}
          style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: pub.state === "busy" ? "default" : "pointer" }}>
          {pub.state === "busy" ? "Publishing…" : "Publish"}
        </button>
        {pub.state === "ok" && <span style={{ fontSize: 13, color: "var(--studio-teal-dark)", fontWeight: 600 }}>✓ {pub.msg}</span>}
        {pub.state === "err" && <span style={{ fontSize: 13, color: "#c0392b" }}>⚠ {pub.msg}</span>}
      </div>
    </div>
  );
}

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

const pubBtn: React.CSSProperties = {
  height: 34, padding: "0 16px", borderRadius: 8, border: "none",
  background: "var(--studio-primary)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
};

// Video package: the script/storyboard (rich) + a one-click real render.
function VideoCard({ script, prompt }: { script: string; prompt: string }) {
  return (
    <div style={{ marginTop: 14, border: "1px solid var(--hairline)", borderRadius: 12, padding: 16 }}>
      <Markdown text={script} />
      <VideoRender prompt={prompt} />
    </div>
  );
}

// Inline image generation: auto-starts a render and polls until the image is ready.
function ImageRender({ prompt, ratio }: { prompt: string; ratio?: string }) {
  const [state, setState] = useState<{ status: string; id?: string; url?: string; message?: string }>({ status: "starting" });
  const pollRef = useRef<any>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/image/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, ratio }) });
        const d = await res.json(); setState(d);
        if (d.status === "processing" && d.id) poll(d.id);
      } catch { setState({ status: "failed", message: "Could not reach the image service." }); }
    })();
    return () => clearTimeout(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function poll(id: string) {
    try {
      const res = await fetch(`/api/image/status/${id}`); const d = await res.json(); setState(d);
      if (d.status === "processing") pollRef.current = setTimeout(() => poll(id), 3000);
    } catch { setState({ status: "failed", message: "Lost connection to the image service." }); }
  }
  return (
    <div style={{ marginTop: 14 }}>
      {state.status === "succeeded" && state.url ? (
        <>
          <img src={state.url} alt={prompt} style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid var(--hairline)", display: "block" }} />
          <a href={state.url} target="_blank" rel="noreferrer" style={{ ...btnSm, textDecoration: "none", display: "inline-block", marginTop: 8 }}>Open full size</a>
        </>
      ) : state.status === "failed" || state.status === "unconfigured" ? (
        <div style={{ fontSize: 13, color: "var(--muted)", background: "#f8f9fa", border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px" }}>{state.message || "Image unavailable."}</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--studio-teal-dark)", fontSize: 13.5 }}>
          <span className="humain-spin" style={{ width: 16, height: 16, border: "2.5px solid var(--mint-pill)", borderTopColor: "var(--studio-primary)", borderRadius: "50%", display: "inline-block" }} />
          Generating image…
          <style>{`@keyframes humain-spin{to{transform:rotate(360deg)}}.humain-spin{animation:humain-spin .7s linear infinite}`}</style>
        </div>
      )}
    </div>
  );
}

// Brand guideline card: palette + sections, publish (Active/Library) or download.
function BrandArtifactCard({ brand }: { brand: any }) {
  const [dest, setDest] = useState<"active" | "library">("active");
  const [pub, setPub] = useState<{ s: string; m?: string }>({ s: "idle" });
  const palette = brand.palette || [];
  const sections = brand.sections || [];
  function downloadMd() {
    let md = `# ${brand.name}\n\n${brand.summary || ""}\n\n`;
    if (palette.length) md += `## Palette\n\n${palette.map((c: any) => `- ${c.name} ${c.hex}${c.usage ? ` — ${c.usage}` : ""}`).join("\n")}\n\n`;
    for (const s of sections) md += `## ${s.title}\n\n${s.content}\n\n`;
    const blob = new Blob([md], { type: "text/markdown" }); const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = `${(brand.name || "brand").replace(/[^\w]+/g, "-")}.md`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  async function publish() {
    setPub({ s: "busy" });
    try {
      const res = await fetch("/api/brand-guidelines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: brand.name, summary: brand.summary, source: "ai", data: { sections, palette }, active: dest === "active" }) });
      const d = await res.json();
      if (res.ok && d.ok) setPub({ s: "ok", m: dest === "active" ? "Set as the active brand the AI follows" : "Saved to Brand Library" });
      else setPub({ s: "err", m: d.error || "Publish failed" });
    } catch { setPub({ s: "err", m: "Could not reach publish service" }); }
  }
  return (
    <div style={{ marginTop: 14, border: "1px solid var(--hairline)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: brand.summary ? 4 : 10 }}>{brand.name}</div>
      {brand.summary && <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 12px" }}>{brand.summary}</p>}
      {palette.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          {palette.map((c: any, i: number) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: c.hex, border: "1px solid rgba(0,0,0,0.08)" }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.hex}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        {sections.map((s: any, i: number) => (
          <div key={i}><div style={{ fontSize: 15, fontWeight: 700, color: "var(--studio-teal-dark)", marginBottom: 4 }}>{s.title}</div><Markdown text={s.content} /></div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <select value={dest} onChange={(e) => setDest(e.target.value as any)} style={{ height: 34, borderRadius: 8, border: "1px solid var(--hairline)", padding: "0 8px", fontSize: 13, background: "#fff" }}>
          <option value="active">Active Brand (AI follows)</option>
          <option value="library">Brand Library</option>
        </select>
        <button onClick={publish} disabled={pub.s === "busy"} style={pubBtn}>{pub.s === "busy" ? "Publishing…" : "Publish"}</button>
        <button onClick={downloadMd} style={btnSm}>Download</button>
        {pub.s === "ok" && <span style={{ fontSize: 13, color: "var(--studio-teal-dark)", fontWeight: 600 }}>✓ {pub.m}</span>}
        {pub.s === "err" && <span style={{ fontSize: 13, color: "#c0392b" }}>⚠ {pub.m}</span>}
      </div>
    </div>
  );
}

// Design theme card: live swatches + mini preview + apply to site settings.
function ThemeArtifactCard({ theme }: { theme: any }) {
  const [s, setS] = useState<{ st: string; m?: string }>({ st: "idle" });
  const swatches = ([["Primary", theme.primary], ["Primary Dark", theme.primaryDark], ["Accent", theme.accent], ["Ink", theme.ink], ["Canvas", theme.canvas], ["Muted", theme.muted]] as [string, string][]).filter((x) => x[1]);
  async function apply() {
    setS({ st: "busy" });
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme }) });
      if (res.ok) setS({ st: "ok", m: "Applied to site settings" });
      else { const d = await res.json().catch(() => ({})); setS({ st: "err", m: d.error || "Needs publisher/admin" }); }
    } catch { setS({ st: "err", m: "Could not reach server" }); }
  }
  return (
    <div style={{ marginTop: 14, border: "1px solid var(--hairline)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        {swatches.map(([n, c]) => (
          <div key={n} style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: c, border: "1px solid rgba(0,0,0,0.08)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{n}</div>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{c}</div>
          </div>
        ))}
      </div>
      <div style={{ background: theme.canvas, color: theme.ink, border: "1px solid var(--hairline)", borderRadius: Math.max(10, theme.radius || 12), padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Preview</div>
        <button style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "none", background: theme.primary, color: "#fff", fontWeight: 700, marginRight: 8 }}>Primary</button>
        <button style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "none", background: theme.accent, color: theme.ink, fontWeight: 700 }}>Accent</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={apply} disabled={s.st === "busy"} style={pubBtn}>{s.st === "busy" ? "Applying…" : "Apply theme"}</button>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Font: {theme.font} · Radius {theme.radius}px · {theme.mode}</span>
        {s.st === "ok" && <span style={{ fontSize: 13, color: "var(--studio-teal-dark)", fontWeight: 600 }}>✓ {s.m}</span>}
        {s.st === "err" && <span style={{ fontSize: 13, color: "#c0392b" }}>⚠ {s.m}</span>}
      </div>
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
