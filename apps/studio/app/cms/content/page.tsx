import { CmsPanel } from "@/components/cms/cms-app-shell";
import ContentStudio from "@/components/studio/content-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Studio · HUMAIN" };

// Chrome (auth, sidebar, shell) lives in app/cms/layout.tsx; this page supplies only its panel.
export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <CmsPanel label="Content Studio">
      <ContentStudio projectId={id ?? null} />
    </CmsPanel>
  );
}
