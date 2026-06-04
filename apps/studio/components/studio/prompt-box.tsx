"use client";
import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  ImageIcon,
  LayoutAutoIcon,
  PaletteIcon,
  MicIcon,
  ChevronDownIcon,
} from "@/components/icons";

type Mode = "auto" | "image" | "style";

export default function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { prompt: string; mode?: Mode };
      setPrompt(detail.prompt);
      if (detail.mode) setMode(detail.mode);
      document.querySelector<HTMLTextAreaElement>("#studio-prompt")?.focus();
    };
    globalThis.addEventListener("humain:prefill", handler);
    return () => globalThis.removeEventListener("humain:prefill", handler);
  }, []);

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setOut(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: mode === "image" ? "image" : "writing", prompt }),
      });
      if (!res.ok) {
        setOut("The generation service is warming up. Please try again in a moment.");
      } else {
        const data = await res.json();
        setOut(data.artifact ?? "No output produced.");
      }
    } catch {
      setOut("Could not reach the generation service.");
    }
    setBusy(false);
  }

  function toggleMic() {
    const SR = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (!SR) {
      setOut("Voice input needs Chrome or Edge.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setPrompt(text);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 34,
    padding: "0 13px",
    borderRadius: "var(--r-pill)",
    border: `1px solid ${active ? "var(--studio-primary)" : "var(--hairline)"}`,
    background: active ? "var(--mint-pill)" : "#fff",
    color: active ? "var(--studio-teal-dark)" : "var(--ink)",
    fontSize: 13.5,
    fontWeight: 600,
  });

  return (
    <div style={{ width: "100%", maxWidth: 840, margin: "0 auto" }}>
      <div
        style={{
          border: "1.5px solid var(--studio-primary)",
          borderRadius: 16,
          background: "#fff",
          padding: "16px 16px 12px",
          boxShadow: "0 1px 0 rgba(0,0,0,0.01)",
        }}
      >
        <textarea
          id="studio-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              generate();
            }
          }}
          placeholder="Describe what you want to create"
          rows={1}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 16,
            color: "var(--ink)",
            minHeight: 26,
            lineHeight: 1.5,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button
            aria-label="Add"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "var(--studio-primary)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <PlusIcon size={20} />
          </button>

          <button style={chip(mode === "image")} onClick={() => setMode(mode === "image" ? "auto" : "image")}>
            <ImageIcon size={16} /> Create Image
          </button>
          <button style={chip(mode === "auto")} onClick={() => setMode("auto")}>
            <LayoutAutoIcon size={16} /> Auto
          </button>
          <button style={chip(mode === "style")} onClick={() => setMode(mode === "style" ? "auto" : "style")}>
            <PaletteIcon size={16} /> Style
          </button>
          <span
            style={{
              ...chip(false),
              padding: "0 11px",
              color: "var(--muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <ImageIcon size={15} /> 1
          </span>

          <span style={{ flex: 1 }} />

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 12px",
              borderRadius: "var(--r-pill)",
              background: "var(--mint-pill)",
              color: "var(--studio-teal-dark)",
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            GPT-5.5 Instant <ChevronDownIcon size={15} />
          </span>
          <button
            aria-label={listening ? "Stop voice input" : "Voice input"}
            onClick={toggleMic}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: listening ? "var(--studio-teal-dark)" : "var(--studio-primary)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            {busy ? "…" : <MicIcon size={19} color="#fff" />}
          </button>
        </div>
      </div>

      {out && (
        <div
          style={{
            marginTop: 18,
            background: "#fff",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-card)",
            padding: 18,
            whiteSpace: "pre-wrap",
            color: "var(--ink)",
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {out}
        </div>
      )}
    </div>
  );
}
