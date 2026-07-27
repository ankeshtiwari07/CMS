import { CmsCardPanel } from "@/components/cms/cms-app-shell";
import Launcher from "@/components/cms/launcher";

export const metadata = { title: "Content Management · HUMAIN" };
export const dynamic = "force-dynamic";

// The bespoke 60px TopBar and the full-page gradient canvas are gone: chrome is
// now the @humain/ui AppShell in app/cms/layout.tsx, and AppShell.Root supplies
// the app background itself. Auth also moved to the layout.
export default async function CmsPage() {
  // Title + supporting text belong to the card header, not the body — the
  // package's panel contract is explicit that AppShellCard.Title is used once
  // and never repeated inside the body.
  return (
    <CmsCardPanel
      label="Overview"
      title="Content Management"
      subtitle="Choose a content type to create and manage."
    >
      <Launcher />
    </CmsCardPanel>
  );
}
