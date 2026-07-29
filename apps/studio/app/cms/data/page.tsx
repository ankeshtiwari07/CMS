import ConsoleFrame from "@/components/studio/console-frame";
import DataStudio from "@/components/studio/data-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "CMS Data · HUMAIN" };

export default async function DataPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const { collection } = await searchParams;
  return (
    <ConsoleFrame label="Data" surface="data">
            <DataStudio initialCollection={collection ?? null} />
    </ConsoleFrame>
  );
}
