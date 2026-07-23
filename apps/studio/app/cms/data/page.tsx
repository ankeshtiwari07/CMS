import { CmsPanel } from "@/components/cms/cms-app-shell";
import DataStudio from "@/components/studio/data-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const { collection } = await searchParams;
  return (
    <CmsPanel label="Data">
      <DataStudio initialCollection={collection ?? null} />
    </CmsPanel>
  );
}
