import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import ConsoleFrame from "@/components/studio/console-frame";
import WebsiteStudio from "@/components/studio/website-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Studio · HUMAIN" };

export default async function WebsiteStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <ConsoleFrame>
      <CmsPanel label="Website Studio">
        <WebsiteStudio siteId={id ?? null} />
      </CmsPanel>
      <CmsCopilot surface="website" />
    </ConsoleFrame>
  );
}
