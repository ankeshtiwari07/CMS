/**
 * Sidebar collapse cookie name — deliberately in a NON-client module.
 *
 * This constant lives here, not in components/studio/use-sidebar-pref.ts,
 * because that file is "use client". Next.js turns a client module into a client
 * reference when a server component imports from it, and a non-component named
 * export read across that boundary can come back undefined. The server layouts
 * were calling cookies().get(undefined), which silently returned nothing — so
 * the preference was written correctly and never read back.
 */
export const SIDEBAR_KEY = "humain-sidebar";
