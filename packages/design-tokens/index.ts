/* =============================================================================
   HUMAIN design tokens — TypeScript view over the real Foundation tokens.
   -----------------------------------------------------------------------------
   Source of truth is `@humain/ui/styles.css` (the published `@humain/ui`
   design system, generated from humain-os.tokens.json). Consumers must have that
   stylesheet loaded — apps import it in their root layout, ahead of globals.css.

   Colour values here are deliberately `var(--token)` references, NOT hex. That
   is the whole point: they resolve at runtime, so they stay correct in light and
   dark and can never drift from the design system the way the previous
   hard-coded palette did.

   Numeric scales (space, radius) mirror Foundation's --spacing-* / --border-radius-*
   because they are consumed as numbers in inline styles.
   ============================================================================= */

/** HUMAIN brand ramps. `air` is the teal, `oasis` is the lime. */
export const brand = {
  air: {
    50: "var(--air-50)",
    100: "var(--air-100)",
    200: "var(--air-200)",
    300: "var(--air-300)",
    400: "var(--air-400)",
    500: "var(--air-500)",
    600: "var(--air-600)",
    700: "var(--air-700)",
    800: "var(--air-800)",
    900: "var(--air-900)",
    950: "var(--air-950)",
  },
  oasis: {
    50: "var(--oasis-50)",
    100: "var(--oasis-100)",
    200: "var(--oasis-200)",
    300: "var(--oasis-300)",
    400: "var(--oasis-400)",
    500: "var(--oasis-500)",
    600: "var(--oasis-600)",
    700: "var(--oasis-700)",
    800: "var(--oasis-800)",
    900: "var(--oasis-900)",
    950: "var(--oasis-950)",
  },
} as const;

/** Semantic tokens — these flip automatically between light and dark. */
export const semantic = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  popover: "var(--popover)",
  primary: "var(--primary)",
  primaryHover: "var(--primary-hover)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  destructive: "var(--destructive)",
  surface: {
    0: "var(--surface-0)",
    1: "var(--surface-1)",
    2: "var(--surface-2)",
    3: "var(--surface-3)",
    elevated: "var(--surface-elevated)",
  },
  /* Text ramp. Deliberately NOT Foundation's --text-primary/secondary/… — those
     are declared only in :root and never flip, so they render black-on-black in
     dark mode. The *-foreground family carries the same intent and does flip. */
  text: {
    primary: "var(--foreground)",
    secondary: "var(--secondary-foreground)",
    tertiary: "var(--muted-foreground)",
    quaternary: "var(--muted-foreground)",
  },
} as const;

/* -----------------------------------------------------------------------------
   Legacy surface groupings. Kept so existing call sites compile unchanged, but
   every value now points at Foundation instead of an invented hex.
   ----------------------------------------------------------------------------- */

export const cms = {
  bg: { ink: semantic.background, deepTeal: brand.air[800] },
  accent: { teal: semantic.primary, lime: brand.oasis[400], limeDark: brand.oasis[600] },
  action: { publish: brand.air[900] },
  card: { mint: brand.air[100] },
  surface: { white: semantic.card },
  text: { label: semantic.text.secondary, muted: "var(--muted-foreground)" },
} as const;

export const studio = {
  accent: { teal: semantic.primary, tealDark: semantic.primaryHover },
  mint: { tint: "var(--brand-tint)", light: "var(--brand-pill)" },
  surface: { white: semantic.card },
  text: { ink: semantic.foreground, muted: "var(--muted-foreground)" },
  line: { hairline: semantic.border },
} as const;

export const shared = {
  /* Foundation --border-radius-*: xs 2 · sm 4 · md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24 · full */
  radius: { input: 8, card: 16, pill: 9999 },
  /* Foundation --spacing-*: 1 → 4px, 2 → 8px, … */
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  font: {
    ui: "var(--font-ui)",
    arabic: "var(--font-ar)",
    mono: "var(--font-mono)",
  },
  elevation: { card: "var(--shadow-card)" },
} as const;

/* -----------------------------------------------------------------------------
   Isolated documents.

   Anything rendered into an `<iframe srcDoc>` or written out as a standalone
   .html export is a SEPARATE document: it does not inherit the host page's
   custom properties, so `var(--primary)` inside such a string resolves to
   nothing. Those strings therefore need the values inlined.

   This is the one sanctioned place where Foundation hexes are literal. Keep it
   in sync with `@humain/ui/styles.css`; components must import this
   rather than re-typing brand hexes of their own.
   ----------------------------------------------------------------------------- */

/** `:root` declarations to prepend to any self-contained document's <style>. */
export const standaloneDocCss = `:root{
--primary:#009688;--primary-hover:#00796b;--primary-foreground:#ffffff;
--lime:#b8e636;--on-brand-ink:#001f1c;
--background:#ffffff;--foreground:#0b1416;--card:#ffffff;
--soft-bg:#f6faf9;--hairline:#e7efed;--text-muted:#54636a;
}` as const;

export const tokens = { brand, semantic, cms, studio, shared };
export default tokens;
