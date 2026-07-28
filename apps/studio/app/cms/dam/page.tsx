import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import DamStudio from "@/components/studio/dam-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asset Library · HUMAIN" };

// Sibling panels as an array — see app/cms/content/page.tsx for why not a fragment.
export default async function DamPage() {
  // Both panels are direct children of the shell's AppShell.Root, which is what
  // lets the package own the split: drag handle, expansion and mobile tabs.
  return (
    <ConsoleFrame>
      <CmsPanel key="main" label="Asset Library">
        <DamStudio />
      </CmsPanel>
      <CmsCopilot surface="dam" />
    </ConsoleFrame>
  );
}
