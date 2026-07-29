"use client";
import ConsoleShell from "@/components/studio/console-shell";
import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot, { type CopilotSurface } from "@/components/cms/cms-copilot";
import type { ShellUser } from "@/components/studio/sidebar-account-menu";

/* =============================================================================
   The console shell for every CMS route.

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

export default function CmsRouteShell({
  user,
  initialSidebarOpen,
  label,
  surface,
  children,
}: {
  user: ShellUser;
  initialSidebarOpen: boolean;
  /** Omit to render children straight into the shell (a surface that supplies
      its own panels, e.g. the CmsWorkspace pair). */
  label?: string;
  /** Omit on surfaces that have no docked copilot — Root wants at most 2 panels. */
  surface?: CopilotSurface;
  children: React.ReactNode;
}) {
  return (
    <ConsoleShell user={user} initialSidebarOpen={initialSidebarOpen}>
      {label ? <CmsPanel label={label}>{children}</CmsPanel> : children}
      {surface ? <CmsCopilot surface={surface} /> : null}
    </ConsoleShell>
  );
}
