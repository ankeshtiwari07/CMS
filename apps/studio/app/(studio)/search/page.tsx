import { StudioPageCard } from "@/components/studio/studio-app-shell";
import SearchClient from "@/components/search/search-client";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Search · HUMAIN" };
export const dynamic = "force-dynamic";

// Chrome and the auth redirect live in the route-group layout; this page needed
// the user only to feed the old sidebar, so the fetch is gone entirely.
export default async function SearchPage() {
  return (
    <ConsoleFrame label="Search" variant="studio">
    <StudioPageCard padding="56px 40px">
      <h1 style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: "var(--ink)", margin: "0 0 28px" }}>
        Search
      </h1>
      <SearchClient />
    </StudioPageCard>
    </ConsoleFrame>
  );
}
