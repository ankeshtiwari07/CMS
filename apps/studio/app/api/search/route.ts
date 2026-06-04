import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

// Authoring-side search across content collections. Uses Payload's `like`
// (case-insensitive contains) on each collection's title field. The OpenSearch
// + pgvector hybrid index (apps/ai-service workers) is the production scale path.
const COLLECTIONS: { slug: string; title: string; label: string }[] = [
  { slug: "blogPosts", title: "headline", label: "Blog" },
  { slug: "articles", title: "title", label: "Article" },
  { slug: "pressReleases", title: "headline", label: "Press Release" },
  { slug: "events", title: "title", label: "Event" },
  { slug: "pages", title: "title", label: "Page" },
  { slug: "products", title: "name", label: "Product" },
  { slug: "caseStudies", title: "title", label: "Case Study" },
  { slug: "careers", title: "title", label: "Career" },
];

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const queries = COLLECTIONS.map(async (c) => {
    const res = await payloadFetch(
      `/api/${c.slug}?where[${c.title}][like]=${encodeURIComponent(q)}&limit=5&depth=0`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs ?? []).map((d: any) => ({
      collection: c.slug,
      label: c.label,
      id: d.id,
      title: d[c.title] ?? "(untitled)",
      status: d._status ?? "—",
      updatedAt: d.updatedAt,
    }));
  });

  const results = (await Promise.all(queries)).flat();
  return NextResponse.json({ results });
}
