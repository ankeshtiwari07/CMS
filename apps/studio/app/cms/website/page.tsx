import ConsoleFrame from "@/components/studio/console-frame";
import WebsiteStudio from "@/components/studio/website-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Studio · HUMAIN" };

export default async function WebsiteStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <ConsoleFrame label="Website Studio" surface="website">
            <WebsiteStudio siteId={id ?? null} />
    </ConsoleFrame>
  );
}
