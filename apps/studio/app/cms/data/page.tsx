import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import DataStudio from "@/components/studio/data-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { collection } = await searchParams;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="data" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <DataStudio initialCollection={collection ?? null} />
      </main>
    </div>
  );
}
