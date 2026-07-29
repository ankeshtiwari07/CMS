import GovernanceStudio from "@/components/studio/governance-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand Governance · HUMAIN" };

export default async function GovernancePage() {
  return (
    <ConsoleFrame label="Brand Governance">
            <GovernanceStudio />
    </ConsoleFrame>
  );
}
