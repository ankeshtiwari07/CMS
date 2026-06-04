"use client";
import { useEffect, useRef, useState } from "react";
import {
  PlusIcon, ImageIcon, LayoutAutoIcon, PaletteIcon, MicIcon, ChevronDownIcon, ArrowUpIcon,
  PaperclipIcon, ClockIcon, MonitorIcon, GlobeIcon, MailIcon, TranslateIcon, GridIcon,
  CodeIcon, CheckIcon, XIcon, FileIcon, SquareIcon, SparkIcon,
} from "@/components/icons";

type Mode = "auto" | "image" | "deck" | "website" | "email" | "writing" | "translation" | "designSystem";
type Att = { name: string; size: number; text?: string };

const RATIOS = [
  { key: "auto", label: "Auto", hint: "" },
  { key: "square", label: "Square", hint: "1:1" },
  { key: "portrait", label: "Portrait", hint: "3:4" },
  { key: "story", label: "Story", hint: "9:16" },
  { key: "landscape", label: "Landscape", hint: "4:3" },
  { key: "widescreen", label: "Widescreen", hint: "16:9" },
];
const STYLES = ["No style", "Abstract", "Risograph", "Vector Art", "Photorealistic"];

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
  const [out, setOut] = useState<{ text: string; preview?: boolean } | null>(null);
  const [listening, setListening] = useState(false);
  const [open, setOpen] = useState<null | "plus" | "ratio" | "style" | "model" | "suggest">(null);

  const recRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { prompt?: string; mode?: Mode };
      if (d.prompt) setPrompt(d.prompt);
      if (d.mode) setMode(d.mode);
      document.querySelector<HTMLTextAreaElement>("#studio-prompt")?.focus();
    };
    globalThis.addEventListener("humain:prefill", handler);
    return () => globalThis.removeEventListener("humain:prefill", handler);
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

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setOut(null);
    setOpen(null);
    const aiMode = mode === "auto" ? "writing" : mode;
    const attachments = files.filter((f) => f.text).map((f) => ({ name: f.name, text: f.text }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: aiMode,
          prompt,
          options: { ratio, style, deckFormat, files: files.map((f) => f.name), attachments },
        }),
      });
      const data = await res.json();
      if (!res.ok) setOut({ text: data.error || "Generation failed." });
      else setOut({ text: data.artifact ?? "No output.", preview: data.preview });
    } catch {
      setOut({ text: "Could not reach the generation service." });
    }
    setBusy(false);
  }

  function toggleMic() {
    const SR = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (!SR) return setOut({ text: "Voice input needs Chrome or Edge." });
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
    <div style={{ width: "100%", maxWidth: 840, margin: "0 auto", position: "relative" }}>
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
          placeholder="Describe what you want to create"
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
              <div style={{ ...menuWrap, bottom: 40, left: 0 }}>
                <button style={item} onClick={() => { fileRef.current?.click(); setOpen(null); }}><PaperclipIcon size={17} color="var(--muted)" /> Add photos &amp; files</button>
                <button style={item} onClick={() => globalThis.dispatchEvent(new CustomEvent("humain:recent"))}><ClockIcon size={17} color="var(--muted)" /> Recent projects</button>
                <div style={{ height: 1, background: "var(--hairline)", margin: "4px 0" }} />
                <button style={item} onClick={() => { setMode("deck"); setOpen(null); }}><MonitorIcon size={17} color="var(--muted)" /> Create Deck</button>
                <button style={item} onClick={() => { setMode("image"); setOpen(null); }}><ImageIcon size={17} color="var(--muted)" /> Create Image</button>
                <button style={item} onClick={() => { setMode("website"); setOpen(null); }}><GlobeIcon size={17} color="var(--muted)" /> Create Website</button>
                <button style={item} onClick={() => { setMode("email"); setOpen(null); }}><MailIcon size={17} color="var(--muted)" /> Create Email</button>
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
                  <div style={{ ...menuWrap, bottom: 40, left: 0, minWidth: 200 }}>
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
                  <div style={{ ...menuWrap, bottom: 40, left: 0 }}>
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
          {(mode === "website" || mode === "email" || mode === "translation" || mode === "designSystem") && (
            <span style={chip(true)} onClick={() => setMode("auto")}>
              <XIcon size={14} />
              {mode === "website" && <><GlobeIcon size={16} /> Create Website</>}
              {mode === "email" && <><MailIcon size={16} /> Create Email</>}
              {mode === "translation" && <><TranslateIcon size={16} /> Translate</>}
              {mode === "designSystem" && <><PaletteIcon size={16} /> Design System</>}
            </span>
          )}

          <span style={{ flex: 1 }} />

          {/* model pill */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 999, background: "var(--mint-pill)", color: "var(--studio-teal-dark)", fontSize: 13.5, fontWeight: 700 }}>
            GPT-5.5 Instant <ChevronDownIcon size={15} />
          </span>

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

      {/* type-ahead suggestions */}
      {open === "suggest" && suggestions.length > 0 && !out && (
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

      {out && (
        <div style={{ marginTop: 18, background: "#fff", border: "1px solid var(--hairline)", borderRadius: 18, padding: 18 }}>
          {out.preview && <div style={{ display: "inline-block", marginBottom: 10, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "4px 10px", borderRadius: 999 }}>CONCEPT PREVIEW</div>}
          <div style={{ whiteSpace: "pre-wrap", color: "var(--ink)", lineHeight: 1.6, fontSize: 15 }}>{out.text}</div>
        </div>
      )}
    </div>
  );
}
