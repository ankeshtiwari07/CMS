import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import CmsAppShell from "@/components/cms/cms-app-shell";

/**
 * Shared chrome for every /cms route.
 *
 * Previously each page imported the hand-rolled studio Sidebar and wrapped
 * itself in a bespoke <main>. The shell now lives here, built on the
 * @humain/ui AppShell recipe, so all CMS surfaces share the exact package
 * layout and pages only supply their panel content.
 */
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <CmsAppShell user={{ name: user.name, email: user.email, roles: user.roles }}>
      {children}
    </CmsAppShell>
  );
}
