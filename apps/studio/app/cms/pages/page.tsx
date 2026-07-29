import PageStudio from "@/components/studio/page-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages & Blogs · HUMAIN" };

export default async function PagesStudioPage() {
  return (
    <ConsoleFrame label="Pages">
            <PageStudio />
    </ConsoleFrame>
  );
}
