import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/payload";
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
import ConsoleShell from "@/components/studio/console-shell";

/**
 * Create Studio routes — /studio, /design, /projects, /search, /brand, /review
 * and /settings — share the ONE console shell with the CMS.
 *
 * There used to be two shells. They shared components but not composition, which
 * is exactly how the two halves of the console kept drifting apart.
 */
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
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
