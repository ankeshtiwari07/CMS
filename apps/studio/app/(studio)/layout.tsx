import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import StudioAppShell from "@/components/studio/studio-app-shell";

/**
 * Shared chrome for every Create Studio route — /studio, /design, /projects,
 * /search, /brand, /review and /settings.
 *
 * A route group, so the URLs are unchanged. Previously each of those seven
 * surfaces imported the hand-rolled studio sidebar and wrapped itself in its own
 * `display:flex; minHeight:100vh` shell, which is why /studio and /cms could
 * drift apart. The shell now lives here, built on the @humain/ui AppShell recipe
 * exactly as app/cms/layout.tsx does, and pages supply only their panel content.
 *
 * Auth moves up here too: every one of those pages was calling getCurrentUser()
 * and redirecting on its own.
 */
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <StudioAppShell user={{ name: user.name, email: user.email, roles: user.roles }}>
      {children}
    </StudioAppShell>
  );
}
