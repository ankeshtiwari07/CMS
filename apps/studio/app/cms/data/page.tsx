import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import DataStudio from "@/components/studio/data-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

// Sibling panels as an array — see app/cms/content/page.tsx for why not a fragment.
export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const { collection } = await searchParams;
  return [
    <CmsPanel key="main" label="Data">
      <DataStudio initialCollection={collection ?? null} />
    </CmsPanel>,
    <CmsCopilot key="copilot" surface="data" />,
  ];
}
