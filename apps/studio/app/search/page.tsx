import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Rail from "@/components/studio/rail";
import SearchClient from "@/components/search/search-client";

export const metadata = { title: "Search · HUMAIN" };
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Rail user={{ name: user.name, email: user.email }} />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div
          style={{
            minHeight: "calc(100vh - 20px)",
            borderRadius: 22,
            background: "#fff",
            border: "1px solid var(--hairline)",
            padding: "56px 40px",
          }}
        >
          <h1 style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: "var(--ink)", margin: "0 0 28px" }}>
            Search
          </h1>
          <SearchClient />
        </div>
      </main>
    </div>
  );
}
