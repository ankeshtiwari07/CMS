"use client";
import type { CSSProperties } from "react";

// A fanned trio of preview cards above the Create greeting — evoking the kinds of
// things you can make (a deck, a visual, an email). Pure CSS, HUMAIN-themed, no assets.

function SlidesCard() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0b3b36,var(--studio-teal-dark))", padding: 12 }}>
      <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 8, height: "100%", padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ width: "55%", height: 7, borderRadius: 4, background: "var(--studio-teal-dark)" }} />
        <div style={{ width: "82%", height: 5, borderRadius: 3, background: "var(--hairline)" }} />
        <div style={{ width: "72%", height: 5, borderRadius: 3, background: "var(--hairline)" }} />
        <div style={{ display: "flex", gap: 5, marginTop: "auto", alignItems: "flex-end" }}>
          {[13, 20, 10, 24].map((h, i) => <div key={i} style={{ width: 7, height: h, borderRadius: 2, background: i % 2 ? "var(--lime)" : "var(--studio-teal-dark)" }} />)}
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "conic-gradient(var(--studio-teal-dark) 0 40%,var(--lime) 40% 70%,var(--hairline) 70% 100%)", marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

function CityCard() {
  const streaks = [
    { l: "10%", w: 3, h: "50%", c: "#3fe0d0" }, { l: "18%", w: 2, h: "34%", c: "#8ef2c8" },
    { l: "26%", w: 4, h: "66%", c: "#22d3ee" }, { l: "35%", w: 2, h: "44%", c: "#67e8f9" },
    { l: "44%", w: 3, h: "78%", c: "var(--lime)" }, { l: "53%", w: 2, h: "40%", c: "#3fe0d0" },
    { l: "62%", w: 4, h: "60%", c: "#22d3ee" }, { l: "72%", w: 2, h: "48%", c: "#8ef2c8" },
    { l: "80%", w: 3, h: "56%", c: "#3fe0d0" }, { l: "88%", w: 2, h: "36%", c: "var(--lime)" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: "radial-gradient(120% 100% at 50% 100%, #0f3b46 0%, #061319 72%)", position: "relative", overflow: "hidden" }}>
      {streaks.map((s, i) => (
        <div key={i} style={{ position: "absolute", bottom: "20%", left: s.l, width: s.w, height: s.h, background: s.c, borderRadius: 2, boxShadow: `0 0 9px ${s.c}`, opacity: 0.92 }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "20%", background: "linear-gradient(180deg, rgba(63,224,208,0.12), rgba(0,0,0,0))", filter: "blur(1px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,19,25,0.35) 0%, transparent 34%)" }} />
    </div>
  );
}

function EmailCard() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#eaf7e6,#d6efd0)", padding: 11 }}>
      <div style={{ background: "#fff", borderRadius: 8, height: "100%", padding: 10 }}>
        <div style={{ fontSize: 7.5, color: "#9aa" }}>Tue 11, 2022, 9:10 PM</div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#12313a", margin: "4px 0 5px", lineHeight: 1.2 }}>Q4 Project Alpha — Update</div>
        <div style={{ fontSize: 8, color: "#2f9e5a", fontWeight: 700 }}>From: Janet Chen</div>
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          {[92, 82, 88, 64].map((w, i) => <div key={i} style={{ width: `${w}%`, height: 4, borderRadius: 2, background: "#e6ece9" }} />)}
        </div>
      </div>
    </div>
  );
}

export default function HeroCards() {
  const card: CSSProperties = { width: 212, height: 138, borderRadius: 16, overflow: "hidden", boxShadow: "0 16px 34px -16px rgba(16,60,55,0.34)", border: "1px solid rgba(0,0,0,0.05)", background: "var(--card)", flexShrink: 0 };
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", margin: "8px 0 0", pointerEvents: "none", userSelect: "none" }}>
      <div style={{ ...card, transform: "rotate(-7deg)", marginRight: -28, marginBottom: 14, zIndex: 1 }}><SlidesCard /></div>
      <div style={{ ...card, width: 230, height: 150, zIndex: 3, boxShadow: "0 22px 46px -16px rgba(16,60,55,0.42)" }}><CityCard /></div>
      <div style={{ ...card, transform: "rotate(7deg)", marginLeft: -28, marginBottom: 14, zIndex: 1 }}><EmailCard /></div>
    </div>
  );
}
