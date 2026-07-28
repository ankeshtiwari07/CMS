import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import WebsiteStudio from "@/components/studio/website-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Studio · HUMAIN" };

// Sibling panels as an array — see app/cms/content/page.tsx for why not a fragment.
export default async function WebsiteStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return [
    <CmsPanel key="main" label="Website Studio">
      <WebsiteStudio siteId={id ?? null} />
    </CmsPanel>,
    <CmsCopilot key="copilot" surface="website" />,
  ];
}
