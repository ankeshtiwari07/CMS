"use client";
import { useMemo, useState } from "react";
import { ImageIcon, MicIcon, ArrowUpIcon, PaletteIcon, CheckIcon } from "@/components/icons";

export type Theme = {
  primary: string;
  primaryDark: string;
  accent: string;
  ink: string;
  canvas: string;
  muted: string;
  font: string;
  radius: number;
  mode: "light" | "dark";
};

// HUMAIN Foundation defaults. These stay literal hex (not var()) because they
// seed <input type="color">, which cannot resolve a custom property. Values are
// the real design-system tokens: air-600 primary, --primary-hover, oasis-400
// accent, neutral ink/muted, 2xl radius.
export const DEFAULT_THEME: Theme = {
  primary: "#009688",
  primaryDark: "#00796B",
  accent: "#B8E636",
  ink: "#161616",
  canvas: "#FFFFFF",
  muted: "#737373",
  font: "Inter",
  radius: 16,
  mode: "light",
};

const FONTS = ["Inter", "IBM Plex Sans Arabic", "System UI", "Georgia"];
const PRESETS: { name: string; t: Partial<Theme> }[] = [
  { name: "HUMAIN", t: DEFAULT_THEME },
  { name: "Midnight", t: { primary: "#4F8EF7", primaryDark: "#2E6BD6", accent: "#9DE5FF", ink: "#E8EEF6", canvas: "#0B1220", muted: "#8A97AB", mode: "dark" } },
  { name: "Desert", t: { primary: "#C97A40", primaryDark: "#9E5C2C", accent: "#EAC36B", ink: "#2A1E12", canvas: "#FBF5EC", muted: "#8A765C", mode: "light" } },
  { name: "Emerald", t: { primary: "#0FA36B", primaryDark: "#0A7A4F", accent: "#B6F09C", ink: "#10241B", canvas: "#FFFFFF", muted: "#5E7A6E", mode: "light" } },
];

const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryDark", label: "Primary Dark" },
  { key: "accent", label: "Accent / CTA" },
  { key: "ink", label: "Text / Ink" },
  { key: "canvas", label: "Canvas / Background" },
  { key: "muted", label: "Muted" },
];

const fontStack = (f: string) =>
  f === "IBM Plex Sans Arabic" ? "var(--font-ar), 'IBM Plex Sans Arabic', sans-serif"
  : f === "System UI" ? "system-ui, -apple-system, sans-serif"
  : f === "Georgia" ? "Georgia, 'Times New Roman', serif"
  : "var(--font-ui), Inter, sans-serif";

