import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
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
  return (
    <ConsoleShell user={{ name: user.name, email: user.email, roles: user.roles }}>
      {children}
    </ConsoleShell>
  );
}
