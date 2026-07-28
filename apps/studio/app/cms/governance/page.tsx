import { CmsPanel } from "@/components/cms/cms-app-shell";
import GovernanceStudio from "@/components/studio/governance-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand Governance · HUMAIN" };

export default async function GovernancePage() {
  return (
    <CmsPanel label="Brand Governance">
      <GovernanceStudio />
    </CmsPanel>
  );
}
