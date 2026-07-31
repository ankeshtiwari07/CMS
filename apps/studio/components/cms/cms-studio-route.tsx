"use client";
import ConsoleShell from "@/components/studio/console-shell";
import {
  CmsWorkspaceProvider,
  CmsAgentPanel,
  CmsPreviewPanel,
} from "@/components/cms/cms-workspace";
import type { Tier } from "@/components/cms/cms-preview";
import type { ShellUser } from "@/components/studio/sidebar-account-menu";

/* =============================================================================
   /cms/studio — the one route that does not go through ConsoleRouteShell.

   Its two panels share a single conversation: the transcript on the left and the
   artifact it produces on the right are the same session. So the state has to
   live ABOVE the shell, with the panels as direct children of AppShell.Root
   underneath it, or Root cannot discover them.

   This is the 35/65 chat-and-main split from
   4-templates-appshell--resizable-chat-and-main, which is the shape this surface
   actually is — unlike the copilot dock, whose second panel is a collapsible
   rail and is sized from its open state instead.
   ============================================================================= */

export default function CmsStudioRoute({
  user,
  initialSidebarOpen,
  canEdit,
  canPublish,
  tier,
}: {
  user: ShellUser;
  initialSidebarOpen: boolean;
  canEdit: boolean;
  canPublish: boolean;
  tier: Tier;
}) {
  return (
    <CmsWorkspaceProvider
      user={{ name: user.name, email: user.email ?? "", roles: user.roles }}
      canEdit={canEdit}
      canPublish={canPublish}
      tier={tier}
    >
      <ConsoleShell user={user} initialSidebarOpen={initialSidebarOpen} initialPanelSizes={[35, 65]} resizable>
        <CmsAgentPanel />
        <CmsPreviewPanel />
      </ConsoleShell>
    </CmsWorkspaceProvider>
  );
}
