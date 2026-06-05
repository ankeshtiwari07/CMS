import React from "react";

/**
 * Real per-format preview thumbnails for the Quick-create cards — crafted
 * miniatures of each output type (not gradients/stock photos), built from the
 * brand palette. Each fills a ~108px-tall tile.
 */
const TEAL = "#00A18B";
const TEAL_DARK = "#0E7C6B";
const LIME = "#C2E54B";
const INK = "#1A1A1A";
const MUTED = "#9aa6ad";
const LINE = "#e6e8eb";

const frame: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: 14,
};
const bar = (w: number | string, c = "#cdd6da", h = 6): React.CSSProperties => ({
  width: w, height: h, borderRadius: 4, background: c,
});

export function DeckThumb() {
  return (
    <div style={{ ...frame, background: "linear-gradient(135deg,#eef7f4,#dcefe7)" }}>
      <div style={{ position: "relative", width: "82%" }}>
        {/* back slide peeking */}
        <div style={{ position: "absolute", top: -8, left: 10, right: -10, height: 84, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", opacity: 0.6 }} />
        {/* front slide */}
        <div style={{ position: "relative", background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ ...bar("55%", TEAL, 8), marginBottom: 8 }} />
          <div style={{ ...bar("90%"), marginBottom: 5 }} />
          <div style={{ ...bar("78%"), marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: LIME }} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#cdd6da" }} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#cdd6da" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageThumb() {
  return (
    <div style={{ ...frame, background: "#0e2a2e" }}>
      <div style={{ width: "86%", height: 92, borderRadius: 8, overflow: "hidden", border: "3px solid rgba(255,255,255,0.9)", position: "relative", background: "linear-gradient(180deg,#bfe9ff 0%,#e9f7ef 55%,#cdebd6 100%)" }}>
        {/* sun */}
        <div style={{ position: "absolute", top: 12, right: 16, width: 18, height: 18, borderRadius: "50%", background: "#ffd15c" }} />
        {/* mountains */}
        <svg viewBox="0 0 120 50" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 34 }}>
          <polygon points="0,50 30,18 55,50" fill={TEAL_DARK} />
          <polygon points="35,50 70,10 105,50" fill={TEAL} />
          <polygon points="80,50 105,24 120,50" fill="#5cc4ad" />
        </svg>
      </div>
    </div>
  );
}

export function WebsiteThumb() {
  return (
    <div style={{ ...frame, background: "linear-gradient(135deg,#eaf2ff,#f3ecff)" }}>
      <div style={{ width: "88%", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        {/* browser chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", background: "#f4f6f8", borderBottom: `1px solid ${LINE}` }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ ...bar("46%", "#dfe3e7", 7), marginLeft: 6, borderRadius: 999 }} />
        </div>
        {/* hero + content */}
        <div style={{ padding: 10 }}>
          <div style={{ height: 26, borderRadius: 6, background: `linear-gradient(120deg,${TEAL},${TEAL_DARK})`, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, height: 22, borderRadius: 5, background: "#eef1f3" }} />
            <div style={{ flex: 1, height: 22, borderRadius: 5, background: "#eef1f3" }} />
            <div style={{ flex: 1, height: 22, borderRadius: 5, background: "#eef1f3" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailThumb() {
  return (
    <div style={{ ...frame, background: "linear-gradient(135deg,#eef1f3,#e0e5ea)" }}>
      <div style={{ width: "84%", background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: TEAL, color: "#fff", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center" }}>H</span>
          <div style={{ ...bar("46%", "#c7d0d5", 7) }} />
        </div>
        <div style={{ ...bar("70%", INK, 7), marginBottom: 9 }} />
        <div style={{ ...bar("100%"), marginBottom: 5 }} />
        <div style={{ ...bar("92%"), marginBottom: 5 }} />
        <div style={{ ...bar("60%"), marginBottom: 11 }} />
        <div style={{ width: 56, height: 16, borderRadius: 999, background: LIME }} />
      </div>
    </div>
  );
}

export function WritingThumb() {
  return (
    <div style={{ ...frame, background: "linear-gradient(135deg,#f5f2ec,#e9e2d6)" }}>
      <div style={{ width: "76%", background: "#fff", borderRadius: 8, padding: "14px 14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ ...bar("64%", INK, 8), marginBottom: 10 }} />
        {["100%", "96%", "100%", "88%", "70%"].map((w, i) => (
          <div key={i} style={{ ...bar(w), marginBottom: 6 }} />
        ))}
      </div>
    </div>
  );
}

export function TranslationThumb() {
  return (
    <div style={{ ...frame, background: "linear-gradient(135deg,#fff4d6,#f3dca0)" }}>
      <div style={{ width: "88%", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 7 }}>EN</div>
          <div style={{ ...bar("100%"), marginBottom: 5 }} />
          <div style={{ ...bar("80%") }} />
        </div>
        <div style={{ display: "grid", placeItems: "center", color: TEAL_DARK, fontWeight: 800, fontSize: 13 }}>⇄</div>
        <div dir="rtl" style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 7 }}>ع</div>
          <div style={{ ...bar("100%", "#cbd5da"), marginBottom: 5 }} />
          <div style={{ ...bar("80%", "#cbd5da"), marginInlineStart: "auto" }} />
        </div>
      </div>
    </div>
  );
}

export const THUMBS: Record<string, React.FC> = {
  "Create Deck": DeckThumb,
  "Create Image": ImageThumb,
  "Create Website / App": WebsiteThumb,
  Email: EmailThumb,
  Writing: WritingThumb,
  Translation: TranslationThumb,
};
