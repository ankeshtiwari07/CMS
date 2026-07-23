import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import GovernanceStudio from "@/components/studio/governance-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand Governance · HUMAIN" };

export default async function GovernancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--shell-bg)" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="governance" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <GovernanceStudio />
      </main>
    </div>
  );
}
