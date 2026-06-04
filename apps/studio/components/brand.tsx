import React from "react";

// Official HUMAIN wordmark (from humain.com /hero-logos/humain-logo.svg).
// fill=currentColor -> recolors via the `color` prop (white on dark bar, ink on light).
const LETTERS = {
  h: "M14.8545 2.90108H2.96384V0.0326309H0V13.7556H2.96384V10.8708H14.8545V13.7556H17.8183V0.0326309H14.8545V2.91738V2.90108ZM2.96384 8.37722V5.39468H14.8545V8.37722H2.96384Z",
  u: "M33.5726 7.13853C33.5726 9.61583 31.826 11.3923 29.4091 11.3923C26.9921 11.3923 25.2456 9.61583 25.2456 7.13853V0H22.2817V7.13853C22.2817 11.0827 25.3161 14 29.4091 14C33.502 14 36.5364 11.0827 36.5364 7.13853V0H33.5726V7.13853Z",
  m: "M48.5327 5.7695H48.321L43.6635 0H40.9819V13.7229H43.9458V4.1234H43.9987C43.9987 4.1234 44.2986 5.00349 44.8279 5.65541L46.9096 8.2305H49.8735L51.9552 5.65541C52.4845 5.00349 52.7844 4.1234 52.7844 4.1234H52.8373V13.7229H55.8011V0H53.1196L48.4797 5.7695H48.5327Z",
  a: "M65.0635 0L58.9771 13.7229H62.1173L63.3346 10.9849H71.1853L72.4025 13.7229H75.6134L69.5269 0H65.0635ZM64.4284 8.50757L67.11 2.4773H67.4099L70.0915 8.50757H64.446H64.4284Z",
  i: "M81.6821 0H78.7183V13.7229H81.6821V0Z",
  n: "M98.0362 0V9.46915L88.8271 0H86.1455V13.7229H89.1093V4.25378L98.3184 13.7229H101V0H98.0362Z",
};

export function HumainWordmark({ color = "#0b1416", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg height={size} viewBox="0 0 101 14" fill="currentColor" style={{ color, display: "block" }} role="img" aria-label="HUMAIN" xmlns="http://www.w3.org/2000/svg">
      {Object.values(LETTERS).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Compact HUMAIN mark — the "H" glyph only (from the wordmark). */
export function HumainMark({ color = "#0b1416", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg height={size} viewBox="0 0 17.82 13.79" fill="currentColor" style={{ color, display: "block" }} role="img" aria-label="HUMAIN" xmlns="http://www.w3.org/2000/svg">
      <path d={LETTERS.h} />
    </svg>
  );
}

/** Sidebar lockup: wordmark + product label ("Create Studio") in brand teal. */
export function HumainLockup({ color = "#0b1416" }: { color?: string }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <HumainWordmark color={color} size={17} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--studio-primary)", letterSpacing: "0.01em" }}>Create Studio</span>
    </div>
  );
}
