import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
import ConsoleShell from "@/components/studio/console-shell";

/* =============================================================================
   Server frame that renders the console shell from inside a page.

   Purpose: AppShell.Root discovers panels via React.Children.forEach + a static
   __appShellType marker on the child's component type. Through a Next LAYOUT the
   children arrive as a router element, so Root sees one opaque child and every
   two-panel behaviour stays switched off.

   An earlier version of this frame did not help — but that was before the panel
   wrappers carried the marker, so nothing could have been discovered either way.
   With the markers in place the question is open again, and it matters: if a
   SERVER frame is enough, the rollout is one wrapper element per page. If only a
   fully client-side route works (see cms/dam-route.tsx), every route needs a
   client module instead.

   Applied to ONE route first, deliberately.
   ============================================================================= */

export default async function ConsoleFrame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sidebarOpen = (await cookies()).get(SIDEBAR_KEY)?.value === "expanded";
  return (
    <ConsoleShell
      user={{ name: user.name, email: user.email, roles: user.roles }}
      initialSidebarOpen={sidebarOpen}
    >
      {children}
    </ConsoleShell>
  );
}
