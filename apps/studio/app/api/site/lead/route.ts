import { serviceFetch } from "@/lib/humain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC lead capture for generated landing pages. A native (no-JS) <form
// method="post" action="/api/site/lead"> on a served /site/<slug> page posts
// here; we record the lead and 303-redirect back with a thanks flag.
export async function POST(req: Request) {
  let name = "", email = "", message = "", siteSlug = "";
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const b = await req.json();
      name = String(b.name || ""); email = String(b.email || ""); message = String(b.message || ""); siteSlug = String(b.siteSlug || "");
    } else {
      const f = await req.formData();
      name = String(f.get("name") || ""); email = String(f.get("email") || ""); message = String(f.get("message") || ""); siteSlug = String(f.get("siteSlug") || "");
    }
  } catch { /* ignore */ }

  // Fall back to the /site/<slug> the form was submitted from.
  if (!siteSlug) {
    const ref = req.headers.get("referer") || "";
    siteSlug = ref.match(/\/site\/([^/?#]+)/)?.[1] || "";
  }

  if (email || name) {
    try {
      await serviceFetch("/api/leads", { method: "POST", body: JSON.stringify({ siteSlug: siteSlug.slice(0, 120), name: name.slice(0, 200), email: email.slice(0, 200), message: message.slice(0, 4000) }) });
    } catch { /* best-effort */ }
  }

  const back = siteSlug ? `/site/${siteSlug}?thanks=1` : "/?thanks=1";
  return new Response(null, { status: 303, headers: { Location: back } });
}
