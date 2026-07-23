import { CmsPanel } from "@/components/cms/cms-app-shell";
import PageStudio from "@/components/studio/page-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages & Blogs · HUMAIN" };

export default async function PagesStudioPage() {
  return (
    <CmsPanel label="Pages">
      <PageStudio />
    </CmsPanel>
  );
}
