import { CmsPanel } from "@/components/cms/cms-app-shell";
import CmsCopilot from "@/components/cms/cms-copilot";
import ContentStudio from "@/components/studio/content-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Studio · HUMAIN" };

// Chrome (auth, sidebar, shell) lives in app/cms/layout.tsx; this page supplies only its panel.
//
// Returns an ARRAY of sibling panels, not a fragment: AppShell.Root discovers its
// panels with React.Children.forEach, which flattens arrays but sees a fragment
// as one opaque child. The copilot renders its own panel so it owns its width and
// its collapsed rail; it starts closed, so this surface looks unchanged until
// someone opens it.
export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  // Both panels are direct children of the shell's AppShell.Root, which is what
  // lets the package own the split: drag handle, expansion and mobile tabs.
  return (
    <ConsoleFrame>
      <CmsPanel key="main" label="Content Studio">
        <ContentStudio projectId={id ?? null} />
      </CmsPanel>
      <CmsCopilot surface="content" />
    </ConsoleFrame>
  );
}
