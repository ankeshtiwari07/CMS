import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

// List the curated archetype library + the current user's own guidelines.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const arRes = await payloadFetch("/api/brandGuidelines?where[isArchetype][equals]=true&limit=50&depth=0");
    const mineRes = await payloadFetch(`/api/brandGuidelines?where[owner][equals]=${user.id}&where[isArchetype][equals]=false&sort=-updatedAt&limit=50&depth=0`);
    const archetypes = arRes.ok ? (await arRes.json()).docs ?? [] : [];
    const mine = mineRes.ok ? (await mineRes.json()).docs ?? [] : [];
    return NextResponse.json({ archetypes, mine });
  } catch {
    return NextResponse.json({ archetypes: [], mine: [] });
  }
}

// Create or update the user's own guideline.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const active = Boolean(body.active);
  const payload = {
    name: String(body.name || "My Brand Guideline").slice(0, 120),
    industry: body.industry || "",
    summary: body.summary || "",
    isArchetype: false,
    isActive: active,
    source: body.source || "custom",
    data: body.data || { sections: [] },
    owner: user.id,
  };
  try {
    // Only one active brand per owner — clear the others first.
    if (active) {
      const cur = await payloadFetch(`/api/brandGuidelines?where[owner][equals]=${user.id}&where[isActive][equals]=true&limit=50&depth=0`);
      if (cur.ok) {
        const docs = (await cur.json())?.docs ?? [];
        await Promise.all(docs
          .filter((d: any) => !body.id || String(d.id) !== String(body.id))
          .map((d: any) => payloadFetch(`/api/brandGuidelines/${d.id}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) })));
      }
    }
    let res;
    if (body.id) {
      res = await payloadFetch(`/api/brandGuidelines/${body.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      res = await payloadFetch("/api/brandGuidelines", { method: "POST", body: JSON.stringify(payload) });
    }
    const out = await res.json();
    return NextResponse.json({ ok: res.ok, doc: out.doc ?? out, active }, { status: res.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
