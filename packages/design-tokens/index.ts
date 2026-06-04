// Single source of truth for HUMAIN brand — two themed surfaces, shared scale.
export const cms = {
  bg: { ink: "#0B1416", deepTeal: "#0E2A2E" },
  accent: { teal: "#11515A", lime: "#C2E54B", limeDark: "#9DBF2D" },
  action: { publish: "#103B47" },
  card: { mint: "#BFEBC8" },
  surface: { white: "#FFFFFF" },
  text: { label: "#0E4049", muted: "#5A6B6E" },
} as const;

export const studio = {
  accent: { teal: "#00A18B", tealDark: "#0E7C6B" },
  mint: { tint: "#CEEBE7", light: "#E4F4F0" },
  surface: { white: "#FFFFFF" },
  text: { ink: "#1A1A1A", muted: "#6B7280" },
  line: { hairline: "#E6E8EB" },
} as const;

export const shared = {
  radius: { input: 10, card: 18, pill: 999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  font: { ui: "Inter, system-ui, sans-serif", arabic: "'IBM Plex Sans Arabic', sans-serif", mono: "ui-monospace, monospace" },
  elevation: { card: "0 8px 24px rgba(0,0,0,.12)" },
} as const;

export const tokens = { cms, studio, shared };
export default tokens;
