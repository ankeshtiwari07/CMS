import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
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
  return (
    <ConsoleShell user={{ name: user.name, email: user.email, roles: user.roles }}>
      {children}
    </ConsoleShell>
  );
}
