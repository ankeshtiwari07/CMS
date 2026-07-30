import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/payload";
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
import { DOCK_KEY } from "@/lib/dock-pref";
import ConsoleRouteShell from "@/components/studio/console-route-shell";
import type { CopilotSurface } from "@/components/cms/cms-copilot";

/**
 * Server half of a console route's chrome: auth gate, plus the sidebar preference
 * read from a cookie so SSR emits the right collapse state and there is no flash.
 *
 * It renders no panels itself — see cms-route-shell.tsx for why they have to be
 * created client-side.
 */
export default async function ConsoleFrame({
  label,
  surface,
  variant,
  children,
}: {
  label?: string;
  variant?: "cms" | "studio";
  surface?: CopilotSurface;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jar = await cookies();
  const sidebarOpen = jar.get(SIDEBAR_KEY)?.value === "expanded";
  const dockOpen = jar.get(DOCK_KEY)?.value === "open";
  return (
    <ConsoleRouteShell
      user={{ name: user.name, email: user.email, roles: user.roles }}
      initialSidebarOpen={sidebarOpen}
      label={label}
      surface={surface}
      variant={variant}
      initialDockOpen={dockOpen}
    >
      {children}
    </ConsoleRouteShell>
  );
}
