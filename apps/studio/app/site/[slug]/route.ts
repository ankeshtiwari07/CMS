import { CMS_URL } from "@/lib/env";

// Serve an AI-generated website (published in the CMS) as a standalone HTML
// document at /site/<slug>. Public (not in the middleware-protected list);
// published aiwebsites are publicly readable so no auth token is needed.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(
      `${CMS_URL}/api/aiwebsites?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&limit=1&depth=0`,
      { cache: "no-store" },
    );
    if (!res.ok) return new Response("Not found", { status: 404 });
    const data = await res.json();
    const html = data.docs?.[0]?.html;
    if (!html) return new Response("Not found", { status: 404 });
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  } catch {
    return new Response("Unavailable", { status: 502 });
  }
}
