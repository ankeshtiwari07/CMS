// HUMAIN design tokens for the CMS surfaces, resolved from the real design
// system (`@humain/ui/styles.css`, published as @humain/ui) rather than
// re-declared here. The previous version of this file hard-coded a palette
// transcribed from a spec PDF; it had drifted from Foundation (wrong dark
// primary, lime as the UI accent, teal-tinted neutrals, off-palette status
// colours). Everything below is now a var() reference, so it cannot drift and
// it themes automatically — Foundation flips its values under `.dark`.
import type { CSSProperties } from "react";

export type Theme = "light" | "dark";

// Foundation --border-radius-*: xs 2 · sm 4 · default/md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24 · full.
export const R = { sm: 4, base: 6, md: 6, lg: 8, xl: 12, x2: 16, x3: 24, full: 9999 } as const;

// Foundation ships shadows decomposed into offset/blur/spread/colour parts;
// compose them so callers keep a single usable value.
const shadow = (name: string) =>
  `0 var(--shadow-${name}-offset-y) var(--shadow-${name}-blur-radius) ` +
  `var(--shadow-${name}-spread-radius) var(--shadow-${name}-color)`;

export const SHADOW = {
  sm: shadow("sm-1"),
  md: shadow("md-1"),
  lg: shadow("lg-1"),
  xl: shadow("xl-1"),
} as const;

// Foundation --font-size-* / matching line heights.
export const TYPE = {
  sm: { fontSize: "var(--font-size-sm)", lineHeight: "20px" },
  base: { fontSize: "var(--font-size-base)", lineHeight: "22px" },
  lg: { fontSize: "var(--font-size-lg)", lineHeight: "24px" },
} as const;

// The --hc-* namespace kept for existing call sites, mapped onto Foundation.
const VARS: Record<string, string> = {
  "--hc-bg": "var(--background)",
  "--hc-surface-1": "var(--surface-1)",
  "--hc-surface-2": "var(--surface-2)",
  "--hc-fg": "var(--foreground)",
  "--hc-fg-muted": "var(--muted-foreground)",
  "--hc-card": "var(--card)",
  "--hc-popover": "var(--popover)",
  "--hc-muted": "var(--muted)",
  "--hc-border": "var(--border)",
  "--hc-input": "var(--input)",
  "--hc-primary": "var(--primary)",
  "--hc-primary-fg": "var(--primary-foreground)",
  "--hc-primary-10": "var(--brand-pill)",
  // Foundation's --accent is a NEUTRAL surface; the HUMAIN lime is the `oasis`
  // brand ramp and is not the UI accent. Both are exposed, correctly named.
  "--hc-accent": "var(--accent)",
  "--hc-accent-fg": "var(--accent-foreground)",
  "--hc-lime": "var(--oasis-400)",
  "--hc-ghost": "var(--surface-2)",
  "--hc-sidebar": "var(--sidebar)",
  "--hc-sidebar-fg": "var(--sidebar-foreground)",
  "--hc-sidebar-accent": "var(--sidebar-accent)",
  "--hc-success": "var(--success)",
  "--hc-warning": "var(--warning)",
  "--hc-info": "var(--info)",
  "--hc-destructive": "var(--destructive)",
  "--hc-ring": "var(--ring)",
};

export function cmsVars(theme: Theme): CSSProperties {
  return {
    ...VARS,
    "--hc-shadow-sm": SHADOW.sm,
    "--hc-shadow-md": SHADOW.md,
    "--hc-shadow-lg": SHADOW.lg,
    "--hc-shadow-xl": SHADOW.xl,
    // Foundation themes off the `.dark` class on <html>; this only tells the UA
    // which form controls/scrollbars to render.
    colorScheme: theme,
  } as CSSProperties;
}

// Legacy studio variable names, for components not yet migrated. These mirror
// packages/design-tokens/bridge.css so both entry points agree.
export function legacyAliases(): CSSProperties {
  return {
    "--studio-primary": "var(--primary)",
    "--studio-teal-dark": "var(--primary-hover)",
    "--deep-teal": "var(--air-800)",
    "--lime": "var(--oasis-400)",
    "--ink": "var(--foreground)",
    "--text-muted": "var(--muted-foreground)",
    "--label": "var(--secondary-foreground)",
    "--hairline": "var(--border)",
    "--mint-tint": "var(--brand-tint)",
    "--mint-pill": "var(--brand-pill)",
    "--surface": "var(--card)",
    "--canvas": "var(--background)",
    "--shadow-card": "var(--shadow-card)",
    "--publish-blue": "var(--air-900)",
    "--r-card": `${R.x2}px`,
    "--r-input": `${R.lg}px`,
    "--r-pill": `${R.full}px`,
  } as CSSProperties;
}

// App background: two brand radial tints over the themed surface. Built from
// Foundation vars via color-mix so it is correct in both themes without a
// hard-coded per-theme gradient.
export function appBg(_theme?: Theme): string {
  return [
    "radial-gradient(60% 120% at 18% 100%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 55%)",
    "radial-gradient(42% 80% at 86% 10%, color-mix(in srgb, var(--oasis-400) 12%, transparent) 0%, transparent 55%)",
    "linear-gradient(180deg, var(--surface-1) 0%, var(--background) 22%)",
  ].join(",");
}
