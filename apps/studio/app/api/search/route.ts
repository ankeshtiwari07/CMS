import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";
import { AI_URL } from "@/lib/env";

// Authoring-side search across content collections. Widened from title-only to
// also match body/summary text fields (Payload `like` = case-insensitive
// contains) via an OR query. Rich-text bodies aren't like-searchable (JSON), but
// the text/textarea fields (intro, summary, problem, overview, …) give real body
// coverage. The OpenSearch + pgvector hybrid index (apps/ai-service workers) is
// the production scale path. `fields[0]` is the display title.
const COLLECTIONS: { slug: string; label: string; fields: string[] }[] = [
  { slug: "blogPosts", label: "Blog", fields: ["headline", "hook", "cta", "problem", "conclusion", "examples"] },
  { slug: "articles", label: "Article", fields: ["title", "introduction", "conclusion"] },
  { slug: "pressReleases", label: "Press Release", fields: ["headline", "subHeadline", "opening", "quote", "companyInfo"] },
  { slug: "events", label: "Event", fields: ["title", "overview", "objectives", "targetAudience", "agenda", "speakers"] },
  { slug: "pages", label: "Page", fields: ["title"] },
  { slug: "products", label: "Product", fields: ["name", "summary"] },
  { slug: "caseStudies", label: "Case Study", fields: ["title", "challenge", "results"] },
  { slug: "careers", label: "Career", fields: ["title", "responsibilities", "requirements"] },
];

function mapDocs(c: { slug: string; label: string; fields: string[] }, docs: any[]) {
  return (docs ?? []).map((d: any) => ({
    collection: c.slug,
    label: c.label,
    id: d.id,
    title: d[c.fields[0]] ?? "(untitled)",
    status: d._status ?? "—",
    updatedAt: d.updatedAt,
  }));
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const enc = encodeURIComponent(q);

  const queries = COLLECTIONS.map(async (c) => {
    // OR across every searchable field.
    const orQs = c.fields.map((f, i) => `where[or][${i}][${f}][like]=${enc}`).join("&");
    let res = await payloadFetch(`/api/${c.slug}?${orQs}&limit=5&depth=0`);
    // Resilience: if a field is invalid for this collection's schema, the whole
    // OR query 4xx's — fall back to a title-only search so results still return.
    if (!res.ok) res = await payloadFetch(`/api/${c.slug}?where[${c.fields[0]}][like]=${enc}&limit=5&depth=0`);
    if (!res.ok) return [];
    const data = await res.json();
    return mapDocs(c, data.docs);
  });

  // De-dupe (a doc can match on multiple fields but the query already collapses per collection).
  const results = (await Promise.all(queries)).flat();

  // Semantic arm (hybrid): fuse pgvector matches from ai-service /search, deduped
  // against the keyword hits. Arabic-aware via the multilingual embedding model.
  const bySlug = new Map(COLLECTIONS.map((c) => [c.slug, c]));
  try {
    const sr = await fetch(`${AI_URL}/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q, locales: ["en", "ar"], limit: 20 }) });
    if (sr.ok) {
      const sj = await sr.json();
      const seen = new Set(results.map((r: any) => `${r.collection}:${r.id}`));
      for (const h of sj.hits ?? []) {
        const key = `${h.entity}:${h.entityId}`;
        if (seen.has(key) || !bySlug.has(h.entity)) continue;
        seen.add(key);
        results.push({ collection: h.entity, label: bySlug.get(h.entity)!.label, id: h.entityId, title: (h.content || "").trim().slice(0, 70) || "(semantic match)", status: "—", updatedAt: undefined, semantic: true, score: h.score } as any);
      }
    }
  } catch { /* semantic arm is optional — keyword results still return */ }

  return NextResponse.json({ results });
}
