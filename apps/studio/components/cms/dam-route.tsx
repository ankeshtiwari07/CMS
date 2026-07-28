"use client";
import ConsoleShell from "@/components/studio/console-shell";
import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import DamStudio from "@/components/studio/dam-studio";
import type { ShellUser } from "@/components/studio/sidebar-account-menu";

/* =============================================================================
   EXPERIMENT — /cms/dam only.

   The probe showed AppShell's resizable handle and mobile tab bar never engage,
   because both are gated on Root discovering exactly two AppShell.Panel children
   via React.Children.forEach. Moving the shell out of the Next layout did not
   help, which suggests the remaining blocker is the SERVER -> CLIENT boundary:
   JSX children created in a server component and passed into a client component
   cross the RSC boundary as serialized references, so `child.type === Panel`
   fails there too.

   This component tests that directly. Everything — ConsoleShell and both panels
   — is constructed inside ONE client module, so the element identities are the
   client bundle's own. If the drag handle appears on /cms/dam and nowhere else,
   the hypothesis is confirmed and the fix is a thin client wrapper per route.
   If it does not appear, the cause is something else and no more routes should
   be changed until it is found.
   ============================================================================= */

export default function DamRoute({ user }: { user: ShellUser }) {
  return (
    <ConsoleShell user={user}>
      <CmsPanel label="Asset Library">
        <DamStudio />
      </CmsPanel>
      <CmsCopilot surface="dam" />
    </ConsoleShell>
  );
}
