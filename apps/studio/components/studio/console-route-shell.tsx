"use client";
import { useState } from "react";
import ConsoleShell from "@/components/studio/console-shell";
import { CmsPanel } from "@/components/cms/cms-app-shell";
import { StudioPanel } from "@/components/studio/studio-app-shell";
import CmsCopilot, { type CopilotSurface } from "@/components/cms/cms-copilot";
import type { ShellUser } from "@/components/studio/sidebar-account-menu";
import { DOCK_KEY } from "@/lib/dock-pref";

/* =============================================================================
   The console shell for every route, in both halves of the console.

   AppShell.Root finds its panels with React.Children.forEach, matching the
   static `__appShellType` marker on each child's type. That match only works on
   element identities from the CLIENT bundle: when a server component creates
   <CmsPanel>, the child arrives across the RSC boundary as a client *reference*
   and the marker is never seen, so Root counts zero panels and drops its
   layout — no width/flex handling, no expand control, no mobile tab bar.

   Measured, not assumed: /cms/dam (built entirely in one client module) reported
   data-panel=2, while the same markup routed through a server frame reported 0
   on every other surface.

   The fix does NOT need a client module per route. Only the PANEL ELEMENTS need
   client identity — their contents are opaque to the discovery walk. So this one
   module creates the panels, and each page passes its studio through as
   children, which may cross the boundary freely.
   ============================================================================= */

export default function ConsoleRouteShell({
  user,
  initialSidebarOpen,
  label,
  surface,
  variant = "cms",
  initialDockOpen = false,
  children,
}: {
  user: ShellUser;
  initialSidebarOpen: boolean;
  /** Omit to render children straight into the shell (a surface that supplies
      its own panels, e.g. the CmsWorkspace pair). */
  label?: string;
  /** Which panel wrapper to use — the two halves of the console style theirs
      differently (the CMS one carries the section nav). */
  variant?: "cms" | "studio";
  initialDockOpen?: boolean;
  /** Omit on surfaces that have no docked copilot — Root wants at most 2 panels. */
  surface?: CopilotSurface;
  children: React.ReactNode;
}) {
  const [dockOpen, setDockOpen] = useState(initialDockOpen);

  function toggleDock(next: boolean) {
    setDockOpen(next);
    try {
      document.cookie = `${DOCK_KEY}=${next ? "open" : "closed"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch { /* ignore */ }
  }

  // The split follows the dock. Closed, the second panel is a 56px rail, so the
  // main panel takes essentially everything and there is no pair to drag; open,
  // 380px of 1440 is ~26%, and the drag handle becomes meaningful.
  const panelSizes: [number, number] = surface && dockOpen ? [74, 26] : [96, 4];

  return (
    <ConsoleShell
      user={user}
      initialSidebarOpen={initialSidebarOpen}
      initialPanelSizes={panelSizes}
      resizable={Boolean(surface) && dockOpen}
    >
      {!label ? children : variant === "studio"
        ? <StudioPanel label={label}>{children}</StudioPanel>
        : <CmsPanel label={label}>{children}</CmsPanel>}
      {surface ? <CmsCopilot surface={surface} open={dockOpen} onOpenChange={toggleDock} /> : null}
    </ConsoleShell>
  );
}
