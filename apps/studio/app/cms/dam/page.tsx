import { CmsPanel } from "@/components/cms/cms-app-shell";
import DamStudio from "@/components/studio/dam-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asset Library · HUMAIN" };

export default async function DamPage() {
  return (
    <CmsPanel label="Asset Library">
      <DamStudio />
    </CmsPanel>
  );
}
