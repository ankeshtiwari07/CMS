/* =============================================================================
   Theme contract
   -----------------------------------------------------------------------------
   Two keys, two owners — deliberately.

   `humain-theme` (PREF_KEY) is the USER'S CHOICE and is tri-state:
   light | dark | system. It is the app's own concept; Foundation has no
   equivalent. It drives the toggle UI and is recorded on `data-theme`.

   `humain-theme-resolved` (RESOLVED_KEY) is the RESOLVED light|dark that
   Foundation's ThemeProvider owns. ThemeProvider only understands light|dark —
   handing it PREF_KEY directly would make it read "system" as invalid, fall
   back to `light`, strip the `.dark` class, and overwrite the user's choice.

   So: the app resolves system -> light|dark and feeds ThemeProvider the answer.
   ThemeProvider remains the single writer of the `light`/`dark` classes, which
   is what actually flips the Foundation tokens.
   ============================================================================= */

export const PREF_KEY = "humain-theme";
export const RESOLVED_KEY = "humain-theme-resolved";
/** Fired on the window when the user picks a mode, so ThemeSync can react in-tab.
    (A same-tab localStorage write does NOT fire a `storage` event.) */
export const THEME_EVENT = "humain:theme";

export type Mode = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

export function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveMode(mode: Mode): Resolved {
  if (mode === "system") return prefersDark() ? "dark" : "light";
  return mode;
}

export function readPref(): Mode {
  try {
    const v = localStorage.getItem(PREF_KEY) as Mode | null;
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

/**
 * Pre-paint script. Runs in <head> before React hydrates, and must do three
 * things or the first frame is wrong:
 *   1. record the tri-state choice on `data-theme` (toggle UI reads it),
 *   2. apply the resolved `light`/`dark` class (Foundation tokens flip on it),
 *   3. seed RESOLVED_KEY so ThemeProvider's first client render agrees with the
 *      DOM we just set — otherwise it defaults to `light` and yanks `.dark` off
 *      a system-dark user on mount.
 * It also re-applies the user's custom brand colours from the theme builder,
 * which ThemeProvider knows nothing about (it handles light/dark only).
 */
export function themeInitScript(): string {
  return `(function(){var d=document.documentElement;function apply(t){d.setAttribute('data-theme',t);var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.remove('light','dark');d.classList.add(dark?'dark':'light');try{localStorage.setItem('${RESOLVED_KEY}',dark?'dark':'light')}catch(e){}}try{var t=localStorage.getItem('${PREF_KEY}')||'system';apply(t);var mq=window.matchMedia('(prefers-color-scheme: dark)');mq.addEventListener('change',function(){if((localStorage.getItem('${PREF_KEY}')||'system')==='system')apply('system');});var c=localStorage.getItem('humain-theme-colors');if(c){var o=JSON.parse(c),r=d.style,m={'--primary':o.primary,'--primary-hover':o.primaryDark,'--brand-pill':o.accent,'--foreground':o.ink,'--background':o.canvas,'--muted-foreground':o.muted,'--r-card':(o.radius||16)+'px'};for(var k in m){if(m[k])r.setProperty(k,m[k]);}}}catch(e){apply('system');}})();`;
}
