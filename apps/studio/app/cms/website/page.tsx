import { CmsPanel } from "@/components/cms/cms-app-shell";
import WebsiteStudio from "@/components/studio/website-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Studio · HUMAIN" };

export default async function WebsiteStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <CmsPanel label="Website Studio">
      <WebsiteStudio siteId={id ?? null} />
    </CmsPanel>
  );
}
