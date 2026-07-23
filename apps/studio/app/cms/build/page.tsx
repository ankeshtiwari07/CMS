import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import { CmsPanel } from "@/components/cms/cms-app-shell";
import ComponentStudio from "@/components/cms/component-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Component Studio · HUMAIN" };

// Drag-and-drop page builder + AI component generation, inside the CMS section.
// Admin-only (component curation is an admin function) — the layout only checks
// that you are signed in, so this page keeps its own role gate.
export default async function CmsBuildPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(user.roles ?? []).includes("admin")) redirect("/cms/studio");
  const canPublish = (user.roles ?? []).some((r) => ["publisher", "siteAdmin", "admin"].includes(r));
  return (
    <CmsPanel label="Component Studio">
      <ComponentStudio user={{ name: user.name, email: user.email, roles: user.roles }} canPublish={canPublish} />
    </CmsPanel>
  );
}
