import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import AdminFrame from "@/components/cms/admin-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Admin · HUMAIN" };

// Derive a friendly title from the Payload path (collections/blogPosts -> Blog Posts).
function titleFor(slug: string[] | undefined): string {
  if (!slug?.length) return "Dashboard";
  const last = slug[slug.length - 1];
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// The full Payload CMS surface, embedded in HUMAIN and gated to admins only.
export default async function CmsAdminPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(user.roles ?? []).includes("admin")) redirect("/cms/studio"); // admin-only

  const { slug } = await params;
  const src = "/admin" + (slug?.length ? "/" + slug.join("/") : "");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="cms" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <AdminFrame src={src} title={titleFor(slug)} />
      </main>
    </div>
  );
}
