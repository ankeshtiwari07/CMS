import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import DeckStudio from "@/components/studio/deck-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deck Studio · HUMAIN" };

// This page used to hand-roll its own 68px icon rail. That rail is gone: the
// CMS now uses the @humain/ui AppSidebar for every surface, so Decks sits in
// the same shell as the rest instead of being a one-off.
export default async function DeckStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await searchParams;
  return (
    <ConsoleFrame label="Deck Studio">
            <DeckStudio deckId={id ?? null} userName={user.name || user.email || ""} />
    </ConsoleFrame>
  );
}
