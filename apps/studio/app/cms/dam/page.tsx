import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import DamStudio from "@/components/studio/dam-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asset Library · HUMAIN" };

// Sibling panels as an array — see app/cms/content/page.tsx for why not a fragment.
export default async function DamPage() {
  return [
    <CmsPanel key="main" label="Asset Library">
      <DamStudio />
    </CmsPanel>,
    <CmsCopilot key="copilot" surface="dam" />,
  ];
}
