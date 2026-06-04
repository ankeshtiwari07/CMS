"use client";
import { useState } from "react";
import { studio, shared } from "@humain/design-tokens";

export default function StudioHome() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("website");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true); setOut(null);
    const res = await fetch("/api/generate", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, prompt }),
    });
    const data = await res.json();
    setOut(data.artifact ?? "generation failed");
    setBusy(false);
  }

  return (
    <main style={{ fontFamily: shared.font.ui, maxWidth: 880, margin: "60px auto", padding: 24 }}>
      <h1 style={{ textAlign: "center", color: studio.text.ink }}>Good morning! What do you want to create today?</h1>
      <div style={{ border: `1.5px solid ${studio.accent.teal}`, borderRadius: shared.radius.card, padding: 16 }}>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create"
          style={{ width: "100%", border: "none", outline: "none", resize: "vertical", minHeight: 56, fontSize: 16 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value)}
            style={{ background: studio.mint.light, color: studio.accent.tealDark, border: "none", borderRadius: shared.radius.pill, padding: "6px 12px" }}>
            {["website","deck","image","email","writing","translation","designSystem","brand"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ flex: 1 }} />
          <button onClick={generate} disabled={busy || !prompt}
            style={{ background: studio.accent.teal, color: "#fff", border: "none", borderRadius: shared.radius.pill, width: 44, height: 44, cursor: "pointer" }}>
            {busy ? "…" : "↑"}
          </button>
        </div>
      </div>
      {out && <pre style={{ whiteSpace: "pre-wrap", marginTop: 24, color: studio.text.ink }}>{out}</pre>}
    </main>
  );
}
