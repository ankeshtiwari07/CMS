import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import ConsoleFrame from "@/components/studio/console-frame";
import DataStudio from "@/components/studio/data-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const { collection } = await searchParams;
  return (
    <ConsoleFrame>
      <CmsPanel label="Data">
        <DataStudio initialCollection={collection ?? null} />
      </CmsPanel>
      <CmsCopilot surface="data" />
    </ConsoleFrame>
  );
}
