import React from "react";

/**
 * HUMAIN wordmark — bold geometric uppercase with the signature notched "H"
 * (raised crossbar) drawn as SVG, followed by the remaining letters. Matches the
 * humain.com / Figma lockup. `color` controls all strokes/fills.
 */
export function HumainWordmark({ color = "#0b1416", size = 22 }: { color?: string; size?: number }) {
  // size = cap height in px; the wordmark scales from it.
  const h = size;
  return (
    <span
      aria-label="HUMAIN"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: h * 0.16,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 800,
        fontSize: h,
        letterSpacing: "0.16em",
        lineHeight: 1,
        color,
        userSelect: "none",
      }}
    >
      <svg width={h * 0.92} height={h} viewBox="0 0 24 26" fill="none" aria-hidden>
        {/* signature H: two verticals + a high crossbar */}
        <rect x="2" y="1" width="4.2" height="24" rx="0.6" fill={color} />
        <rect x="17.8" y="1" width="4.2" height="24" rx="0.6" fill={color} />
        <rect x="2" y="7.5" width="20" height="4.2" rx="0.6" fill={color} />
      </svg>
      <span style={{ letterSpacing: "0.16em" }}>UMAIN</span>
    </span>
  );
}

/** Compact HUMAIN mark for the collapsed rail — the notched-H glyph only. */
export function HumainMark({ color = "#0b1416", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 26" fill="none" aria-label="HUMAIN">
      <rect x="2" y="1" width="4.2" height="24" rx="0.6" fill={color} />
      <rect x="17.8" y="1" width="4.2" height="24" rx="0.6" fill={color} />
      <rect x="2" y="7.5" width="20" height="4.2" rx="0.6" fill={color} />
    </svg>
  );
}

/** Sidebar lockup: wordmark + product label ("Create Studio") in brand teal. */
export function HumainLockup({ color = "#0b1416" }: { color?: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <HumainWordmark color={color} size={20} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--studio-primary)",
          letterSpacing: "0.01em",
          paddingInlineStart: 1,
        }}
      >
        Create Studio
      </span>
    </div>
  );
}
