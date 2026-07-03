// HUMAIN UI design tokens (UI Specification Document v1, April 2026), applied to
// the CMS. Light values are taken directly from the spec; dark values are derived
// consistently (the spec's dark page reused the light table, so dark is tuned to
// the same hues). Consumed as CSS custom properties set on the CMS root.
import type { CSSProperties } from "react";

export type Theme = "light" | "dark";

// Border radius scale (spec: none 0 · sm 2 · default 4 · md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24 · full).
export const R = { sm: 2, base: 4, md: 6, lg: 8, xl: 12, x2: 16, x3: 24, full: 9999 } as const;

// Elevation scale (spec).
export const SHADOW = {
  light: {
    sm: "0 1px 2px 0 rgba(0,0,0,.05), 0 4px 6px -3px rgba(0,0,0,.05)",
    md: "0 4px 6px -1px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.10)",
    lg: "0 10px 15px -3px rgba(0,0,0,.10), 0 4px 6px -4px rgba(0,0,0,.10)",
    xl: "0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.10)",
  },
  dark: {
    sm: "0 1px 2px 0 rgba(0,0,0,.5), 0 4px 6px -3px rgba(0,0,0,.4)",
    md: "0 4px 8px -1px rgba(0,0,0,.55), 0 2px 4px -2px rgba(0,0,0,.5)",
    lg: "0 12px 22px -3px rgba(0,0,0,.6), 0 4px 8px -4px rgba(0,0,0,.5)",
    xl: "0 24px 34px -5px rgba(0,0,0,.65), 0 8px 12px -6px rgba(0,0,0,.55)",
  },
} as const;

// Typography (spec): sm 14/20, base 16/22, lg 18/24.
export const TYPE = {
  sm: { fontSize: 14, lineHeight: "20px" },
  base: { fontSize: 16, lineHeight: "22px" },
  lg: { fontSize: 18, lineHeight: "24px" },
} as const;

const LIGHT: Record<string, string> = {
  "--hc-bg": "#FFFFFF",
  "--hc-surface-1": "#FFFFFF",
  "--hc-surface-2": "#F3F6F5",
  "--hc-fg": "rgba(0,0,0,0.87)",
  "--hc-fg-muted": "rgba(0,0,0,0.46)",
  "--hc-card": "#FFFFFF",
  "--hc-popover": "#FFFFFF",
  "--hc-muted": "rgba(0,0,0,0.03)",
  "--hc-border": "rgba(0,0,0,0.09)",
  "--hc-input": "rgba(0,0,0,0.12)",
  "--hc-primary": "#009688",
  "--hc-primary-fg": "#FFFFFF",
  "--hc-primary-10": "rgba(0,150,136,0.10)",
  "--hc-accent": "#BBE636",
  "--hc-accent-fg": "rgba(0,0,0,0.87)",
  "--hc-ghost": "#F0F3F2",
  "--hc-sidebar": "#F7F7F8",
  "--hc-sidebar-fg": "#1B2E33",
  "--hc-sidebar-accent": "#EFEEF0",
  "--hc-success": "#028541",
  "--hc-warning": "#E39219",
  "--hc-info": "#0891B2",
  "--hc-destructive": "#DC2626",
  "--hc-ring": "#009688",
};

const DARK: Record<string, string> = {
  "--hc-bg": "#0C1413",
  "--hc-surface-1": "#101C1A",
  "--hc-surface-2": "#0B1413",
  "--hc-fg": "rgba(255,255,255,0.92)",
  "--hc-fg-muted": "rgba(255,255,255,0.55)",
  "--hc-card": "#122120",
  "--hc-popover": "#14201F",
  "--hc-muted": "rgba(255,255,255,0.06)",
  "--hc-border": "rgba(255,255,255,0.11)",
  "--hc-input": "rgba(255,255,255,0.16)",
  "--hc-primary": "#12B6A4",
  "--hc-primary-fg": "#04211E",
  "--hc-primary-10": "rgba(18,182,164,0.14)",
  "--hc-accent": "#C2E54B",
  "--hc-accent-fg": "rgba(0,0,0,0.87)",
  "--hc-ghost": "rgba(255,255,255,0.06)",
  "--hc-sidebar": "#0C1413",
  "--hc-sidebar-fg": "rgba(255,255,255,0.9)",
  "--hc-sidebar-accent": "rgba(255,255,255,0.08)",
  "--hc-success": "#34C77B",
  "--hc-warning": "#F0A93C",
  "--hc-info": "#3BB6D6",
  "--hc-destructive": "#F26464",
  "--hc-ring": "#12B6A4",
};

export function cmsVars(theme: Theme): CSSProperties {
  const t = theme === "dark" ? DARK : LIGHT;
  const sh = SHADOW[theme];
  return {
    ...t,
    "--hc-shadow-sm": sh.sm,
    "--hc-shadow-md": sh.md,
    "--hc-shadow-lg": sh.lg,
    "--hc-shadow-xl": sh.xl,
    colorScheme: theme,
  } as CSSProperties;
}

// Bridge the studio app's legacy CSS variables onto the HUMAIN-UI spec tokens, so
// existing components (e.g. the Create prompt-box) inherit the spec design system
// without being rewritten. Apply alongside cmsVars() on a shared root.
export function legacyAliases(): CSSProperties {
  return {
    "--studio-primary": "var(--hc-primary)",
    "--studio-teal-dark": "var(--hc-primary)",
    "--deep-teal": "var(--hc-primary)",
    "--lime": "var(--hc-accent)",
    "--ink": "var(--hc-fg)",
    "--muted": "var(--hc-fg-muted)",
    "--label": "var(--hc-fg-muted)",
    "--hairline": "var(--hc-border)",
    "--mint-tint": "var(--hc-muted)",
    "--mint-pill": "var(--hc-primary-10)",
    "--surface": "var(--hc-card)",
    "--canvas": "var(--hc-sidebar)",
    "--shadow-card": "var(--hc-shadow-md)",
    "--publish-blue": "var(--hc-info)",
    "--r-card": `${R.x2}px`,
    "--r-input": `${R.lg}px`,
    "--r-pill": `${R.full}px`,
  } as CSSProperties;
}

// App background — spec defines `app-bg` as 3 layered gradients (2 radial tints +
// 1 linear surface) drawn from the HUMAIN palette (teal primary + lime accent).
export function appBg(theme: Theme): string {
  if (theme === "dark")
    return [
      "radial-gradient(60% 120% at 18% 100%, rgba(0,150,136,0.20) 0%, transparent 55%)",
      "radial-gradient(42% 80% at 86% 10%, rgba(194,229,75,0.12) 0%, transparent 55%)",
      "linear-gradient(180deg, #0E1A18 0%, #0A1211 100%)",
    ].join(",");
  return [
    "radial-gradient(60% 120% at 18% 100%, rgba(0,150,136,0.09) 0%, transparent 55%)",
    "radial-gradient(42% 80% at 86% 10%, rgba(194,229,75,0.14) 0%, transparent 55%)",
    "linear-gradient(180deg, #EAF4F2 0%, #FFFFFF 22%)",
  ].join(",");
}
