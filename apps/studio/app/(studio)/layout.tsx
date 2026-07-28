import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";

/**
 * Auth gate only. The console shell moved INTO the pages
 * (components/studio/console-frame.tsx) so AppShell.Root directly parents the
 * panels — see that file for why the layout cannot host it.
 */
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUser())) redirect("/login");
  return <>{children}</>;
}
