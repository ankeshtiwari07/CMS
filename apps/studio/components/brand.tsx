import React from "react";

/**
 * HUMAIN wordmark — faithful SVG reconstruction of the official logo:
 * geometric bold caps with the signature "H" formed by two verticals and TWO
 * crossbars (upper + lower). Recolorable via `color` (drives currentColor), so
 * it works white on the dark CMS bar and ink on the light Studio sidebar.
 * viewBox 0 0 504 100; render height set by `size` (width auto-scales).
 */
export function HumainWordmark({ color = "#0b1416", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg height={size} viewBox="0 0 504 100" fill="none" style={{ color, display: "block" }} role="img" aria-label="HUMAIN">
      <g fill="currentColor">
        {/* H — two verticals + upper & lower crossbars */}
        <rect x="0" y="0" width="16" height="100" />
        <rect x="58" y="0" width="16" height="100" />
        <rect x="16" y="23" width="42" height="16" />
        <rect x="16" y="61" width="42" height="16" />
        {/* U */}
        <g transform="translate(94,0)">
          <rect x="0" y="0" width="16" height="86" />
          <rect x="54" y="0" width="16" height="86" />
          <rect x="0" y="84" width="70" height="16" />
        </g>
        {/* M verticals */}
        <rect x="184" y="0" width="16" height="100" />
        <rect x="258" y="0" width="16" height="100" />
        {/* A crossbar */}
        <rect x="318" y="62" width="32" height="15" />
        {/* I */}
        <rect x="394" y="0" width="16" height="100" />
        {/* N verticals */}
        <rect x="430" y="0" width="16" height="100" />
        <rect x="488" y="0" width="16" height="100" />
      </g>
      {/* diagonals */}
      <g stroke="currentColor" strokeWidth="16" fill="none" strokeLinejoin="miter" strokeLinecap="butt">
        <path d="M200 4 L229 54 L258 4" /> {/* M inner V */}
        <path d="M298 100 L334 6 L370 100" /> {/* A legs */}
        <path d="M446 4 L488 96" /> {/* N diagonal */}
      </g>
    </svg>
  );
}

/** Compact HUMAIN mark — the double-bar "H" glyph only. */
export function HumainMark({ color = "#0b1416", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg height={size} viewBox="0 0 74 100" fill="currentColor" style={{ color, display: "block" }} role="img" aria-label="HUMAIN">
      <rect x="0" y="0" width="16" height="100" />
      <rect x="58" y="0" width="16" height="100" />
      <rect x="16" y="23" width="42" height="16" />
      <rect x="16" y="61" width="42" height="16" />
    </svg>
  );
}

/** Sidebar lockup: wordmark + product label ("Create Studio") in brand teal. */
export function HumainLockup({ color = "#0b1416" }: { color?: string }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <HumainWordmark color={color} size={18} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--studio-primary)", letterSpacing: "0.01em" }}>Create Studio</span>
    </div>
  );
}
