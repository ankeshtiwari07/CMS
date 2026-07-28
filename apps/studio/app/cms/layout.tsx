import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";

/**
 * Auth gate only — the shell lives in the pages. See
 * components/studio/console-frame.tsx for why.
 */
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUser())) redirect("/login");
  return <>{children}</>;
}