export default function ThemeBuilder({ initial, canSave }: { initial: Theme; canSave: boolean }) {
  const [t, setT] = useState<Theme>({ ...DEFAULT_THEME, ...initial });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [rationale, setRationale] = useState<string | null>(null);

  const set = (k: keyof Theme, v: string | number) => setT((s) => ({ ...s, [k]: v }));

  // Prompt-driven, agent-governed theme: describe the vibe → colours change live.
  async function generate() {
    if (!aiPrompt.trim() || aiBusy) return;
    setAiBusy(true); setToast(null); setRationale(null);
    try {
      const res = await fetch("/api/theme/suggest", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const d = await res.json();
      if (d.ok && d.theme) {
        const { rationale: r, ...theme } = d.theme;
        setT((s) => ({ ...s, ...theme }));
        setRationale(r || null);
      } else setToast({ kind: "err", msg: d.error || "Could not generate a theme." });
    } catch { setToast({ kind: "err", msg: "Could not reach the generation service." }); }
    setAiBusy(false);
  }
  const dirty = useMemo(() => JSON.stringify(t) !== JSON.stringify({ ...DEFAULT_THEME, ...initial }), [t, initial]);

  async function save() {
    setBusy(true); setToast(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: t }),
      });
      if (res.ok) {
        // Apply live to the running app so the change is visible immediately.
        const r = document.documentElement.style;
        r.setProperty("--studio-primary", t.primary); r.setProperty("--studio-teal-dark", t.primaryDark); r.setProperty("--mint-pill", t.accent);
        r.setProperty("--ink", t.ink); r.setProperty("--canvas", t.canvas); r.setProperty("--muted", t.muted); r.setProperty("--r-card", (t.radius || 18) + "px");
        try { localStorage.setItem("humain-theme-colors", JSON.stringify({ primary: t.primary, primaryDark: t.primaryDark, accent: t.accent, ink: t.ink, canvas: t.canvas, muted: t.muted, radius: t.radius })); } catch {}
        setToast({ kind: "ok", msg: "Theme applied and saved to your site settings." });
      }
      else { const d = await res.json().catch(() => ({})); setToast({ kind: "err", msg: d.error || "Save failed (need publisher/admin)." }); }
    } catch {
      setToast({ kind: "err", msg: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  }

  const dark = t.mode === "dark";
  const previewBg = dark ? t.canvas : t.canvas;
  const previewInk = t.ink;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,360px) 1fr", gap: 26, alignItems: "start" }}>
      {/* ---- Controls ---- */}
      <div>
        {/* Prompt-driven, agent-governed theme generation */}
        <div style={{ border: "1.5px solid var(--studio-primary)", borderRadius: 14, padding: 14, marginBottom: 22, background: "var(--mint-pill)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--studio-teal-dark)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 7 }}>
            <PaletteIcon size={16} color="var(--studio-teal-dark)" /> Describe your design
          </h3>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="e.g. a bold fintech look — deep navy, electric lime accent, sharp corners, dark mode"
            rows={2}
            style={{ width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "9px 11px", fontSize: 13.5, color: "var(--ink)", outline: "none", resize: "vertical", background: "var(--card)" }}
          />
          <button onClick={generate} disabled={aiBusy || !aiPrompt.trim()}
            style={{ width: "100%", height: 40, marginTop: 8, borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: aiBusy || !aiPrompt.trim() ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {aiBusy ? "Generating theme…" : "Generate theme with AI"}
          </button>
          {rationale && <div style={{ fontSize: 12, color: "var(--studio-teal-dark)", marginTop: 8, lineHeight: 1.5 }}>✨ {rationale}</div>}
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>Generates a full palette, font &amp; radius — then fine-tune below.</div>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 10px" }}>Presets</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => setT((s) => ({ ...s, ...p.t }))}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 12px", borderRadius: 999, border: "1px solid var(--hairline)", background: "var(--card)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              <span style={{ display: "inline-flex" }}>
                {[p.t.primary, p.t.accent, p.t.canvas].map((c, i) => (
                  <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c as string, border: "1px solid rgba(0,0,0,0.1)", marginLeft: i ? -4 : 0 }} />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 10px" }}>Colors</h3>
        <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={String(t[key])} onChange={(e) => set(key, e.target.value)}
                style={{ width: 38, height: 34, border: "1px solid var(--hairline)", borderRadius: 8, background: "none", padding: 2, cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
              </div>
              <input value={String(t[key])} onChange={(e) => set(key, e.target.value)}
                style={{ width: 96, border: "1px solid var(--hairline)", borderRadius: 8, padding: "6px 8px", fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: "var(--ink)", textTransform: "uppercase", outline: "none" }} />
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 10px" }}>Typography</h3>
        <select value={t.font} onChange={(e) => set("font", e.target.value)}
          style={{ width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--ink)", background: "var(--card)", marginBottom: 22, cursor: "pointer" }}>
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 10px" }}>Corner radius — {t.radius}px</h3>
        <input type="range" min={0} max={28} value={t.radius} onChange={(e) => set("radius", Number(e.target.value))}
          style={{ width: "100%", accentColor: t.primary, marginBottom: 22 }} />

        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 10px" }}>Preview surface</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["light", "dark"] as const).map((m) => (
            <button key={m} onClick={() => set("mode", m)}
              style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${t.mode === m ? "var(--studio-primary)" : "var(--hairline)"}`, background: t.mode === m ? "var(--mint-pill)" : "var(--card)", color: t.mode === m ? "var(--studio-teal-dark)" : "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setT({ ...DEFAULT_THEME })}
            style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Reset
          </button>
          <button onClick={save} disabled={busy || !canSave} title={canSave ? "" : "Requires publisher/admin"}
            style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: canSave ? "var(--studio-primary)" : "var(--hairline)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy || !canSave ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckIcon size={16} color="#fff" /> {busy ? "Saving…" : canSave ? "Save theme" : "View only"}
          </button>
        </div>
        {!canSave && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>You can experiment freely; saving needs a publisher or admin role.</div>}
        {dirty && canSave && !toast && <div style={{ fontSize: 12, color: "var(--studio-teal-dark)", marginTop: 8 }}>Unsaved changes.</div>}
        {toast && <div style={{ fontSize: 12.5, marginTop: 8, color: toast.kind === "ok" ? "var(--studio-teal-dark)" : "#b42318" }}>{toast.msg}</div>}
      </div>

      {/* ---- Live preview ---- */}
      <div style={{ position: "sticky", top: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>LIVE PREVIEW</div>
        <div style={{ background: previewBg, color: previewInk, border: "1px solid var(--hairline)", borderRadius: Math.max(12, t.radius), padding: 26, fontFamily: fontStack(t.font), boxShadow: "var(--shadow-card)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>What do you want to create today?</div>
          <div style={{ fontSize: 13.5, color: t.muted, marginBottom: 18 }}>Your theme in action — buttons, inputs, and accents.</div>

          {/* prompt-box mock using the live values */}
          <div style={{ border: `1.5px solid ${t.primary}`, borderRadius: t.radius, background: dark ? "rgba(255,255,255,0.04)" : "#fff", padding: 14 }}>
            <div style={{ fontSize: 14, color: t.muted }}>Describe what you want to create</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: 999, background: dark ? "rgba(255,255,255,0.08)" : `${t.primary}14`, color: t.primary, fontSize: 12.5, fontWeight: 600 }}>
                <ImageIcon size={14} color={t.primary} /> Create Image
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ height: 30, padding: "0 11px", borderRadius: 999, background: t.accent, color: t.ink, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center" }}>Claude</span>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: t.primary, color: "#fff", display: "grid", placeItems: "center" }}>
                <ArrowUpIcon size={17} color="#fff" />
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button style={{ height: 40, padding: "0 18px", borderRadius: 999, border: "none", background: t.primary, color: "#fff", fontSize: 14, fontWeight: 700 }}>Primary action</button>
            <button style={{ height: 40, padding: "0 18px", borderRadius: 999, border: "none", background: t.accent, color: t.ink, fontSize: 14, fontWeight: 700 }}>Publish</button>
            <button style={{ height: 40, padding: "0 18px", borderRadius: 999, border: `1px solid ${t.primary}`, background: "transparent", color: t.primary, fontSize: 14, fontWeight: 700 }}>Secondary</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            {[["Sovereign", t.primary], ["Arabic-first", t.primaryDark]].map(([label, c]) => (
              <div key={label} style={{ border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : t.muted + "33"}`, borderRadius: t.radius, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: c as string, marginBottom: 10 }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 4 }}>Card surface using your radius &amp; palette.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
