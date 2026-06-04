import React from "react";

/** HUMAIN wordmark — the distinctive "H" uses a raised crossbar (⊢⊣ look). */
export function HumainWordmark({
  color = "#1a1a1a",
  size = 26,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <span
      aria-label="HUMAIN"
      style={{
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.06em",
        color,
        lineHeight: 1,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      HUMAIN
    </span>
  );
}

/** Compact HUMAIN mark for the icon rail — the bracketed-H glyph. */
export function HumainMark({ color = "#1a1a1a", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="HUMAIN">
      <rect x="3" y="3" width="2.6" height="18" rx="1" fill={color} />
      <rect x="18.4" y="3" width="2.6" height="18" rx="1" fill={color} />
      <rect x="3" y="8" width="18" height="2.6" rx="1" fill={color} />
    </svg>
  );
}
