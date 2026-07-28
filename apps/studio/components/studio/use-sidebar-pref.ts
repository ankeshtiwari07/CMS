"use client";
import { useState } from "react";

// Same key the old sidebar used, so an existing preference carries over. It is
// defined in a non-client module because the server layouts read it too — see
// lib/sidebar-pref.ts.
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
export { SIDEBAR_KEY };

/**
 * Collapse state for the console sidebar, shared by both halves of the console.
 *
 * Stored in a COOKIE, not localStorage. localStorage is only readable on the
 * client, so the preference could only be applied in an effect — first paint was
 * always the default and the real state arrived a frame later. In a layout that
 * flicker happened once per session; with the shell rendered per route it would
 * happen on every navigation. A cookie is readable on the server, so SSR emits
 * the correct state and there is no flash at all.
 *
 * `SidebarProvider` has no persistence of its own — it takes `defaultOpen` or a
 * controlled `open`/`onOpenChange` pair, so the app owns the storage. An
 * uncontrolled provider picks its own default, which is how /studio ended up
 * expanded while /cms sat on the icon rail.
 *
 * DEFAULT IS COLLAPSED, matching every AppShell story (defaultOpen={false}).
 */
export function useSidebarPref(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);

  function onOpenChange(next: boolean) {
    setOpen(next);
    try {
      // One year, root path, lax — this is a UI preference, not a credential.
      document.cookie = `${SIDEBAR_KEY}=${next ? "expanded" : "collapsed"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch { /* ignore */ }
  }

  return { open, onOpenChange };
}
