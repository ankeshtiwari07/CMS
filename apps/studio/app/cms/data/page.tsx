import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import DataStudio from "@/components/studio/data-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

// Sibling panels as an array — see app/cms/content/page.tsx for why not a fragment.
export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const { collection } = await searchParams;
  // Both panels are direct children of the shell's AppShell.Root, which is what
  // lets the package own the split: drag handle, expansion and mobile tabs.
  return (
    <ConsoleFrame>
      <CmsPanel key="main" label="Data">
        <DataStudio initialCollection={collection ?? null} />
      </CmsPanel>
      <CmsCopilot surface="data" />
    </ConsoleFrame>
  );
}
