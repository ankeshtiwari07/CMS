import ConsoleFrame from "@/components/studio/console-frame";
import ContentStudio from "@/components/studio/content-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Studio · HUMAIN" };

/**
 * EXPERIMENT — this route only.
 *
 * The shell renders here via a SERVER frame instead of the layout, so its two
 * panels are the frame's own JSX children rather than a router element. With the
 * __appShellType markers now on CmsPanel and CmsCopilot, this is the cheap
 * version of the fix: if AppShell.Root discovers the pair, the drag handle
 * appears on /cms/content and the rollout is one wrapper element per page.
 *
 * If it does NOT appear, only a fully client-side route works (cms/dam-route.tsx
 * is the proven one) and every route needs a client module instead. Every other
 * route still uses the layout shell until this is answered.
 */
export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <ConsoleFrame label="Content Studio" surface="content">
            <ContentStudio projectId={id ?? null} />
    </ConsoleFrame>
  );
}
