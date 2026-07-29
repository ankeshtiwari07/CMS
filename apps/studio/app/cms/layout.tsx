import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";

/**
 * Auth gate only. Each /cms page renders the shell itself via ConsoleFrame so
 * AppShell.Root is the direct parent of its panels — see console-frame.tsx.
 */
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUser())) redirect("/login");
  return <>{children}</>;
}
