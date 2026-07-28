import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/payload";
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
import ConsoleShell from "@/components/studio/console-shell";

/**
 * Every /cms route, on the same console shell as Create Studio. Pages, Data and
 * Governance live under the CMS row's own sub-navigation rather than the top
 * level, so the section owns its own structure.
 */
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Read the collapse preference server-side so SSR paints the right state.
  const sidebarOpen = (await cookies()).get(SIDEBAR_KEY)?.value === "expanded";
  return (
    <ConsoleShell user={{ name: user.name, email: user.email, roles: user.roles }} initialSidebarOpen={sidebarOpen}>
      {children}
    </ConsoleShell>
  );
}
