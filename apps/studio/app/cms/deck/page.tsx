import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/payload";
import DeckStudio from "@/components/studio/deck-studio";
import { HumainMark } from "@/components/brand";
import { PlusIcon, FolderIcon, GridIcon, PaletteIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deck Studio · HUMAIN" };

// Focused Deck experience (matches the Figma): a minimal icon-only rail + the
// two-pane agentic canvas — not the full labeled sidebar.
export default async function DeckStudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await searchParams;
  const initial = ((user.name || user.email || "U").trim()[0] || "U").toUpperCase();

  const rail: React.CSSProperties = { width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center", color: "var(--text-muted)" };
  const railActive: React.CSSProperties = { ...rail, background: "color-mix(in srgb, var(--success) 12%, var(--background))", color: "var(--primary)" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--shell-bg)" }}>
      <nav style={{ width: 68, flexShrink: 0, background: "var(--card)", borderInlineEnd: "1px solid var(--hairline)", display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0", gap: 8 }}>
        <Link href="/studio" title="Home" style={{ marginBottom: 14, display: "grid", placeItems: "center" }}><HumainMark /></Link>
        <Link href="/cms/deck" title="New" style={railActive}><PlusIcon size={19} /></Link>
        <Link href="/projects" title="Projects" style={rail}><FolderIcon size={19} /></Link>
        <Link href="/cms" title="Templates" style={rail}><GridIcon size={19} /></Link>
        <Link href="/design" title="Design" style={rail}><PaletteIcon size={19} /></Link>
        <div style={{ marginTop: "auto", width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,var(--oasis-300),var(--air-500))", color: "var(--on-brand-ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>{initial}</div>
      </nav>
      <main style={{ flex: 1, padding: "10px 10px 10px 0", minWidth: 0 }}>
        <DeckStudio deckId={id ?? null} userName={user.name || user.email || ""} />
      </main>
    </div>
  );
}
