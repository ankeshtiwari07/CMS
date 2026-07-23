import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import WebsiteStudio from "@/components/studio/website-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Studio · HUMAIN" };

export default async function WebsiteStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await searchParams;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--shell-bg)" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="cms" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <WebsiteStudio siteId={id ?? null} />
      </main>
    </div>
  );
}
