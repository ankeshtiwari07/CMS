import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import DeckStudio from "@/components/studio/deck-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deck Studio · HUMAIN" };

// Gamma-style presentation generator: prompt -> outline -> editable slides ->
// present / export. Open to any signed-in editor.
export default async function DeckStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await searchParams;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="cms" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <DeckStudio deckId={id ?? null} />
      </main>
    </div>
  );
}
