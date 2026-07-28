import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import ConsoleShell from "@/components/studio/console-shell";

/* =============================================================================
   Server wrapper that puts the console shell INSIDE each page.

   Why not in the layout, which is the obvious place: AppShell.Root discovers its
   panels with React.Children.forEach. A Next.js layout receives `children` as a
   router element, not as the page's own JSX, so across that boundary the Root
   sees ONE opaque child instead of two AppShell.Panels. Everything gated on
   `panels.length === 2` therefore never engages — the resizable drag handle,
   root-owned expansion, and the mobile tab bar that every Panel's `label` prop
   feeds. The panels still render as flex siblings, which is why the layout
   version looked correct and measured correct while quietly having none of it.

   Rendering the shell here, from the page, keeps Root as the direct parent of
   the panels and the package's own machinery works as designed.

   The trade, stated plainly: Next layouts persist across navigation and pages do
   not, so the sidebar remounts on every route change and re-runs its chat and
   notification fetches. That is the cost of the package's composition model.

   Auth stays in the route-group layouts; this only narrows the user for the
   shell's props.
   ============================================================================= */

export default async function ConsoleFrame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <ConsoleShell user={{ name: user.name, email: user.email, roles: user.roles }}>
      {children}
    </ConsoleShell>
  );
}
