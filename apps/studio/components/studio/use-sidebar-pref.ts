"use client";
import { useEffect, useState } from "react";

/** Same key and same values the old hand-rolled sidebar used, so an existing
    user's collapse preference carries across the AppShell migration. */
const SIDEBAR_KEY = "humain-sidebar";

/**
 * Collapse state for the console sidebar, shared by BOTH shells.
 *
 * `SidebarProvider` has no persistence of its own — it takes `defaultOpen` or a
 * controlled `open`/`onOpenChange` pair, so the app owns the storage. It also
 * means an *uncontrolled* provider picks its own default, which is exactly how
 * /studio ended up expanded while /cms sat on the icon rail even after both
 * moved onto the same AppSidebar. One hook, one key, one state.
 *
 * Reading localStorage during render would desync the SSR markup from the
 * client, so the first paint is expanded and the stored preference applies on
 * mount — the same one-frame behaviour the old sidebar had.
 */
export function useSidebarPref() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(SIDEBAR_KEY) !== "collapsed");
    } catch { /* ignore */ }
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "expanded" : "collapsed");
    } catch { /* ignore */ }
  }

  return { open, onOpenChange };
}
