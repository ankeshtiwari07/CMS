import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/payload";
import { CmsPanel } from "@/components/cms/cms-app-shell";
import ContentManager from "@/components/cms/content-manager";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Content Management · HUMAIN" };
export const dynamic = "force-dynamic";

// Chrome now comes from app/cms/layout.tsx (the @humain/ui AppShell), replacing
// the bespoke TopBar + gradient canvas this page used to draw. The role flags
// are still read here because ContentManager gates editing and publishing on
// them — behaviour is unchanged.
export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { type } = await searchParams;
  const canEdit = hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"]);
  const canPublish = hasRole(user, ["publisher", "siteAdmin", "admin"]);
  return (
    <ConsoleFrame>
      <CmsPanel label="Content Management">
        <ContentManager initialType={type || "blog"} canEdit={canEdit} canPublish={canPublish} />
      </CmsPanel>
    </ConsoleFrame>
  );
}
