import { redirect } from "next/navigation";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { StudioPanel, StudioPageCard } from "@/components/studio/studio-app-shell";
import BrandStudio from "@/components/brand/brand-studio";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Brand Studio · HUMAIN" };
export const dynamic = "force-dynamic";

async function load(userId: string | number) {
  try {
    const arRes = await payloadFetch("/api/brandGuidelines?where[isArchetype][equals]=true&limit=50&depth=0");
    const mineRes = await payloadFetch(`/api/brandGuidelines?where[owner][equals]=${userId}&where[isArchetype][equals]=false&sort=-updatedAt&limit=50&depth=0`);
    const archetypes = arRes.ok ? (await arRes.json()).docs ?? [] : [];
    const mine = mineRes.ok ? (await mineRes.json()).docs ?? [] : [];
    return { archetypes, mine };
  } catch {
    return { archetypes: [], mine: [] };
  }
}

export default async function BrandPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { archetypes, mine } = await load(user.id);

  return (
    <ConsoleFrame>
      <StudioPanel label="Brand">
        <StudioPageCard padding="32px 36px">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>Brand Studio</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 22px" }}>
            Explore the HUMAIN guideline and curated enterprise archetypes, let Claude tailor one to your need, and compose your own by picking the sections you like.
          </p>
          <BrandStudio archetypes={archetypes} mine={mine} />
        </StudioPageCard>
      </StudioPanel>
    </ConsoleFrame>
  );
}
