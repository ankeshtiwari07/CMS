import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";

/**
 * Auth gate only. Each surface renders the shell itself via ConsoleFrame so
 * AppShell.Root directly parents its panels — see console-route-shell.tsx.
 */
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUser())) redirect("/login");
  return <>{children}</>;
}
