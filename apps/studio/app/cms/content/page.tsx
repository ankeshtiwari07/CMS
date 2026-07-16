import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import ContentStudio from "@/components/studio/content-studio";
export const dynamic = "force-dynamic";
export const metadata = { title: "Content Studio · HUMAIN" };
export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await searchParams;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="cms" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <ContentStudio projectId={id ?? null} />
      </main>
    </div>
  );
}
