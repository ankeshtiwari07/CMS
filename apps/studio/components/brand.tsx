import React from "react";

// Official HUMAIN logo PNGs (white on transparent), provided by the brand.
// They're white, so on light surfaces we render them black via brightness(0);
// on dark surfaces (CMS top bar) we show them as-is. `onDark` picks which.
const WORDMARK = "/brand/humain-wordmark.png"; // 128 x 20
const HMARK = "/brand/humain-h.png"; // 18 x 16

const tone = (onDark?: boolean): React.CSSProperties =>
  onDark ? { filter: "none" } : { filter: "brightness(0)" };

export function HumainWordmark({ size = 20, onDark = false }: { size?: number; onDark?: boolean; color?: string }) {
  return (
    <img
      src={WORDMARK}
      alt="HUMAIN"
      height={size}
      style={{ height: size, width: "auto", display: "block", ...tone(onDark) }}
    />
  );
}

export function HumainMark({ size = 22, onDark = false }: { size?: number; onDark?: boolean; color?: string }) {
  return (
    <img
      src={HMARK}
      alt="HUMAIN"
      height={size}
      style={{ height: size, width: "auto", display: "block", ...tone(onDark) }}
    />
  );
}

/** Sidebar lockup: wordmark + product label ("Create Studio") in brand teal. */
export function HumainLockup({ onDark = false }: { onDark?: boolean; color?: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <HumainWordmark size={18} onDark={onDark} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--studio-primary)", letterSpacing: "0.01em" }}>Create Studio</span>
    </div>
  );
}
